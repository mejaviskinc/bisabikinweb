#!/usr/bin/env python3
"""Render five user-approved Gen Z quotes using the original BisaBikinWeb Canva-matched feed.

This job ONLY creates owned media, validates the queue, and saves approved
records. Publication is exclusively handled by instagram_autopost.py through
the Meta Graph API, never by Metricool.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from PIL import Image
from instagram_render_canva_fontmatched import get_canvas_base, render
from instagram_autopost import eligible

ROOT = Path("social/instagram")
DRAFT = ROOT / "drafts/2026-11-09-original-five-quotes.json"
DEST = ROOT / "rendered/2026-11-09-original-five-quotes"
QUEUE = ROOT / "queue.json"
DATE = "2026-11-09"
SLOTS = ("08:45", "11:45", "14:45", "17:45", "20:45")
PUBLIC_ROOT = (
    "https://raw.githubusercontent.com/mejaviskinc/bisabikinweb/main/"
    "social/instagram/rendered/2026-11-09-original-five-quotes/"
)


def main() -> None:
    src = json.loads(DRAFT.read_text(encoding="utf-8"))
    items = src.get("items", [])
    if len(items) != 5:
        raise ValueError("Require exactly five approved original quote items")
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    rows = queue.get("items")
    if not isinstance(rows, list):
        raise ValueError("Invalid existing Instagram queue")
    if len({r.get("id") for r in rows}) != len(rows):
        raise ValueError("Existing queue contains duplicated content IDs")

    # This asset keeps the actual original Canva brand header/footer and
    # replaces only the center quote typography with the font-matched renderer.
    base = get_canvas_base()
    DEST.mkdir(parents=True, exist_ok=True)
    new_rows = []
    manifest = []
    for index, item in enumerate(items, start=1):
        expected_slot = SLOTS[index - 1]
        quote = str(item.get("quote", "")).strip()
        caption = str(item.get("caption", "")).strip()
        if item.get("no") != index or item.get("slot") != expected_slot:
            raise ValueError("Unexpected item ordering or posting slot")
        if not 12 <= len(quote) <= 240 or not 10 <= len(caption) <= 2200:
            raise ValueError("Invalid quote or caption length")
        if re.search(r"https?://", quote):
            raise ValueError("Quote must not contain external URLs")

        path = DEST / f"{index:02d}.jpg"
        poster = render(base, quote)
        poster.save(path, format="JPEG", quality=94, subsampling=0, optimize=True)
        with Image.open(path) as check:
            if check.format != "JPEG" or check.size != (1080, 1350):
                raise ValueError("Instagram poster must be a 1080x1350 JPEG")
        if path.stat().st_size > 8_000_000:
            raise ValueError("Rendered JPEG exceeds Meta's upload limit")

        record = {
            "id": f"bbweb-genz-five-20261109-{index:02d}",
            "date": DATE,
            "slot": expected_slot,
            "status": "approved",
            "fact_checked": True,
            "rights_verified": True,
            "rights_note": "Quotes orisinal dari percakapan pemilik BisaBikinWeb; artwork diturunkan dari template feed Canva milik pemilik akun.",
            "source_url": "https://bisabikinweb.site/",
            "image_url": PUBLIC_ROOT + path.name,
            "caption": caption,
            "category": str(item.get("category", "QUOTES GEN Z")),
        }
        eligible(record, DATE, expected_slot, dry_run=True)
        new_rows.append(record)
        manifest.append({
            "id": record["id"], "quote": quote, "file": str(path),
            "date": DATE, "slot": expected_slot,
            "dimensions": [1080, 1350], "format": "JPEG",
            "intent": "ONE_IMAGE_FEED_POST",
            "music": "Instagram's licensed music library not supported by Meta Graph API photo publishing",
        })
        print("RENDERED_ORIGINAL_QUOTE", index, path, path.stat().st_size, flush=True)

    existing_by_id = {r["id"]: r for r in rows}
    occupied = {(r.get("date"), r.get("slot")): r.get("id") for r in rows}
    for record in new_rows:
        key = (record["date"], record["slot"])
        if key in occupied and occupied[key] != record["id"]:
            raise ValueError(f"Occupied Instagram queue slot: {key}")
        existing = existing_by_id.get(record["id"])
        if existing is not None and existing != record:
            raise ValueError(f"Conflicting existing content ID: {record['id']}")
        if existing is None:
            rows.append(record)

    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DEST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    assert len([r for r in rows if r.get("id", "").startswith("bbweb-genz-five-20261109-")]) == 5
    print("FIVE_QUOTE_ASSETS_QUEUED_SAFELY; NO_POST_DURING_RENDER", flush=True)


if __name__ == "__main__":
    main()
