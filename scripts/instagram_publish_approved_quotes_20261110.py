#!/usr/bin/env python3
"""One-time owner-approved Instagram quote publication, 10 separate feed photos.
Uses ONLY GitHub Actions + Meta Graph API, and the original owner-controlled
brand master from the repository. No Welder or Metricool.
"""
from __future__ import annotations
import base64, datetime as dt, io, json, os, pathlib, re, time
import urllib.request, urllib.error
from zoneinfo import ZoneInfo
from PIL import Image
import instagram_render_canva_fontmatched as brand
from instagram_autopost import eligible, live_publish, github_state, meta

REPO = "mejaviskinc/bisabikinweb"
COMMAND = pathlib.Path("social/instagram/commands/publish-quotes-20261110.json")
PUBLIC_ORIGINAL = ("https://raw.githubusercontent.com/" + REPO +
                   "/main/social/instagram/rendered/2026-11-09-original-five-quotes/04.jpg")
DEST_PREFIX = "instagram-approved-quotes/20261110/"
PUBLIC_PREFIX = "https://raw.githubusercontent.com/" + REPO + "/instagram-assets/" + DEST_PREFIX

def get_original():
    request = urllib.request.Request(PUBLIC_ORIGINAL, headers={"User-Agent": "BisaBikinWeb/1.0"})
    with urllib.request.urlopen(request, timeout=35) as response:
        blob = response.read(8_000_001)
    with Image.open(io.BytesIO(blob)) as image:
        if image.format != "JPEG" or image.size != (1080,1350):
            raise RuntimeError("Original branded quote master is not a valid 1080x1350 JPEG")
        return image.convert("RGB")

def upload_owned_image(filename, payload):
    path = DEST_PREFIX + filename
    endpoint = "https://api.github.com/repos/" + REPO + "/contents/" + path
    token = os.environ["GITHUB_TOKEN"]
    body = json.dumps({
        "message": "media(instagram): approved single quote " + filename,
        "content": base64.b64encode(payload).decode("ascii"),
        "branch": "instagram-assets",
    }).encode("utf-8")
    request = urllib.request.Request(endpoint, data=body, method="PUT", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(request, timeout=55) as response:
        if response.status not in (200, 201):
            raise RuntimeError("Github image upload failed for " + filename)
    return PUBLIC_PREFIX + filename

def check_public_image(url):
    for attempt in range(16):
        try:
            request = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(request, timeout=15) as response:
                if response.status == 200 and "image/jpeg" in response.headers.get("Content-Type",""):
                    return
        except (urllib.error.URLError,TimeoutError):
            pass
        time.sleep(3)
    raise RuntimeError("SAFE_STOP: image not accessible to Meta; " + url)

def main():
    data = json.loads(COMMAND.read_text(encoding="utf-8"))
    items = data.get("items")
    if (data.get("account") != "bisabikinweb.id" or
        data.get("permission") != "PUBLISH_TEN_SINGLE_FEED_POSTS_NOW" or
        not isinstance(items, list) or len(items) != 10):
        raise RuntimeError("SAFE_STOP: wrong account or owner instruction")
    if len(set(x.get("id","") for x in items)) != 10:
        raise RuntimeError("SAFE_STOP: duplicate quote IDs")
    required = ["IG_ACCESS_TOKEN","IG_USER_ID","GITHUB_TOKEN","GITHUB_REPOSITORY"]
    if any(not os.environ.get(name) for name in required):
        raise RuntimeError("SAFE_STOP: Instagram/GitHub credentials missing")
    if os.environ.get("GITHUB_REPOSITORY") != REPO:
        raise RuntimeError("SAFE_STOP: unexpected repo")
    profile = meta("GET", os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"],
                   {"fields":"id,username"}, stage="PROFILE_ACCESS")
    if profile.get("username","").lower() != "bisabikinweb.id":
        raise RuntimeError("SAFE_STOP: not the requested Instagram account")
    state, _ = github_state(REPO, os.environ["GITHUB_TOKEN"])
    claimed = [x["id"] for x in items if x["id"] in state["entries"]]
    if claimed:
        raise RuntimeError("SAFE_STOP: already claimed post(s), inspect feed before rerun")
    brand.FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
    if not pathlib.Path(brand.FONT).exists():
        raise RuntimeError("SAFE_STOP: missing Inter font")
    base = get_original()
    for index, item in enumerate(items,1):
        quote = item.get("quote","")
        caption = item.get("caption","")
        if not isinstance(quote,str) or not 18 <= len(quote) <= 240:
            raise RuntimeError("SAFE_STOP: invalid quote length")
        if not isinstance(caption,str) or not 10 <= len(caption) <= 2200:
            raise RuntimeError("SAFE_STOP: invalid caption length")
        target = brand.render(base, quote)
        output=io.BytesIO()
        target.save(output,format="JPEG",quality=94,subsampling=0,optimize=True)
        payload=output.getvalue()
        if not 20_000 < len(payload) < 8_000_000:
            raise RuntimeError("SAFE_STOP: invalid image bytes")
        url=upload_owned_image("%02d.jpg" % index,payload)
        check_public_image(url)
        now=dt.datetime.now(ZoneInfo("Asia/Jakarta"))
        record={
          "id":item["id"],
          "date":now.date().isoformat(),
          "slot":now.strftime("%H:%M"),
          "status":"approved",
          "fact_checked":True,
          "rights_verified":True,
          "rights_note":"Owner-requested original quotes; original BisaBikinWeb brand master.",
          "source_url":"https://bisabikinweb.site/",
          "image_url":url,
          "caption":caption,
        }
        eligible(record,record["date"],record["slot"])
        live_publish(record)
        print("ONE_FEED_POST_CONFIRMED "+str(index)+"/10 "+item["id"],flush=True)
        if index < len(items): time.sleep(10)

if __name__ == "__main__":
    main()
