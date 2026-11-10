#!/usr/bin/env python3
"""Render exactly 200 original BisaBikinWeb quotes using the existing owner brand master.
No Metricool/Welder publishing or media needed. Offline-only; does NOT post.
"""
from __future__ import annotations
import datetime as dt
import json
import re
from collections import Counter
from pathlib import Path
from PIL import Image
from instagram_render_canva_fontmatched import render
from instagram_autopost import eligible

ROOT = Path("social/instagram")
DRAFT = ROOT / "drafts/2026-11-11-200-quotes.json"
MASTER = ROOT / "rendered/2026-11-09-original-five-quotes/04.jpg"
DEST = ROOT / "rendered/quotes-200-20261111"
QUEUE = ROOT / "quotes_200_queue.json"
PREFIX = ("https://raw.githubusercontent.com/mejaviskinc/bisabikinweb/main/"
          "social/instagram/rendered/quotes-200-20261111/")
SLOTS = ("08:45", "11:45", "14:45", "17:45", "20:45")
START = dt.date(2026, 11, 11)

def main():
    data = json.loads(DRAFT.read_text(encoding="utf-8"))
    items = data.get("items")
    if data.get("account") != "bisabikinweb.id" or not isinstance(items, list) or len(items) != 200:
        raise ValueError("Exactly 200 quotes required for intended account")
    if len({x.get("id") for x in items}) != 200 or len({x.get("quote", "").strip().casefold() for x in items}) != 200:
        raise ValueError("Duplicate quote or ID in the new batch")
    previous = json.loads((ROOT / "queue.json").read_text(encoding="utf-8"))["items"]
    existing_captions = {x.get("caption", "").split("\n")[0].casefold() for x in previous}
    if any(x["quote"].strip().casefold() in existing_captions for x in items):
        raise ValueError("Quote duplicates prior approved content")
    claimed = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))["entries"]
    if any(x["id"] in claimed for x in items):
        raise ValueError("Already claimed ID; do not re-render or republish")
    with Image.open(MASTER) as src:
        if src.format != "JPEG" or src.size != (1080, 1350):
            raise ValueError("Owned brand template is not the expected 1080x1350 JPEG")
        base = src.convert("RGB")
    DEST.mkdir(parents=True, exist_ok=True)
    out = []
    for index, row in enumerate(items, 1):
        day = START + dt.timedelta(days=(index - 1)//5)
        slot = SLOTS[(index - 1)%5]
        if (row.get("date"), row.get("slot")) != (day.isoformat(), slot):
            raise ValueError("Wrong date/slot in new batch")
        if row.get("id") != "bbweb-quotes-200-20261111-" + str(index).zfill(3):
            raise ValueError("Wrong ID ordering")
        quote = row.get("quote", "").strip()
        caption = row.get("caption", "").strip()
        if not 25 <= len(quote) <= 260 or not 10 <= len(caption) <= 2200:
            raise ValueError("Quote or caption outside safe bounds")
        if re.search(r"https?://", quote, re.I):
            raise ValueError("Unapproved links in quote")
        dest = DEST / (str(index).zfill(3) + ".jpg")
        poster = render(base, quote)
        poster.save(dest, "JPEG", quality=93, subsampling=0, optimize=True)
        with Image.open(dest) as verified:
            if verified.size != (1080, 1350) or verified.format != "JPEG":
                raise ValueError("Invalid output image")
        if not 20_000 < dest.stat().st_size <= 8_000_000:
            raise ValueError("Unexpected JPEG size")
        rec = {
            "id":row["id"],"date":day.isoformat(),"slot":slot,"status":"approved",
            "fact_checked":True,"rights_verified":True,
            "rights_note":"Owner-requested original quote; brand master owned by BisaBikinWeb.",
            "source_url":"https://bisabikinweb.site/",
            "image_url": PREFIX + dest.name,
            "caption":caption,"category":row.get("category", "QUOTES")
        }
        eligible(rec,rec["date"],rec["slot"],dry_run=True)
        out.append(rec)
        if index % 25 == 0: print("VERIFIED",index,"/200",flush=True)
    QUEUE.write_text(json.dumps({"items":out},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    assert len(list(DEST.glob("*.jpg"))) == 200
    assert len({(x["date"],x["slot"]) for x in out}) == 200
    print("BATCH_READY: 200 unique independently approved JPEG posts, 40 days, 5 per day. NO PUBLICATION.",flush=True)

if __name__ == "__main__":
    main()
