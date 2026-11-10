#!/usr/bin/env python3
"""Read-only 200 quotes + 60 carousels publishing health check for BisaBikinWeb.

Never submits a media publishing request, updates queue state, or retries a
claimed-but-not-confirmed Instagram item. Publishes an Actions summary and
raises an alarm if the confirmed progress is far behind the requested cadence.
"""
from __future__ import annotations
import datetime as dt
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

WIB=ZoneInfo("Asia/Jakarta")
QUOTE_START=dt.datetime(2026,11,10,23,35,tzinfo=WIB)
CAROUSEL_START=dt.datetime(2026,11,11,0,5,tzinfo=WIB)

def main():
    now=dt.datetime.now(WIB)
    root=Path("social/instagram")
    quote_rows=json.loads((root/"quotes_200_queue.json").read_text(encoding="utf8"))["items"]
    carousel_rows=json.loads((root/"carousels/2026-11-10-sixty.json").read_text(encoding="utf8"))["items"]
    entries=json.loads((root/"state.json").read_text(encoding="utf8"))["entries"]
    if len(quote_rows)!=200 or len(carousel_rows)!=60:
        raise RuntimeError("Input batch missing or changed")
    if len({x["id"] for x in quote_rows})!=200 or len({x["id"] for x in carousel_rows})!=60:
        raise RuntimeError("Duplicate IDs in expected batches")

    def expected(start,interval,total):
        if now < start: return 0
        return min(total,int((now-start).total_seconds()//interval)+1)
    q_due=expected(QUOTE_START,1200,200)
    c_due=expected(CAROUSEL_START,3600,60)

    def summarize(rows,due):
        confirmed=0
        in_review=[]
        for row in rows:
            record=entries.get(row["id"])
            if not record: continue
            if record.get("status")=="published" and str(record.get("instagram_media_id","")).isdigit():
                confirmed+=1
            else:
                in_review.append((row["id"],record.get("claimed_at"),record.get("status")))
        pending=max(0,due-confirmed)
        return confirmed,pending,in_review

    qc,qp,qr=summarize(quote_rows,q_due)
    cc,cp,cr=summarize(carousel_rows,c_due)
    unconfirmed=qr+cr
    summary=[
        "## BisaBikinWeb Instagram 200+60 publication audit",
        "",
        f"Checked (WIB): **{now.strftime('%Y-%m-%d %H:%M:%S')}**",
        "",
        "| Batch | Cadence | Due by now | Confirmed published | Behind schedule | Remaining total |",
        "|---|---|---:|---:|---:|---:|",
        f"| 200 single-photo quotes | 1/20 min | {q_due} | {qc} | {qp} | {200-qc} |",
        f"| 60 carousels | 1/hour | {c_due} | {cc} | {cp} | {60-cc} |",
        "",
        "**Note:** Meta rolling 24h limit and GitHub cron delays can defer jobs; do not auto-retry ambiguous claims.",
    ]
    if unconfirmed:
        summary.extend(["", "### Claimed without publication confirmation"])
        for key,when,status in unconfirmed[:15]:
            summary.append(f"- {key}: {status}, claimed_at={when}")
    txt="\n".join(summary)+"\n"
    print(txt,flush=True)
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf8") as out:out.write(txt)
    if qp>2 or cp>2 or unconfirmed:
        raise SystemExit("ALERT: Instagram publishing backlog or unconfirmed claim; inspect state and Meta. Never force re-post.")
    print("PUBLISH_HEALTH_OK",flush=True)

if __name__=="__main__":
    main()
