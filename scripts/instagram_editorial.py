#!/usr/bin/env python3
"""Curated mixed-editorial scheduler for the existing GitHub -> Meta publisher.

Old quote queue and publication state are preserved unchanged.
Only items explicitly reviewed in editorial/content.json can be selected.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path
from zoneinfo import ZoneInfo

from instagram_autopost import SafeStop, SLOTS, eligible
from instagram_prepare import render_image, upload_original_image, github_state, load_font

ROOT = Path("social/instagram")
BANK = ROOT / "editorial/content.json"
STATE = ROOT / "state.json"
RUNTIME = ROOT / ".runtime"
TZ = ZoneInfo("Asia/Jakarta")
MAX_DELAY_MINUTES = 90
ALLOWED_TYPES = {"news", "analysis", "education", "promotion"}


def load_items() -> list[dict]:
    payload = json.loads(BANK.read_text(encoding="utf-8"))
    if payload.get("max_posts_per_day") != 3 or payload.get("timezone") != "Asia/Jakarta":
        raise SafeStop("Editorial settings must be maximum 3 feed/day in Asia/Jakarta")
    items = payload.get("items")
    if not isinstance(items, list):
        raise SafeStop("Editorial items must be a list")
    return items


def read_state() -> dict:
    obj = json.loads(STATE.read_text(encoding="utf-8"))
    if not isinstance(obj.get("entries"), dict):
        raise SafeStop("Instagram publishing state invalid")
    return obj["entries"]


def normalize(s: str) -> str:
    return re.sub(r"\W+", " ", s.lower(), flags=re.UNICODE).strip()


def validate(items: list[dict]) -> None:
    if not items:
        raise SafeStop("No editorial items configured")
    keys, ids, headlines, captions = set(), set(), set(), set()
    daily = Counter()
    for item in items:
        if not isinstance(item, dict):
            raise SafeStop("Editorial entry must be an object")
        ident = item.get("id")
        date, slot = item.get("date"), item.get("slot")
        if ident in ids or (date, slot) in keys:
            raise SafeStop("Duplicate editorial ID or posting slot")
        ids.add(ident)
        keys.add((date, slot))
        day = dt.date.fromisoformat(date)
        if day < dt.date(2026, 11, 11) or slot not in SLOTS:
            raise SafeStop("Editorial date or WIB slot invalid")
        daily[date] += 1
        if item.get("type") not in ALLOWED_TYPES:
            raise SafeStop("Unsupported editorial category type")
        if item.get("status") != "approved" or item.get("fact_checked") is not True or item.get("rights_verified") is not True:
            raise SafeStop("Unreviewed editorial item is not publishable")
        if not item.get("rights_note") or not item.get("source_url"):
            raise SafeStop("Missing provenance or rights note")
        if dt.date.fromisoformat(item.get("expires_on", "1900-01-01")) < day:
            raise SafeStop("Editorial source expires before its publish date")
        published = dt.date.fromisoformat(item.get("source_published", "1900-01-01"))
        reviewed = dt.date.fromisoformat(item.get("reviewed_on", "1900-01-01"))
        if published > day or reviewed > day or reviewed < published:
            raise SafeStop("Invalid editorial source/review chronology")
        if item["type"] == "news" and (day - published).days > 3:
            raise SafeStop("News source older than 72h; recheck before publishing")
        title, summary = item.get("headline", ""), item.get("summary", "")
        if not 12 <= len(title) <= 85 or not 12 <= len(summary) <= 280:
            raise SafeStop("Editorial headline/summary cannot fit brand poster")
        for val, seen in ((normalize(title), headlines), (normalize(item.get("caption", "")), captions)):
            if not val or val in seen:
                raise SafeStop("Duplicate or empty editorial text")
            seen.add(val)
        mock = {
            "id": ident, "date": date, "slot": slot, "status": "approved",
            "caption": item["caption"], "source_url": item["source_url"],
            "rights_note": item["rights_note"], "fact_checked": True,
            "rights_verified": True, "image_url": "https://example.org/original.jpg",
        }
        eligible(mock, date, slot, dry_run=True)
    if max(daily.values()) > 3:
        raise SafeStop("More than 3 feed posts on one calendar date")
    print("EDITORIAL_VALIDATED items=" + str(len(items)) + " days=" + str(len(daily)))


def select(items: list[dict], state: dict, now: dt.datetime) -> dict | None:
    today = now.date().isoformat()
    current_minute = now.hour * 60 + now.minute
    candidates = []
    for item in items:
        if item["date"] != today or item["id"] in state:
            continue
        if dt.date.fromisoformat(item["expires_on"]) < now.date():
            continue
        hh, mm = map(int, item["slot"].split(":"))
        lag = current_minute - (hh * 60 + mm)
        if 0 <= lag <= MAX_DELAY_MINUTES:
            candidates.append(item)
    return sorted(candidates, key=lambda i: i["slot"])[0] if candidates else None


def write_output(**kwargs):
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as stream:
            for key, val in kwargs.items():
                stream.write(key + "=" + str(val) + "\n")



def render_editorial_image(item: dict, destination: Path) -> None:
    """Use the existing branded JPEG renderer, with neutral CTA for news."""
    render_image(item["category"], item["headline"], item["summary"], destination)
    if item["type"] != "promotion":
        from PIL import Image, ImageDraw
        with Image.open(destination) as original:
            canvas = original.convert("RGB")
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((75, 1170, 1005, 1248), radius=30, fill="#111C25")
        draw.text((110, 1187), "KONTEKS + SUMBER DI CAPTION", fill="#FFFFFF", font=load_font(28, True))
        canvas.save(destination, format="JPEG", quality=94, subsampling=0, optimize=True)
        with Image.open(destination) as check:
            if check.format != "JPEG" or check.size != (1080, 1350):
                raise SafeStop("Generated editorial artwork must be 1080x1350 JPEG")


def prepare(item: dict, now: dt.datetime) -> None:
    if os.getenv("GITHUB_REF") != "refs/heads/main" or os.getenv("IG_AUTOPUBLISH_ENABLED") != "true":
        raise SafeStop("Cannot upload editorial media outside active main workflow")
    if item["date"] != now.date().isoformat():
        raise SafeStop("Publish date must be today's WIB date")
    if dt.date.fromisoformat(item["expires_on"]) < now.date():
        raise SafeStop("Content has expired, re-review sources")
    required = ("GITHUB_TOKEN", "GITHUB_REPOSITORY", "IG_ACCESS_TOKEN", "IG_USER_ID")
    if any(not os.environ.get(k) for k in required):
        raise SafeStop("GitHub/Instagram credentials unavailable")
    state, _ = github_state(os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_TOKEN"])
    if item["id"] in state["entries"]:
        raise SafeStop("Editorial item already claimed/published; no duplicate")
    output_path = RUNTIME / (item["id"] + ".jpg")
    render_editorial_image(item, output_path)
    asset_path = "social/instagram/generated/" + item["id"] + ".jpg"
    image_url = upload_original_image(
        os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_TOKEN"], output_path, asset_path
    )
    record = {
        "id": item["id"], "date": item["date"], "slot": item["slot"],
        "status": "approved", "fact_checked": True, "rights_verified": True,
        "rights_note": item["rights_note"], "source_url": item["source_url"],
        "image_url": image_url, "caption": item["caption"], "category": item["category"],
    }
    eligible(record, record["date"], record["slot"], dry_run=False)
    queue_file = RUNTIME / (item["id"] + "-queue.json")
    queue_file.write_text(json.dumps({"items": [record]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_output(queue=str(queue_file), ready="true")
    print("EDITORIAL_MEDIA_READY " + item["id"] + " original_1080x1350_JPEG")


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--validate-only", action="store_true")
    group.add_argument("--select", action="store_true")
    group.add_argument("--prepare", action="store_true")
    group.add_argument("--render-preview", action="store_true")
    parser.add_argument("--date")
    parser.add_argument("--slot")
    args = parser.parse_args()
    try:
        items = load_items()
        validate(items)
        if args.validate_only:
            print("VALIDATE_ONLY; old quote queue untouched; no publication")
            return 0
        if args.render_preview:
            for item in items:
                output = RUNTIME / "editorial-preview" / (item["id"] + ".jpg")
                render_editorial_image(item, output)
                print("PREVIEW_READY", output, output.stat().st_size)
            return 0
        now = dt.datetime.now(TZ)
        state = read_state()
        if args.select:
            chosen = select(items, state, now)
            write_output(
                ready="true" if chosen else "false",
                date=chosen["date"] if chosen else "",
                slot=chosen["slot"] if chosen else "",
            )
            print("EDITORIAL_DUE " + chosen["id"] if chosen else "EDITORIAL_SKIP nothing due")
            return 0
        matching = [x for x in items if x["date"] == args.date and x["slot"] == args.slot]
        if len(matching) != 1:
            raise SafeStop("Prepare requires one reviewed editorial item")
        if matching[0]["id"] in state:
            raise SafeStop("Item already claimed/published; no retry")
        selected = select(items, state, now)
        if selected is None or selected["id"] != matching[0]["id"]:
            raise SafeStop("Selected item is no longer due or already expired")
        prepare(selected, now)
        return 0
    except (ValueError, TypeError, KeyError, SafeStop, OSError) as err:
        print("EDITORIAL_SAFE_STOP: " + str(err), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
