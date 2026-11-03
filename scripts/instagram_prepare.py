#!/usr/bin/env python3
"""Prepare one original, evergreen Instagram image + caption, optionally upload to public GitHub asset branch.

Published images are generated from original text and shapes. No scraping, news claims,
third-party photos, or API token handling outside GitHub Actions Secrets.
"""
import argparse
import base64
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from instagram_autopost import SLOTS, SafeStop, eligible, api, github_state

BANK = Path("social/instagram/evergreen_bank.json")
QUEUE = Path("social/instagram/queue.json")
OUTPUT_DIR = Path("social/instagram/.runtime")
BRANCH = "instagram-assets"
ACCOUNT = "bisabikinweb.id"


def say_output(ready, queue_path=""):
    path = os.getenv("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as output:
            output.write(f"ready={'true' if ready else 'false'}\n")
            if ready:
                output.write(f"queue={queue_path}\n")


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def choose_evergreen(bank, date, slot):
    start = dt.date.fromisoformat(bank["start_date"])
    day = dt.date.fromisoformat(date)
    offset = (day - start).days
    categories = {entry["slot"]: entry for entry in bank["categories"]}
    if slot not in categories:
        raise SafeStop("Slot tidak ada dalam konten evergreen")
    category = categories[slot]
    posts = category["items"]
    if offset < 0 or offset >= len(posts):
        return None
    item = posts[offset]
    if not 5 <= len(item["headline"]) <= 85 or not 12 <= len(item["summary"]) <= 280:
        raise SafeStop("Konten evergreen memiliki panjang yang tidak sesuai")
    return category["category"], item["headline"], item["summary"]


def original_caption(headline, summary):
    return (
        f"{headline}\n\n{summary}\n\n"
        "Punya ide website bisnis? Konsultasikan kebutuhanmu melalui DM "
        "@bisabikinweb.id atau kunjungi https://bisabikinweb.site/.\n\n"
        "#BisaBikinWeb #WebsiteBisnis #UMKMDigital #JasaWebsite"
    )


def make_item(date, slot, category, headline, summary, image_url):
    item = {
        "id": "bbweb-" + date.replace("-", "") + "-" + slot.replace(":", "") + "-evergreen",
        "date": date,
        "slot": slot,
        "status": "approved",
        "fact_checked": True,
        "rights_verified": True,
        "rights_note": "Poster orisinal dibuat otomatis dari teks dan bentuk milik BisaBikinWeb; bukan foto pihak ketiga.",
        "source_url": "https://bisabikinweb.site/",
        "image_url": image_url,
        "caption": original_caption(headline, summary),
        "category": category,
    }
    return eligible(item, date, slot)


def load_font(size, bold=False):
    from PIL import ImageFont
    filename = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    try:
        return ImageFont.truetype(filename, size)
    except OSError:
        return ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/" + filename, size
        )


def wrap_lines(draw, value, font, maximum_width):
    words = value.split()
    lines = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        width = draw.textbbox((0, 0), candidate, font=font)[2]
        if width > maximum_width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def fit_lines(draw, text, maximum_width, maximum_lines, sizes, bold=False):
    for size in sizes:
        font = load_font(size, bold)
        lines = wrap_lines(draw, text, font, maximum_width)
        if len(lines) <= maximum_lines:
            return font, lines
    raise SafeStop("Teks terlalu panjang untuk desain: perpendek judul atau ringkasan")


def render_image(category, headline, summary, dest):
    from PIL import Image, ImageDraw

    width, height = 1080, 1350
    img = Image.new("RGB", (width, height), "#F6F3EB")
    draw = ImageDraw.Draw(img)
    # Original graphic elements; no external photography.
    draw.rectangle((0, 0, width, 710), fill="#111C25")
    draw.ellipse((760, -190, 1320, 380), fill="#233641")
    draw.ellipse((-200, 540, 250, 950), fill="#E8DCC0")
    draw.ellipse((860, 590, 1330, 1100), fill="#ECE5D7")
    draw.rounded_rectangle((72, 80, 1008, 132), radius=12, fill="#263641")
    draw.text((102, 87), "</> BISABIKINWEB", fill="#F6F3EB", font=load_font(33, True))
    draw.rounded_rectangle((78, 190, 500, 248), radius=29, fill="#D9B887")
    draw.text((108, 198), category, fill="#111C25", font=load_font(28, True))
    title_font, title_lines = fit_lines(
        draw, headline, 905, 5, list(range(84, 49, -2)), True
    )
    title_y = 306
    for line in title_lines:
        draw.text((83, title_y), line, fill="#FFFFFF", font=title_font)
        title_y += title_font.size + 18

    draw.rounded_rectangle((76, 800, 1004, 1124), radius=32, fill="#FFFFFF")
    draw.rounded_rectangle((76, 800, 90, 1124), radius=6, fill="#D9B887")
    info_font, info_lines = fit_lines(
        draw, summary, 818, 5, list(range(43, 29, -2)), False
    )
    info_y = 853
    for line in info_lines:
        draw.text((124, info_y), line, fill="#293542", font=info_font)
        info_y += info_font.size + 13

    draw.rounded_rectangle((75, 1170, 1005, 1248), radius=30, fill="#111C25")
    draw.text((111, 1187), "PUNYA IDE WEBSITE? KONSULTASI YUK", fill="#FFFFFF", font=load_font(28, True))
    draw.text((83, 1281), "bisabikinweb.site", fill="#354650", font=load_font(24, True))
    draw.text((740, 1281), "@bisabikinweb.id", fill="#354650", font=load_font(23))
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, format="JPEG", quality=91, optimize=True, progressive=False)
    with Image.open(dest) as check:
        if check.size != (1080, 1350) or check.format != "JPEG":
            raise SafeStop("Generated image is not a valid 1080x1350 JPEG")
    if dest.stat().st_size > 8_000_000:
        raise SafeStop("Generated JPEG too large")


def verify_public_image(image_url):
    for _ in range(8):
        try:
            req = urllib.request.Request(image_url, method="HEAD", headers={"User-Agent": "Bisabikinweb-IG/1.0"})
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200 and response.headers.get("Content-Type", "").lower().startswith("image/jpeg"):
                    return
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
            pass
        time.sleep(4)
    raise SafeStop("Gambar yang diunggah belum dapat dibaca publik; tidak akan publish")


def upload_original_image(repository, github_token, local_file, remote_path):
    if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
        raise SafeStop("GitHub repository tidak valid")
    file_url = f"https://api.github.com/repos/{repository}/contents/{remote_path}"
    raw_content = base64.b64encode(local_file.read_bytes()).decode("ascii")
    api("PUT", file_url, github_token, data={
        "message": "media(instagram): publish owned image " + local_file.stem,
        "content": raw_content,
        "branch": BRANCH,
    })
    image_url = f"https://raw.githubusercontent.com/{repository}/{BRANCH}/{remote_path}"
    verify_public_image(image_url)
    return image_url


def require_active():
    if os.getenv("GITHUB_REF") != "refs/heads/main" or os.getenv("IG_AUTOPUBLISH_ENABLED") != "true":
        raise SafeStop("Publikasi belum aktif atau bukan branch main")
    required = ("IG_ACCESS_TOKEN", "IG_USER_ID", "GITHUB_TOKEN", "GITHUB_REPOSITORY")
    if any(not os.getenv(k) for k in required):
        raise SafeStop("Token Instagram / user ID / izin GitHub belum lengkap")


def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=dt.datetime.now(ZoneInfo("Asia/Jakarta")).date().isoformat())
    parser.add_argument("--slot", required=True, choices=SLOTS)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    try:
        dt.date.fromisoformat(args.date)
        bank = load_json(BANK)
        queue = load_json(QUEUE)
        matching = [p for p in queue.get("items", []) if p.get("date") == args.date and p.get("slot") == args.slot]
        if len(matching) > 1:
            raise SafeStop("Ada beberapa konten manual untuk tanggal dan jam yang sama")
        if matching:
            if matching[0].get("status") != "approved":
                print("SKIP: konten manual belum disetujui; tidak menggantinya dengan konten lain")
                say_output(False)
                return 0
            eligible(matching[0], args.date, args.slot, args.dry_run)
            selected = matching[0]
            output_queue = QUEUE
            prepared = "verified manual queue"
        else:
            result = choose_evergreen(bank, args.date, args.slot)
            if result is None:
                print("SKIP: stok evergreen habis atau tanggal di luar periode; tidak mengulang konten")
                say_output(False)
                return 0
            category, headline, summary = result
            generated_id = "bbweb-" + args.date.replace("-", "") + "-" + args.slot.replace(":", "") + "-evergreen"
            image_file = OUTPUT_DIR / (generated_id + ".jpg")
            render_image(category, headline, summary, image_file)
            if args.dry_run:
                url = "https://raw.githubusercontent.com/mejaviskinc/bisabikinweb/instagram-assets/social/instagram/generated/" + generated_id + ".jpg"
            else:
                require_active()
                gh_token, repo = os.environ["GITHUB_TOKEN"], os.environ["GITHUB_REPOSITORY"]
                state, _ = github_state(repo, gh_token)
                if generated_id in state["entries"]:
                    print("SKIP: ID sudah diklaim atau dipublikasikan; jangan terbitkan ulang")
                    say_output(False)
                    return 0
                url = upload_original_image(repo, gh_token, image_file,
                                            "social/instagram/generated/" + generated_id + ".jpg")
            selected = make_item(args.date, args.slot, category, headline, summary, url)
            output_queue = OUTPUT_DIR / "runtime_queue.json"
            output_queue.write_text(json.dumps({"items": [selected]}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            prepared = "original evergreen card"
        print(f"PREPARED: {prepared} / item={selected['id']} / {args.date} / {args.slot}")
        say_output(True, str(output_queue))
        return 0
    except (SafeStop, OSError, ValueError, KeyError, TypeError) as exc:
        print("SAFE_STOP: " + str(exc), file=sys.stderr)
        say_output(False)
        return 2


if __name__ == "__main__":
    sys.exit(run())
