#!/usr/bin/env python3
"""BisaBikinWeb Instagram: dry-run by default; fail-closed when publishing."""
import argparse, base64, datetime as dt, json, os, re, sys, time
import urllib.parse, urllib.request, urllib.error
from pathlib import Path
from zoneinfo import ZoneInfo

SLOTS = ("09:00", "10:30", "12:30", "16:30", "18:30")
STATE = "social/instagram/state.json"

class SafeStop(Exception):
    pass

def eligible(item, date, slot, dry_run=False):
    required = ("id", "date", "slot", "caption", "image_url", "source_url", "rights_note")
    if any(not isinstance(item.get(k), str) or not item[k].strip() for k in required):
        raise SafeStop("Data konten belum lengkap")
    if (item["date"], item["slot"], item.get("status")) != (date, slot, "approved"):
        raise SafeStop("Tanggal, slot, atau persetujuan konten tidak sesuai")
    if item.get("fact_checked") is not True or item.get("rights_verified") is not True:
        raise SafeStop("Verifikasi fakta dan hak gambar wajib")
    if item.get("simulation_only") and not dry_run:
        raise SafeStop("Konten simulasi dilarang terbit")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{3,75}", item["id"]):
        raise SafeStop("ID konten tidak valid")
    if not 10 <= len(item["caption"]) <= 2200:
        raise SafeStop("Caption harus 10-2200 karakter")
    for key in ("image_url", "source_url"):
        url = urllib.parse.urlsplit(item[key])
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            raise SafeStop("Semua URL harus HTTPS")
    if not urllib.parse.urlsplit(item["image_url"]).path.lower().endswith((".jpg", ".jpeg")):
        raise SafeStop("Gunakan gambar JPEG publik, bukan PNG/WebP")
    return item

def find_item(queue, date, slot):
    rows = queue.get("items")
    if not isinstance(rows, list):
        raise SafeStop("queue.json membutuhkan array items")
    if len({item.get("id") for item in rows}) != len(rows):
        raise SafeStop("ID konten duplikat")
    found = [r for r in rows if r.get("date") == date and r.get("slot") == slot and r.get("status") == "approved"]
    if len(found) != 1:
        raise SafeStop(f"Diperlukan tepat satu konten approved, ditemukan {len(found)}")
    return found[0]

def api(method, url, token, form=None, data=None):
    headers = {"Authorization": "Bearer " + token, "Accept": "application/json"}
    body = None
    if form is not None:
        body = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    try:
        req = urllib.request.Request(url, headers=headers, data=body, method=method)
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        # Never show the authorization token or unredacted provider response.
        raise SafeStop(f"Provider HTTP {exc.code}; periksa dashboard; jangan retry otomatis") from None
    except (urllib.error.URLError, ValueError, TimeoutError):
        raise SafeStop("Permintaan jaringan gagal; cek status secara manual") from None

def meta(method, path, token, params=None):
    base = os.getenv("IG_GRAPH_BASE", "https://graph.facebook.com")
    version = os.getenv("IG_GRAPH_VERSION", "v26.0")
    if base not in ("https://graph.facebook.com", "https://graph.instagram.com"):
        raise SafeStop("Host Meta API tidak valid")
    if not re.fullmatch(r"v\d+\.0", version):
        raise SafeStop("Versi Graph API tidak valid")
    url = f"{base}/{version}/{path}"
    if method == "GET" and params:
        url += "?" + urllib.parse.urlencode(params)
    return api(method, url, token, form=params if method == "POST" else None)

def github_state(repository, token):
    if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
        raise SafeStop("GITHUB_REPOSITORY tidak valid")
    url = f"https://api.github.com/repos/{repository}/contents/{STATE}?ref=main"
    response = api("GET", url, token)
    data = json.loads(base64.b64decode(response["content"]).decode())
    if not isinstance(data.get("entries"), dict):
        raise SafeStop("State tidak valid")
    return data, response["sha"]

def write_state(repository, token, state, sha, message):
    encoded = base64.b64encode((json.dumps(state, indent=2) + "\n").encode()).decode()
    url = f"https://api.github.com/repos/{repository}/contents/{STATE}"
    result = api("PUT", url, token, data={"message": message, "content": encoded, "sha": sha, "branch": "main"})
    return result["content"]["sha"]

def live_publish(item):
    if os.getenv("IG_AUTOPUBLISH_ENABLED") != "true" or os.getenv("GITHUB_REF") != "refs/heads/main":
        raise SafeStop("Auto-publish terkunci; hanya branch main yang diizinkan")
    required = ("IG_ACCESS_TOKEN", "IG_USER_ID", "GITHUB_TOKEN", "GITHUB_REPOSITORY")
    if any(not os.getenv(name) for name in required):
        raise SafeStop("Kredensial belum lengkap")
    token, user_id = os.environ["IG_ACCESS_TOKEN"], os.environ["IG_USER_ID"]
    gh_token, repo = os.environ["GITHUB_TOKEN"], os.environ["GITHUB_REPOSITORY"]
    if not re.fullmatch(r"\d{8,30}", user_id):
        raise SafeStop("IG_USER_ID harus ID numerik profesional")
    profile = meta("GET", user_id, token, {"fields": "id,username"})
    if profile.get("username", "").lower() != "bisabikinweb.id":
        raise SafeStop("Akun tidak cocok dengan @bisabikinweb.id")

    state, sha = github_state(repo, gh_token)
    if item["id"] in state["entries"]:
        raise SafeStop("Konten pernah diklaim: jangan ulangi; cek state dan Instagram")
    # Commit a durable claim *before* contacting the publishing endpoints.
    state["entries"][item["id"]] = {"status": "claimed", "date": item["date"], "slot": item["slot"],
        "claimed_at": dt.datetime.now(dt.timezone.utc).isoformat()}
    sha = write_state(repo, gh_token, state, sha, "claim instagram content " + item["id"])
    container = meta("POST", user_id + "/media", token,
                     {"image_url": item["image_url"], "caption": item["caption"]})
    cid = str(container.get("id", ""))
    if not cid.isdigit():
        raise SafeStop("Container Meta tidak jelas; klaim tetap dicatat")
    for i in range(8):
        status = meta("GET", cid, token, {"fields": "status_code"}).get("status_code")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise SafeStop("Container bermasalah; klaim tetap dicatat")
        if i != 7:
            time.sleep(5)
    else:
        raise SafeStop("Container belum siap; cek manual sebelum mengulang")
    published = meta("POST", user_id + "/media_publish", token, {"creation_id": cid})
    mid = str(published.get("id", ""))
    if not mid.isdigit():
        raise SafeStop("Tidak ada konfirmasi publikasi; klaim tetap dicatat")
    state["entries"][item["id"]].update({"status": "published", "instagram_media_id": mid})
    write_state(repo, gh_token, state, sha, "instagram published " + item["id"])
    print("PUBLISHED item=" + item["id"] + " media_id=" + mid)

def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--queue", default="social/instagram/queue.json")
    parser.add_argument("--slot", required=True, choices=SLOTS)
    parser.add_argument("--date", default=dt.datetime.now(ZoneInfo("Asia/Jakarta")).date().isoformat())
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--publish", action="store_true")
    args = parser.parse_args(argv)
    try:
        queue = json.loads(Path(args.queue).read_text(encoding="utf-8"))
        item = eligible(find_item(queue, args.date, args.slot), args.date, args.slot, args.dry_run)
        if args.dry_run:
            print(f"DRY_RUN_OK item={item['id']} {args.date} {args.slot}; no Meta calls / no publishing")
        else:
            live_publish(item)
        return 0
    except (SafeStop, OSError, ValueError, KeyError) as exc:
        print("SAFE_STOP: " + str(exc), file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
