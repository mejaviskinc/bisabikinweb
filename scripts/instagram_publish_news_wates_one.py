#!/usr/bin/env python3
"""One-time approved news carousel, from licensed real station photos and original brand artwork.
Publish exactly three separate slides in ONE Instagram carousel via Meta API.
No Metricool, Welder, generated scene, news image hotlink, or auto-retry on uncertain publish.
"""
from __future__ import annotations
import datetime as dt
import io
import json
import os
import re
import time
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont, ImageOps
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta
from instagram_carousel60_publish_one import upload_once, image_available, quota_available
from instagram_render_news_pillow import canva_brand_art, paste_canva_ink

REPO = "mejaviskinc/bisabikinweb"
CMD = Path("social/instagram/news-carousels/commands/publish-manahan-wates-now-20261111.json")
PHOTO_URLS = [
    "https://upload.wikimedia.org/wikipedia/commons/d/d3/Stasiun_Wates_2021.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a1/Stasiun_Wates.jpg",
]
PHOTO_LICENSE_PAGES = [
    "https://commons.wikimedia.org/wiki/File:Stasiun_Wates_2021.jpg",
    "https://commons.wikimedia.org/wiki/File:Stasiun_Wates.jpg",
]
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
WIB = ZoneInfo("Asia/Jakarta")
MEDIA_PREFIX = "instagram-news-carousels/20261111-manahan-wates/"

def get_picture(url: str) -> Image.Image:
    if url not in PHOTO_URLS:
        raise SafeStop("Unexpected, unlicensed image source")
    req = urllib.request.Request(url, headers={"User-Agent": "BisaBikinWebNews/1.0 (https://bisabikinweb.site; editorial-license-check)", "Accept": "image/jpeg"})
    with urllib.request.urlopen(req, timeout=40) as res:
        body = res.read(8_000_001)
    if not 50_000 <= len(body) <= 8_000_000:
        raise SafeStop("Licensed source photo download size not acceptable")
    with Image.open(io.BytesIO(body)) as picture:
        if picture.format != "JPEG" or min(picture.size) < 1000:
            raise SafeStop("Licensed photo not suitable for Instagram")
        return ImageOps.exif_transpose(picture).convert("RGB")

def fit_lines(draw, phrase, max_width=900, max_height=290):
    for size in range(81, 43, -1):
        font = ImageFont.truetype(FONT,size)
        lines = []
        acc = ""
        for word in phrase.split():
            candidate = (acc + " " + word).strip()
            if acc and draw.textbbox((0,0),candidate,font=font)[2] > max_width:
                lines.append(acc)
                acc = word
            else:
                acc = candidate
        if acc:
            lines.append(acc)
        step = round(size * 1.16)
        if 2 <= len(lines) <= 5 and len(lines) * step <= max_height:
            return font,lines,step
    raise SafeStop("Headline too long for approved layout")

def render_picture(picture, heading, brand_art):
    W,H,PHOTO_H = 1080,1350,945
    # Photo is an authentic archival image of this station; cropping is disclosed
    # in the CC BY-SA attribution included in the Instagram caption.
    photo = ImageOps.fit(picture,(W,PHOTO_H),Image.Resampling.LANCZOS,centering=(.50,.46))
    surface = Image.new("RGB",(W,H),"white")
    surface.paste(photo,(0,0))
    drawer = ImageDraw.Draw(surface)
    # Original reference: left-aligned soft-grey badge at the bottom of photo.
    drawer.rounded_rectangle((-16,835,440,934),radius=18,fill=(219,218,216))
    drawer.rounded_rectangle((17,853,104,918),radius=13,fill=(228,211,186))
    paste_canva_ink(surface,brand_art,(34,212,80,258),(28,859,98,913))
    paste_canva_ink(surface,brand_art,(94,191,378,235),(118,852,402,902))
    paste_canva_ink(surface,brand_art,(94,237,378,260),(118,897,390,923))
    drawer=ImageDraw.Draw(surface)
    font,lines,step=fit_lines(drawer,heading)
    ypos=1007
    for line in lines:
        drawer.text((100,ypos),line,font=font,fill=(3,3,3))
        ypos+=step
    if ypos > 1337:
        raise SafeStop("Headline overlaps lower edge")
    result=io.BytesIO()
    surface.save(result,format="JPEG",quality=93,subsampling=0,optimize=True)
    payload=result.getvalue()
    if not 30_000 < len(payload) < 8_000_000:
        raise SafeStop("Rendered news JPEG invalid")
    with Image.open(io.BytesIO(payload)) as checked:
        if checked.format!="JPEG" or checked.size!=(1080,1350):
            raise SafeStop("Rendered image dimensions invalid")
    return payload

def main():
    cmd=json.loads(CMD.read_text(encoding="utf8"))
    if cmd.get("approved_to_publish_now") is not True or cmd.get("account")!="bisabikinweb.id":
        raise SafeStop("News carousel not approved for this Instagram account")
    if cmd.get("id")!="bbweb-news-carousel-manahan-wates-20261111-001":
        raise SafeStop("News post ID does not match owner-approved command")
    if cmd.get("source_url")!="https://jogja.antaranews.com/berita/867071/ka-manahan-berhenti-di-stasiun-wates-mulai-1-desember-2026":
        raise SafeStop("Source article not verified")
    if cmd.get("photo_license_pages")!=PHOTO_LICENSE_PAGES:
        raise SafeStop("Photo license evidence does not match approved original files")
    headings=cmd.get("slides",[])
    if not isinstance(headings,list) or len(headings)!=3 or len(set(headings))!=3:
        raise SafeStop("Require exactly 3 distinct editorial news slides")
    if not Path(FONT).exists():
        raise SafeStop("Inter Display Bold unavailable: do not substitute typeface")
    if os.getenv("GITHUB_REF")!="refs/heads/main" or os.getenv("GITHUB_REPOSITORY")!=REPO:
        raise SafeStop("Unexpected GitHub repository/branch")
    token=os.environ.get("GITHUB_TOKEN","")
    if not token or not os.environ.get("IG_ACCESS_TOKEN") or not os.environ.get("IG_USER_ID"):
        raise SafeStop("Required Meta/GitHub credentials absent")
    state,_=github_state(REPO,token)
    if cmd["id"] in state["entries"]:
        print("SKIP_ALREADY_CLAIMED_NEVER_REPOST",cmd["id"],flush=True)
        return
    profile=meta("GET",os.environ["IG_USER_ID"],os.environ["IG_ACCESS_TOKEN"],{"fields":"id,username"},stage="PROFILE_ACCESS")
    if profile.get("username","").lower()!="bisabikinweb.id":
        raise SafeStop("Unexpected Meta Instagram profile")
    if not quota_available(os.environ["IG_ACCESS_TOKEN"],os.environ["IG_USER_ID"]):
        raise SafeStop("Meta content publishing quota exceeded, never force post")
    brand_art,_=canva_brand_art()
    pictures=[get_picture(url) for url in PHOTO_URLS]
    urls=[]
    for number,heading in enumerate(headings,1):
        photo=pictures[0 if number in (1,3) else 1]
        payload=render_picture(photo,heading,brand_art)
        name=MEDIA_PREFIX+f"slide_{number:02d}.jpg"
        url=upload_once(name,payload)
        image_available(url)
        urls.append(url)
        print("VERIFIED_NEWS_SLIDE",number,heading,flush=True)
    now=dt.datetime.now(WIB)
    item={
        "id":cmd["id"],"date":now.date().isoformat(),"slot":now.strftime("%H:%M"),
        "caption":cmd["caption"],"source_url":cmd["source_url"],
        "rights_note":"Station archive photos CC BY-SA 4.0, authors RaFaDa20631 and A2613. Cropped, overlaid official unmodified brand logo. Specific license URLs in caption.",
        "rights_verified":True,"fact_checked":True,"status":"approved","image_urls":urls,
    }
    eligible(item,item["date"],item["slot"])
    print("PUBLISH_NEWS_CAROUSEL_WITH_VERIFIED_SOURCE_AND_LICENSE",flush=True)
    live_publish(item)
    print("NEWS_CAROUSEL_PUBLISHED_CONFIRMED",cmd["id"],flush=True)

if __name__=="__main__":
    try:main()
    except (SafeStop,ValueError,KeyError,OSError,urllib.error.URLError) as exc:
        raise SystemExit("SAFE_STOP: "+str(exc))
