#!/usr/bin/env python3
"""Select one due original BisaBikinWeb quote from the 25-per-day Nov 9-12 batch.

Does not contact Meta or publish. Reads the queue + anti-duplicate state.
Called by a serialized GitHub Actions workflow every ~20 minutes.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path("social/instagram")
COUNTS = {
    "2026-11-09": 25,
    "2026-11-10": 25,
    "2026-11-11": 25,
    "2026-11-12": 11,
}
START_MINUTE = 7 * 60
SLOTS = tuple(f"{(START_MINUTE + 40 * i) // 60:02d}:{(START_MINUTE + 40 * i) % 60:02d}" for i in range(25))
OLD_QUOTE = re.compile(r"^bbweb-q\d{3}-")


def load_queue() -> list[dict]:
    obj = json.loads((ROOT / "queue.json").read_text(encoding="utf-8"))
    items = obj.get("items")
    if not isinstance(items, list):
        raise ValueError("Instagram queue must contain an items list")
    return items


def load_state() -> dict:
    obj = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    entries = obj.get("entries")
    if not isinstance(entries, dict):
        raise ValueError("Instagram state must contain entries object")
    return entries


def validate(items: list[dict], state: dict) -> None:
    keys = [(x.get("date"), x.get("slot")) for x in items]
    ids = [x.get("id") for x in items]
    if len(set(keys)) != len(keys) or len(set(ids)) != len(ids):
        raise ValueError("Duplicate Instagram queue slot or ID")
    originals = [x for x in items if isinstance(x.get("id"), str) and OLD_QUOTE.match(x["id"])]
    if len(originals) != 90:
        raise ValueError(f"Expected original collection of 90 quotes, got {len(originals)}")
    scheduled = [x for x in originals if x.get("date") in COUNTS and "original_scheduled_date" in x]
    if len(scheduled) != 86:
        raise ValueError(f"Expected 86 remaining original quotes, got {len(scheduled)}")
    for day, count in COUNTS.items():
        for i, row in enumerate(sorted((x for x in scheduled if x.get("date") == day), key=lambda r: r["slot"])):
            if i >= count or row["slot"] != SLOTS[i]:
                raise ValueError(f"Invalid slot layout on {day}; expected 40-minute spacing")
            if row.get("status") != "approved" or row.get("rights_verified") is not True:
                raise ValueError("Only approved, rights-verified quotes may publish")
            if row["id"] in state and state[row["id"]].get("status") not in ("claimed", "published"):
                raise ValueError("Unrecognized Instagram claim state")
        if sum(x.get("date") == day for x in scheduled) != count:
            raise ValueError(f"{day} must have exactly {count} prepared posts")
    print("BATCH_VALIDATED: 86 remaining original quotes, schedule=25+25+25+11")


def select(items: list[dict], state: dict, now: dt.datetime) -> dict | None:
    day = now.date().isoformat()
    if day not in COUNTS:
        print(f"NO_POST: outside batch 2026-11-09..12, now={day}")
        return None
    made = [r for r in items if r.get("date") == day and OLD_QUOTE.match(str(r.get("id", ""))) and "original_scheduled_date" in r
            and r.get("id") in state and state[r["id"]].get("status") == "published"]
    claimed = [r for r in items if r.get("date") == day and OLD_QUOTE.match(str(r.get("id", ""))) and "original_scheduled_date" in r
               and r.get("id") in state and state[r["id"]].get("status") == "claimed"]
    if len(made) >= 25:
        print("NO_POST: 25 originals already published today")
        return None
    if claimed:
        # The idempotent state guard excludes these IDs. Other approved posts
        # remain safe to publish even if one attempt needs manual review.
        print(f"WARNING: {len(claimed)} claimed posts require manual audit; no retry of those IDs")
    current_time = now.strftime("%H:%M")
    due = [r for r in items if r.get("date") == day
           and OLD_QUOTE.match(str(r.get("id", ""))) and "original_scheduled_date" in r
           and r.get("slot", "") <= current_time
           and r.get("status") == "approved"
           and r["id"] not in state]
    due.sort(key=lambda r: r["slot"])
    if not due:
        print(f"NO_POST: no unclaimed quote due at {day} {current_time}")
        return None
    selected = due[0]
    print("DUE_QUOTE:", selected["id"], selected["date"], selected["slot"])
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    items, state = load_queue(), load_state()
    validate(items, state)
    if args.validate_only:
        print("VALIDATE_ONLY: read-only; no publication")
        return
    now = dt.datetime.now(ZoneInfo("Asia/Jakarta"))
    due = select(items, state, now)
    output = os.getenv("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as stream:
            stream.write("ready=" + str(due is not None).lower() + "\n")
            stream.write("slot=" + (due["slot"] if due else "") + "\n")
            stream.write("date=" + (due["date"] if due else "") + "\n")
    print("SELECTOR_COMPLETE")


if __name__ == "__main__":
    main()
