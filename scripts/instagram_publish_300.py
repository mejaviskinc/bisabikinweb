#!/usr/bin/env python3
"""Continue 300 original quotes only after the old batch is fully confirmed.
Called by existing shared 20-minute publisher; no competing cron.
"""
import datetime as dt
import json
from pathlib import Path
from zoneinfo import ZoneInfo
from instagram_autopost import eligible, live_publish, SafeStop

ROOT = Path("social/instagram")
QUEUE = ROOT/"quotes_300_queue.json"
DEST = ROOT/"rendered/quotes-300-20261125"
ID = "bbweb-quotes-300-20261125-"
OLD_ID = "bbweb-quotes-200-20261111-"

def publish_next(entries, quota_available):
    if not QUEUE.is_file():
        print("WAIT_FOR_300_RENDER")
        return
    rows = json.loads(QUEUE.read_text(encoding="utf-8"))["items"]
    if len(rows) != 300 or any(r["id"] != ID+f"{i:03d}" for i,r in enumerate(rows,1)):
        raise SafeStop("Invalid 300 queue")
    # Ambiguous claims need manual review, never force repost.
    for r in rows:
        if r["id"] in entries:
            e = entries[r["id"]]
            if e.get("status") != "published" or not str(e.get("instagram_media_id","")).isdigit():
                raise SafeStop("Unconfirmed 300 quote claim; review before resuming")
    now = dt.datetime.now(dt.timezone.utc)
    times = []
    for key,e in entries.items():
        if key.startswith((OLD_ID,ID)):
            stamp = e.get("claimed_at")
            if not isinstance(stamp,str):
                raise SafeStop("Missing prior quote timestamp")
            t = dt.datetime.fromisoformat(stamp)
            if t.tzinfo is None:
                raise SafeStop("Invalid prior quote timestamp")
            times.append(t)
    confirmed = sum(r["id"] in entries for r in rows)
    print(f"BATCH_300_CONFIRMED {confirmed}/300",flush=True)
    if confirmed == 300:
        print("COMPLETE_300")
        return
    if times and (now-max(times)).total_seconds()<1200:
        print("WAIT_NEXT_20_MINUTE_WINDOW")
        return
    for i,r in enumerate(rows,1):
        if r["id"] in entries:
            continue
        if not (DEST/f"{i:03d}.jpg").is_file():
            raise SafeStop("Missing 300 quote media")
        if not quota_available():
            print("SAFE_QUOTA_SKIP")
            return
        item = dict(r)
        local = now.astimezone(ZoneInfo("Asia/Jakarta"))
        item["date"],item["slot"] = local.date().isoformat(),local.strftime("%H:%M")
        eligible(item,item["date"],item["slot"])
        live_publish(item)
        print(f"ONE_300_QUOTE_PUBLISHED index={i}/300",flush=True)
        return
