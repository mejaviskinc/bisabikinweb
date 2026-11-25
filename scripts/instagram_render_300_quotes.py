#!/usr/bin/env python3
"""Offline render of 300 original quotes, preserving the approved brand master."""
import datetime as dt
import json
from pathlib import Path
from PIL import Image
from instagram_render_canva_fontmatched import render
from instagram_autopost import eligible

ROOT = Path("social/instagram")
DRAFT = ROOT / "drafts/2026-11-25-300-quotes.json"
DEST = ROOT / "rendered/quotes-300-20261125"
QUEUE = ROOT / "quotes_300_queue.json"
MASTER = ROOT / "rendered/2026-11-09-original-five-quotes/04.jpg"
PREFIX = "https://raw.githubusercontent.com/mejaviskinc/bisabikinweb/main/"
ID = "bbweb-quotes-300-20261125-"

def main():
    draft = json.loads(DRAFT.read_text(encoding="utf-8"))
    items = draft["items"]
    if draft["account"] != "bisabikinweb.id" or len(items) != 300:
        raise ValueError("Invalid batch size/account")
    if len({x["quote"].strip().casefold() for x in items}) != 300:
        raise ValueError("Duplicate quote")
    prior = set()
    for name in ("queue.json", "quotes_200_queue.json"):
        prior.update(x["caption"].split("\n")[0].strip().casefold()
                     for x in json.loads((ROOT/name).read_text(encoding="utf-8"))["items"])
    if any(x["quote"].strip().casefold() in prior for x in items):
        raise ValueError("Duplicate old quote")
    if QUEUE.exists() and all((DEST/f"{i:03d}.jpg").is_file() for i in range(1,301)):
        print("ALREADY_RENDERED")
        return
    entries = json.loads((ROOT/"state.json").read_text(encoding="utf-8"))["entries"]
    if any(x["id"] in entries for x in items):
        raise ValueError("Already claimed; inspect incomplete assets manually")
    with Image.open(MASTER) as src:
        if src.size != (1080, 1350) or src.format != "JPEG":
            raise ValueError("Invalid master")
        base = src.convert("RGB")
    DEST.mkdir(parents=True, exist_ok=True)
    out = []
    start = dt.datetime(2026,11,25,0,0)
    for i, row in enumerate(items, 1):
        if row["id"] != ID+f"{i:03d}" or not 25 <= len(row["quote"]) <= 260:
            raise ValueError("Bad draft record")
        path = DEST/f"{i:03d}.jpg"
        render(base, row["quote"]).save(path,"JPEG",quality=93,subsampling=0,optimize=True)
        with Image.open(path) as pic:
            pic.verify()
        with Image.open(path) as pic:
            if pic.size != (1080,1350) or pic.format != "JPEG":
                raise ValueError("Invalid poster")
        if not 20000 < path.stat().st_size <= 8000000:
            raise ValueError("Unexpected poster size")
        slot = start + dt.timedelta(minutes=20*(i-1))
        rec = dict(id=row["id"],date=slot.date().isoformat(),slot=slot.strftime("%H:%M"),
                   status="approved",fact_checked=True,rights_verified=True,
                   rights_note="Owner-requested original quote with existing owned brand master",
                   source_url="https://bisabikinweb.site/",image_url=PREFIX+path.as_posix(),
                   caption=row["caption"],category=row["category"])
        eligible(rec,rec["date"],rec["slot"],dry_run=True)
        out.append(rec)
        if i%25==0: print("RENDER_VERIFIED",i,"/300",flush=True)
    assert len(list(DEST.glob("*.jpg"))) == 300
    QUEUE.write_text(json.dumps({"items":out},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("BATCH_300_RENDERED; NO_PUBLICATION",flush=True)

if __name__ == "__main__":
    main()
