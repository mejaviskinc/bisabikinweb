#!/usr/bin/env python3
"""Read-only growth analytics. Never creates or publishes Meta media."""
import argparse
import collections
import datetime as dt
import json
import os
import re
import statistics
import sys
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Jakarta")
ROOT = Path("social/instagram")
SLOTS = ("07:00", "10:00", "12:30", "16:30", "19:30")
METRICS = ("views", "reach", "shares", "saved", "likes", "comments")
EXPECTED = "bisabikinweb.id"

def category(key):
    if "news" in key: return "news"
    if "quote" in key or re.search(r"-q[0-9]+-", key): return "quotes"
    if "carousel" in key: return "carousel"
    if "reel" in key: return "reels"
    return "other"

def stamp(record):
    try:
        value = dt.datetime.fromisoformat(record.get("published_at") or record["claimed_at"])
        return value.astimezone(TZ) if value.tzinfo else None
    except (ValueError, TypeError, KeyError, AttributeError):
        return None

def audit(entries, now):
    days = {str(now.date()-dt.timedelta(days=i)): 0 for i in range(7)}
    groups = collections.Counter()
    today = []
    unknown = 0
    for key, rec in entries.items():
        if rec.get("status") != "published": continue
        when = stamp(rec)
        if when is None:
            unknown += 1
            continue
        if str(when.date()) in days and when <= now:
            days[str(when.date())] += 1
            groups[category(key)] += 1
        if when.date() == now.date() and when <= now:
            today.append(when)
    return {"source":"GitHub publication state; timestamps may be claim times, not verified Meta publish times",
            "daily_last_7":dict(sorted(days.items())), "format_last_7":dict(groups),
            "today":len(today), "unknown_timestamp":unknown,
            "target_daily":5, "remaining_target":max(0,5-len(today)),
            "recommendation":"Review legacy streams; avoid additional automatic posts today" if len(today)>=5 else "Review approved content for remaining slots",
            "experimental_slots_wib":list(SLOTS), "enforced":False}

class Meta:
    def __init__(self):
        self.token = os.environ.get("IG_ACCESS_TOKEN","").strip()
        self.uid = os.environ.get("IG_USER_ID","").strip()
        self.base = os.environ.get("IG_GRAPH_BASE","https://graph.facebook.com").rstrip("/")
        self.version = os.environ.get("IG_GRAPH_VERSION","v26.0")
        if self.base not in ("https://graph.facebook.com","https://graph.instagram.com") or not re.fullmatch(r"v[0-9]+\.0",self.version) or not re.fullmatch(r"[0-9]{8,30}",self.uid) or not self.token:
            raise RuntimeError("Meta configuration unavailable or invalid")
    def get(self, path, **params):
        if not re.fullmatch(r"[0-9]+(?:/(?:insights|media))?",path):
            raise RuntimeError("Invalid Meta path")
        url = self.base+"/"+self.version+"/"+path+"?"+urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"Authorization":"Bearer "+self.token,"Accept":"application/json"},method="GET")
        try:
            with urllib.request.urlopen(req,timeout=15) as res:
                return json.load(res)
        except urllib.error.HTTPError as exc:
            return {"unavailable":"HTTP_"+str(exc.code)}
        except (OSError, ValueError):
            return {"unavailable":"NETWORK_OR_RESPONSE"}
    def verify(self):
        p=self.get(self.uid,fields="id,username")
        if str(p.get("id"))!=self.uid or str(p.get("username","")).lower()!=EXPECTED:
            raise RuntimeError("Instagram account identity not verified")

def numeric_metric(payload, name):
    for item in payload.get("data",[]):
        if item.get("name")!=name: continue
        values=item.get("values") or []
        val=(item.get("total_value") or {}).get("value")
        if val is None and len(values)==1: val=values[0].get("value")
        if isinstance(val,(int,float)) and not isinstance(val,bool) and val>=0: return val
    return None

def rank(rows):
    # Compare within age bands to avoid giving older posts an automatic advantage.
    groups=collections.defaultdict(list)
    for row in rows:
        m=row["metrics"]; age=row["age_hours"]
        if age<24 or m.get("views") is None: continue
        band="1-3d" if age<72 else "3-7d" if age<168 else "7-30d"
        groups[(row["format"],band)].append(row)
    out=[]
    for (fmt,band), items in sorted(groups.items()):
        if len(items)<3: continue
        baseline=statistics.median(r["metrics"]["views"] for r in items)
        for row in items:
            m=row["metrics"]; reach=m.get("reach")
            rate=(m["shares"]+m["saved"])/reach if reach and m.get("shares") is not None and m.get("saved") is not None else None
            out.append({"id":row["id"],"format":fmt,"age_band":band,"sample":len(items),
                        "views":m["views"],"views_vs_median":round(m["views"]/baseline,3) if baseline else None,
                        "share_save_rate":round(rate,4) if rate is not None else None,
                        "slot_wib":row["slot_wib"]})
    return sorted(out,key=lambda x:(x["views_vs_median"] if x["views_vs_median"] is not None else -1,x["share_save_rate"] if x["share_save_rate"] is not None else -1),reverse=True)

def collect(entries, now, meta, limit):
    meta.verify()
    candidates=[]
    for key, rec in entries.items():
        when=stamp(rec); mid=str(rec.get("instagram_media_id",""))
        if rec.get("status")=="published" and when and 0<=(now-when).total_seconds()<30*86400 and re.fullmatch(r"[0-9]{8,30}",mid):
            candidates.append((when,key,mid))
    rows=[]; seen=set()
    for when,key,mid in sorted(candidates,reverse=True):
        if mid in seen: continue
        if len(rows)>=limit: break
        seen.add(mid)
        metrics={}
        # Request individually so one unsupported metric cannot erase the others.
        for metric in METRICS:
            metrics[metric]=numeric_metric(meta.get(mid+"/insights",metric=metric),metric)
        if category(key)=="reels":
            metric="ig_reels_avg_watch_time"
            metrics[metric]=numeric_metric(meta.get(mid+"/insights",metric=metric),metric)
        rows.append({"id":key,"format":category(key),"age_hours":round((now-when).total_seconds()/3600,2),
                     "slot_wib":when.strftime("%H:%M"),"metrics":metrics})
    coverage=sum(r["metrics"]["views"] is not None for r in rows)
    ranking=rank(rows)
    return {"source":"Meta media insights, lifetime per sampled post; not account-level 30-day views",
            "sampled":len(rows),"views_available":coverage,"posts":rows,"top_comparable":ranking[:5],
            "recommendation":"Test variants of top comparable content; keep experimental slots until enough matched observations" if ranking else "Insufficient comparable data; retain experiment, do not infer a winning slot",
            "account_views":None,"non_follower_reach":None,"leads":None}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--live",action="store_true")
    p.add_argument("--output",type=Path)
    p.add_argument("--limit",type=int,default=20,choices=range(1,51),metavar="1-50")
    a=p.parse_args()
    if a.live and (a.output is None or not a.output.is_absolute()):
        p.error("Live report requires absolute private output path outside repository")
    if a.live and a.output.resolve().is_relative_to(Path.cwd().resolve()):
        p.error("Live report cannot be saved inside repository")
    now=dt.datetime.now(TZ)
    entries=json.loads((ROOT/"state.json").read_text())["entries"]
    report={"generated_at":now.isoformat(),"audit":audit(entries,now)}
    if a.live:
        report["insights"]=collect(entries,now,Meta(),a.limit)
        if not report["insights"]["views_available"]:
            raise RuntimeError("Meta views unavailable; verify insights permissions")
    if a.output:
        # Exclusive creation prevents accidental overwrites and follows no symlinks.
        fd=os.open(a.output,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,"w") as f: json.dump(report,f,indent=2)
        print("Report created; no private values printed")
    else:
        print(json.dumps(report,indent=2))
    return 0

if __name__=="__main__":
    try: sys.exit(main())
    except (RuntimeError,OSError,ValueError,KeyError,TypeError):
        print("GROWTH_SAFE_STOP: configuration, permissions, data or output unavailable",file=sys.stderr)
        sys.exit(2)
