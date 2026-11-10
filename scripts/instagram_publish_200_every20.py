#!/usr/bin/env python3
"""One original quote each ~20 minutes from 10 Nov 2026 23:35 WIB.
Selection is state-based, never republishes a claimed item and never bursts.
Uses the existing GitHub-owned 200 JPEGs and the Meta Graph API directly.
"""
from __future__ import annotations
import datetime as dt
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

from instagram_autopost import eligible, github_state, live_publish, meta, SafeStop

WIB = ZoneInfo("Asia/Jakarta")
START = dt.datetime(2026, 11, 10, 23, 35, tzinfo=WIB)
INTERVAL_SECONDS = 20 * 60
REPO = "mejaviskinc/bisabikinweb"
QUEUE = Path("social/instagram/quotes_200_queue.json")
IMAGE_DIR = Path("social/instagram/rendered/quotes-200-20261111")

def quota_available():
    """Fail closed on uncertain provider quota; 25 if Meta omits the limit."""
    token = os.environ.get("IG_ACCESS_TOKEN", "")
    user_id = os.environ.get("IG_USER_ID", "")
    if not token or not user_id.isdigit():
        raise SafeStop("Meta credentials unavailable")
    response = meta("GET", user_id + "/content_publishing_limit", token,
                    {"fields": "quota_usage,config"}, stage="CHECK_META_QUOTA")
    payload = response.get("data")
    entry = payload[0] if isinstance(payload, list) and payload else response
    if not isinstance(entry, dict):
        raise SafeStop("Meta quota response not understood")
    try:
        used = int(entry["quota_usage"])
        config = entry.get("config") if isinstance(entry.get("config"), dict) else {}
        total = int(config.get("quota_total", 25))
    except (KeyError, TypeError, ValueError):
        raise SafeStop("Meta quota missing required usage field")
    if used < 0 or total <= 0:
        raise SafeStop("Invalid Meta quota values")
    print(f"META_LIMIT used={used} max={total} available={used < total}", flush=True)
    return used < total

def main():
    if os.getenv("GITHUB_REPOSITORY") != REPO or os.getenv("GITHUB_REF") != "refs/heads/main":
        raise SafeStop("Wrong repo/branch: no publishing")
    now = dt.datetime.now(WIB)
    if now < START:
        print("WAIT_FOR_START", START.isoformat())
        return
    rows = json.loads(QUEUE.read_text(encoding="utf-8"))["items"]
    if len(rows) != 200 or len({x.get("id") for x in rows}) != 200:
        raise SafeStop("Expected exactly 200 unique quote records")
    due_count = min(len(rows), int((now - START).total_seconds() // INTERVAL_SECONDS) + 1)
    state, _ = github_state(REPO, os.environ["GITHUB_TOKEN"])
    entries = state["entries"]
    # A primary and fallback GitHub cron for the same 20-minute window must
    # never create two different posts. State is the authority across runs.
    recent_attempts = []
    for key, value in entries.items():
        if not key.startswith("bbweb-quotes-200-20261111-") or not isinstance(value, dict):
            continue
        timestamp = value.get("claimed_at")
        if isinstance(timestamp, str):
            try:
                recent_attempts.append(dt.datetime.fromisoformat(timestamp))
            except ValueError:
                pass
    if recent_attempts:
        last = max(recent_attempts)
        seconds_since = (dt.datetime.now(dt.timezone.utc) - last).total_seconds()
        if seconds_since < 17 * 60:
            print(f"WAIT_NEXT_20MIN_WINDOW: {round((17*60-seconds_since)/60,1)} minutes", flush=True)
            return
    selected = None
    for index, item in enumerate(rows[:due_count], start=1):
        if item["id"] in entries:
            continue
        if item.get("status") != "approved" or not item.get("rights_verified"):
            raise SafeStop("Unapproved quote in due queue")
        image = IMAGE_DIR / f"{index:03d}.jpg"
        if not image.is_file():
            raise SafeStop("Media not committed to GitHub: " + str(image))
        selected = (index, item)
        break
    if selected is None:
        print(f"NO_UNPUBLISHED_DUE_POSTS due={due_count}", flush=True)
        return
    if not quota_available():
        print("SAFE_QUOTA_SKIP: resume automatically on a later 20-minute tick", flush=True)
        return
    index, source = selected
    item = dict(source)
    item["date"] = now.date().isoformat()
    item["slot"] = now.strftime("%H:%M")
    eligible(item, item["date"], item["slot"])
    print(f"POST_ONE_ONLY index={index}/200 id={item['id']} WIB={now.isoformat()}", flush=True)
    live_publish(item)
    print(f"ONE_QUOTE_PUBLISHED index={index}/200", flush=True)

if __name__ == "__main__":
    try:
        main()
    except (SafeStop, OSError, ValueError, KeyError) as exc:
        raise SystemExit("SAFE_STOP: " + str(exc))
