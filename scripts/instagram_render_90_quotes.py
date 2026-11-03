#!/usr/bin/env python3
"""Render 90 quote images from the user's *actual* Canva-derived image.

The base is the first already-published 2026-11-03 post, uploaded by the
account owner with Canva artwork. This retains the exact header logo, beige
icon, three lower footer icons and their original text. Pillow replaces ONLY
the central quote text region (0,216)-(1080,1138).
No AI illustrations, external photographs, or fabricated factual images.
"""
from __future__ import annotations
import io
import json
import os
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat

ROOT=Path("social/instagram/rendered/2026-11-04-to-12")
SOURCE=Path("social/instagram/drafts/2026-11-04-to-12-90-quotes.json")
W,H=1080,1350
QUOTE_REGION=(0,210,1080,1143)
PAPER=(255,255,255)
TEXT=(0,0,0)
# Original Canva design asset was supplied by owner and already delivered
# to the owner's Metricool media library for a published quote.
OWNER_TEMPLATE="https://static.metricool.com/planner/202611/7727294-file-16266071073116126624.jpeg"
FONT_CHOICES=[
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
]

def load_base():
    request=urllib.request.Request(OWNER_TEMPLATE,headers={"User-Agent":"Mozilla/5.0"})
    for n in range(3):
        try:
            with urllib.request.urlopen(request,timeout=28) as r:
                raw=r.read()
            image=Image.open(io.BytesIO(raw)).convert("RGB")
            if image.size != (W,H):
                raise ValueError(f"Canva original design has unexpected size {image.size}")
            print("CANVA_ORIGINAL_HEADER_AND_FOOTER_REUSED",len(raw),image.size,flush=True)
            return image
        except Exception as exc:
            print("SOURCE_FETCH_RETRY",str(exc)[:180],flush=True)
            time.sleep(2*n+2)
    raise RuntimeError("Unable to fetch actual owner Canva source artwork; refuse approximate replacement.")

def font(sz):
    for path in FONT_CHOICES:
        if os.path.isfile(path):
            return ImageFont.truetype(path,sz)
    raise RuntimeError("No TTF available")

def layout(draw,text):
    # User's Canva quotes are oversized, bold, left aligned with x≈105.
    max_width=W-210
    max_height=854
    for sz in range(92,47,-1):
        f=font(sz)
        words=text.split()
        rows=[]; cur=""
        for word in words:
            attempt=(cur+" "+word).strip()
            if cur and draw.textbbox((0,0),attempt,font=f,stroke_width=0)[2]>max_width:
                rows.append(cur);cur=word
            else: cur=attempt
        if cur:rows.append(cur)
        # Keep original Canva's generous text lines.
        advance=round(sz*1.18)
        if len(rows)<=9 and len(rows)*advance<=max_height:
            return f,rows,advance
    raise ValueError("Cannot fit quote to 1080×1350 layout: "+text)

def render(base,item):
    image=base.copy()
    d=ImageDraw.Draw(image)
    # Remove only the previous quote; original header/footer pixels retained.
    d.rectangle(QUOTE_REGION,fill=PAPER)
    f,rows,advance=layout(d,item["quote"])
    content_h=len(rows)*advance
    start=max(235,min(830,round(670-content_h/2)))
    # Make long sentences use a constant upper margin if the block is tall.
    if start+content_h>1114:start=1114-content_h
    for i,row in enumerate(rows):
        d.text((105,start+i*advance),row,font=f,fill=TEXT)
    out=ROOT/f'{item["no"]:03d}.jpg'
    out.parent.mkdir(parents=True,exist_ok=True)
    image.save(out,format="JPEG",quality=92,optimize=True,subsampling=0)
    with Image.open(out) as check:
        if check.size!=(W,H) or check.format!="JPEG":
            raise ValueError("Output validation failed "+str(out))
    print(f'QUOTE_RENDER_OK {item["no"]} {out} {out.stat().st_size}',flush=True)
    return out

def main():
    data=json.loads(SOURCE.read_text(encoding="utf-8"))
    items=data["items"]
    assert len(items)==90 and len(set(x["quote"] for x in items))==90
    source=load_base()
    saved=[]
    for item in items:
        output=render(source,item)
        saved.append({"no":item["no"],"quote":item["quote"],"image":output.name,
                      "schedule_date":item["date"],"schedule_time":item["time"],
                      "status":"IMAGE_DRAFT_RENDERED_NOT_PUBLISHED"})
    (ROOT/"render_manifest.json").write_text(json.dumps(saved,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Nine day-by-day mini contact sheets keep visual review manageable.
    for day in range(9):
        batch=saved[day*10:(day+1)*10]
        contact=Image.new("RGB",(5*222+6*16,2*285+3*16+40),(239,239,239))
        cd=ImageDraw.Draw(contact)
        cd.text((16,10),f'BisaBikinWeb  /  {batch[0]["schedule_date"]}  /  Quotes',font=font(19),fill=TEXT)
        for p,item in enumerate(batch):
            with Image.open(ROOT/item["image"]) as img:
                tile=img.resize((222,277),Image.Resampling.LANCZOS)
            contact.paste(tile,(16+(p%5)*(222+16),48+(p//5)*(277+12)))
        fname=f'preview_{batch[0]["schedule_date"]}.jpg'
        contact.save(ROOT/fname,format="JPEG",quality=88,optimize=True)
        print("DAY_PREVIEW",fname,flush=True)
    print("ALL_90_IMAGES_RENDERED_NOT_PUBLISHED",flush=True)

if __name__=="__main__":
    main()
