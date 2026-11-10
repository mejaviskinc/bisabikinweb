#!/usr/bin/env python3
"""Publish exactly ONE BisaBikinWeb original 3-6 slide carousel per invocation.

Source of truth: social/instagram/carousels/2026-11-10-sixty.json.
Render owner-branded white bold cards with the approved GitHub brand master.
Stage media on owner-controlled GitHub instagram-assets branch, then publish
via the existing Meta Graph API only. Never uses Welder or Metricool.
"""
from __future__ import annotations

import base64
import datetime as dt
import io
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta

REPO = "mejaviskinc/bisabikinweb"
WIB = ZoneInfo("Asia/Jakarta")
MANIFEST = Path("social/instagram/carousels/2026-11-10-sixty.json")
BRAND_MASTER = Path("social/instagram/rendered/2026-11-09-original-five-quotes/04.jpg")
BRANCH = "instagram-assets"
PREFIX = "instagram-60-carousels/20261110/"
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
MAX_UPLOAD = 8_000_000


def get_master():
    if not BRAND_MASTER.is_file():
        raise SafeStop("Owner-approved GitHub branded master is missing")
    with Image.open(BRAND_MASTER) as image:
        if image.size != (1080, 1350) or image.format != "JPEG":
            raise SafeStop("Owner-approved branded master has unexpected format")
        base = image.convert("RGB")
    # Remove only previous quote text, not the original header/footer.
    ImageDraw.Draw(base).rectangle((0, 210, 1080, 1143), fill="white")
    return base


def tracked_width(font, text, track):
    return font.getlength(text) + max(0, len(text)-1)*track


def wrap(font, text, track, maxwidth=920):
    lines, current = [], ""
    for word in text.split():
        proposed = (current + " " + word).strip()
        if current and tracked_width(font, proposed, track) > maxwidth:
            lines.append(current)
            current = word
        else:
            current = proposed
    if current:
        lines.append(current)
    return lines


def image_jpeg(base, text):
    result = base.copy()
    drawer = ImageDraw.Draw(result)
    area_top, area_bottom = 252, 1100
    for size in range(100, 47, -2):
        font = ImageFont.truetype(FONT, size)
        track = -0.042 * size
        lines = wrap(font, text, track)
        leading = round(size * 1.14)
        height = leading * len(lines)
        if len(lines) <= 10 and height <= area_bottom-area_top-20:
            break
    else:
        raise SafeStop("Carousel slide too long to fit safely")
    start_y = max(area_top, min(area_bottom-height, round((area_top+area_bottom-height)/2)))
    for index, line in enumerate(lines):
        x = 76.0
        y = start_y + index*leading
        for ch in line:
            drawer.text((round(x), y), ch, font=font, fill=(0, 0, 0))
            x += font.getlength(ch) + track
    output = io.BytesIO()
    result.save(output, "JPEG", quality=92, subsampling=0, optimize=True)
    payload = output.getvalue()
    if not 25_000 < len(payload) < MAX_UPLOAD:
        raise SafeStop("Invalid rendered JPEG size")
    return payload


def owner_asset_url(path):
    return f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/{path}"


def upload_once(path, payload):
    endpoint = f"https://api.github.com/repos/{REPO}/contents/{path}"
    token = os.environ["GITHUB_TOKEN"]
    url = endpoint + "?ref=" + BRANCH
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "User-Agent": "BisaBikinWeb-AutoPost/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            existing = json.load(r)
        if existing.get("type") == "file" and existing.get("sha"):
            print("MEDIA_ALREADY_STAGED", path, flush=True)
            return owner_asset_url(path)
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise SafeStop(f"GitHub asset lookup HTTP {exc.code}") from None
    body = json.dumps({
        "message": "media(instagram): stage approved carousel asset",
        "content": base64.b64encode(payload).decode("ascii"),
        "branch": BRANCH,
    }).encode("utf-8")
    post = urllib.request.Request(endpoint, data=body, method="PUT", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "BisaBikinWeb-AutoPost/1.0",
    })
    try:
        with urllib.request.urlopen(post, timeout=60) as response:
            if response.status not in (200, 201):
                raise SafeStop("GitHub rejected asset staging")
    except urllib.error.HTTPError as exc:
        raise SafeStop(f"GitHub asset upload HTTP {exc.code}") from None
    print("STAGED_OWNED_IMAGE", path, flush=True)
    return owner_asset_url(path)


def image_available(url):
    for attempt in range(12):
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "BisaBikinWeb-AutoPost/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200 and "image/jpeg" in resp.headers.get("Content-Type", ""):
                    return
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
            pass
        time.sleep(3)
    raise SafeStop("Image URL not available for Meta ingestion")


def quota_available(token, user_id):
    response = meta("GET", user_id + "/content_publishing_limit", token,
                    {"fields":"quota_usage,config"}, stage="CHECK_META_QUOTA")
    data = response.get("data")
    info = data[0] if isinstance(data, list) and data else response
    if not isinstance(info, dict):
        raise SafeStop("Unknown Meta content quota response")
    try:
        used = int(info["quota_usage"])
        cfg = info.get("config") if isinstance(info.get("config"), dict) else {}
        total = int(cfg.get("quota_total",25))
    except (ValueError, TypeError, KeyError):
        raise SafeStop("Meta quota usage missing")
    if not 0 <= used or not 1 <= total:
        raise SafeStop("Invalid Meta quota")
    print(f"META_QUOTA used={used} total={total}", flush=True)
    return used < total


def main():
    if os.getenv("GITHUB_REPOSITORY") != REPO or os.getenv("GITHUB_REF") != "refs/heads/main":
        raise SafeStop("Only owner repository main may publish")
    if os.getenv("IG_AUTOPUBLISH_ENABLED") != "true":
        raise SafeStop("Owner publishing gate not enabled")
    if any(not os.getenv(key) for key in ("IG_ACCESS_TOKEN", "IG_USER_ID", "GITHUB_TOKEN")):
        raise SafeStop("Instagram or GitHub credentials missing")
    if not Path(FONT).is_file():
        raise SafeStop("Inter Display Bold font not installed")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    items = manifest.get("items")
    if manifest.get("account") != "bisabikinweb.id" or not isinstance(items, list) or len(items) != 60:
        raise SafeStop("Invalid 60-carousel input")
    if sum(len(x.get("slides", [])) for x in items) != 296:
        raise SafeStop("Slide count changed from approved original")
    if len({x["id"] for x in items}) != 60:
        raise SafeStop("Duplicate IDs")
    # No selection by dates: oldest remaining unclaimed, one per workflow run.
    state, _ = github_state(REPO, os.environ["GITHUB_TOKEN"])
    target = next((x for x in items if x["id"] not in state["entries"]), None)
    if target is None:
        print("COMPLETE: all 60 carousels already claimed or published", flush=True)
        return
    token = os.environ["IG_ACCESS_TOKEN"]
    user_id = os.environ["IG_USER_ID"]
    profile = meta("GET", user_id, token, {"fields":"id,username"}, stage="PROFILE_ACCESS")
    if profile.get("username", "").lower() != "bisabikinweb.id":
        raise SafeStop("Unexpected Instagram account")
    if not quota_available(token, user_id):
        print("QUOTA_SKIP: Meta publishing quota reached; try next scheduled hour", flush=True)
        return
    pages = target["slides"]
    if not 3 <= len(pages) <= 6 or any(not 18 <= len(s.strip()) <= 260 for s in pages):
        raise SafeStop("Carousel slide content out of bounds")

    base = get_master()
    urls = []
    for index, text in enumerate(pages, start=1):
        path = f"{PREFIX}{target['number']:03d}/slide_{index:02d}.jpg"
        url = upload_once(path, image_jpeg(base, text))
        image_available(url)
        urls.append(url)
    now = dt.datetime.now(WIB)
    record = {
        "id": target["id"],
        "date": now.date().isoformat(),
        "slot": now.strftime("%H:%M"),
        "status": "approved",
        "fact_checked": True,
        "rights_verified": True,
        "rights_note": "Owner-produced original carousel text and owned BisaBikinWeb design master.",
        "source_url": "https://bisabikinweb.site/",
        "image_urls": urls,
        "caption": target["caption"],
    }
    eligible(record, record["date"], record["slot"])
    print(f"START_CAROUSEL {target['number']}/60 slides={len(urls)} id={record['id']}", flush=True)
    live_publish(record)
    print(f"PUBLISHED_CAROUSEL {target['number']}/60 slides={len(urls)}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (SafeStop, OSError, ValueError, KeyError) as exc:
        print("SAFE_STOP: " + str(exc), file=sys.stderr)
        raise SystemExit(2)
