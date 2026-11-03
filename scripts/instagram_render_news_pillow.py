#!/usr/bin/env python3
"""Render five BisaBikinWeb editorial feed drafts from original source images with Pillow.

- No AI-generated photo, no Canva export, no Instagram publication.
- Uses a fixed 1080x1350 editorial layout matched to the established Canva master:
  photo 0..794, cream brand chip 675..794, centered headline 860..1160,
  READ MORE + original-source attribution at the bottom.
- Treats the first four source-image reuse permissions as *unverified*;
  rendering a draft is NOT permission to publish commercially.
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

W, H = 1080, 1350
PHOTO_H = 795
PANEL = "#FCFBF8"
CREAM = "#E6D9C1"
INK = "#1C252B"
MUTED = "#5F6668"
BORDER = "#DFDED9"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
SOURCES = {
    1: ("OJK", "https://ojk.go.id/PublishingImages/WhatsApp%20Image%202026-10-30%20at%2011.17.13.jpeg"),
    2: ("DJP", "https://www.pajak.go.id/sites/default/files/2026-10/Panel%20Discussion.JPG"),
    3: ("GOOGLE", "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/genie-4__hero-film__youtube_thum.width-1000.format-webp.webp"),
    4: ("MICROSOFT", "https://images.weserv.nl/?url=news.microsoft.com%2Fsource%2Fwp-content%2Fuploads%2F2026%2F11%2FLumen-Microsoft-Logo-Lock-Up.jpg"),
    5: ("NASA", "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/iotd/2026/the-pacific%27s-busy-storm-season/storminfa_tmo_20261030.jpg"),
}
TITLES = {
    1: "OJK: 27,23 JUTA AKUN KEUANGAN SELAMA BIK 2026",
    2: "KEMENKEU SOROT PAJAK DIGITAL DAN 23 JUTA AKUN KRIPTO",
    3: "GOOGLE KENALKAN GENIE 4, SIMULASI AI INTERAKTIF",
    4: "MICROSOFT–LUMEN PERKUAT JARINGAN AI",
    5: "NASA RILIS CITRA TOPAN IN-FA DI PASIFIK",
}
CREDITS = {
    1: "FOTO: OJK • 30 OKT 2026",
    2: "SUMBER: KEMENKEU • FOTO: DJP",
    3: "VISUAL: GOOGLE DEEPMIND",
    4: "VISUAL: MICROSOFT × LUMEN",
    5: "FOTO: NASA EARTH OBSERVATORY",
}
TAGS = {1: "EKONOMI", 2: "PAJAK DIGITAL", 3: "TEKNOLOGI AI",
        4: "BISNIS GLOBAL", 5: "SAINS & CUACA"}

def font(size, bold=False):
    filename = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    preferred = FONT_DIR / filename
    try:
        return ImageFont.truetype(str(preferred), size)
    except OSError:
        return ImageFont.truetype(filename, size)

def wrap(draw, text, ft, max_w):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = (current + " " + word).strip()
        if draw.textbbox((0, 0), candidate, font=ft)[2] > max_w and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines

def fit_headline(draw, title):
    for fs in range(79, 41, -1):
        ft = font(fs, bold=True)
        lines = wrap(draw, title, ft, W - 115)
        step = fs * 1.19
        if len(lines) <= 4 and (len(lines) * step) <= 280:
            return ft, lines, step
    raise ValueError("Headline overflow: " + title)

def fetch_photo(url, cache_path):
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    if cache_path.is_file() and cache_path.stat().st_size > 15000:
        with Image.open(cache_path) as test:
            test.verify()
        return Image.open(cache_path).convert("RGB")
    exc = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; BisaBikinWebEditorial/1.0)",
                "Accept": "image/webp,image/avif,image/png,image/jpeg,image/*;q=0.8",
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read(15_000_001)
                if len(raw) > 15_000_000:
                    raise ValueError("Image unexpectedly large")
            img = Image.open(io.BytesIO(raw))
            img.load()
            if img.width < 500 or img.height < 300:
                raise ValueError(f"Original source image too small: {img.size}")
            img = ImageOps.exif_transpose(img).convert("RGB")
            cache_path.write_bytes(raw)
            return img
        except (urllib.error.URLError, ValueError, OSError) as error:
            exc = error
            if attempt < 2:
                time.sleep(2 + attempt * 2)
    raise RuntimeError("Cannot retrieve original image " + url + ": " + str(exc))

def cover(image, dst_size, bg="#ECECEC"):
    # Crop without geometric distortion. Logos/infographics should not be cut off.
    if image.width / image.height > 1.45 and image.height / image.width < 1:
        # Landscape is naturally suited to cover top region; center crop is acceptable for photographs.
        pass
    return ImageOps.fit(image, dst_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))

def render(index, original, output):
    canvas = Image.new("RGB", (W,H), PANEL)
    draw = ImageDraw.Draw(canvas)
    # Editorial photo treatment; do not add, remove, or alter factual subjects.
    if index == 4:
        # Preserve every logo and word in the Microsoft-Lumen lockup.
        photo = Image.new("RGB", (W,PHOTO_H), "#F4F6F6")
        contained = ImageOps.contain(original, (1010,660), Image.Resampling.LANCZOS)
        photo.paste(contained, ((W-contained.width)//2,(PHOTO_H-contained.height)//2))
    else:
        photo = cover(original,(W, PHOTO_H))
        photo = ImageEnhance.Contrast(photo).enhance(1.055)
        photo = ImageEnhance.Color(photo).enhance(1.03)
    canvas.paste(photo,(0,0))
    draw=ImageDraw.Draw(canvas)
    # Subtle dark gradient on bottom of photo for chip contrast.
    gradient=Image.new("RGBA",(W,150),(0,0,0,0))
    gp=gradient.load()
    for y in range(150):
        opacity=int((y/149)*32)
        for x in range(W):
            gp[x,y]=(0,0,0,opacity)
    canvas.paste(gradient,(0,PHOTO_H-150),gradient)
    draw=ImageDraw.Draw(canvas)
    # Original Canva master layout proportions: chip from x=0,y=675, ~437x119.
    draw.rounded_rectangle((-24,675,446,795),radius=28,fill=CREAM)
    draw.rounded_rectangle((18,690,100,777),radius=18,fill=INK)
    draw.text((34,709),"{ }",font=font(28,True),fill=CREAM)
    draw.text((121,694),"Bisa BikinWeb",font=font(36,True),fill=INK)
    draw.text((121,742),"Build Your Digital Presence",font=font(18),fill=INK)
    # White headline panel, exact zone preserved in style.
    draw.rectangle((0,795,W,H),fill=PANEL)
    draw.line((55,824,1025,824),fill=BORDER,width=2)
    draw.text((58,836),TAGS[index],font=font(20,True),fill=MUTED)
    title=TITLES[index]
    title_font, lines, spacing=fit_headline(draw,title)
    total_height=spacing*len(lines)
    top=882+max(0,(272-total_height)/2)
    for line in lines:
        bbox=draw.textbbox((0,0),line,font=title_font)
        tx=(W-(bbox[2]-bbox[0]))/2
        draw.text((tx,top),line,font=title_font,fill=INK,stroke_width=0)
        top+=spacing
    # Footer: read-more remains uncluttered, source stays at right.
    draw.line((55,1238,1025,1238),fill=BORDER,width=2)
    draw.text((104,1267),"READ MORE →",font=font(28,True),fill=INK)
    credit=CREDITS[index]
    cf=font(18,False)
    while draw.textbbox((0,0),credit,font=cf)[2] > 410:
        cf=font(cf.size-1,False)
    draw.text((1020-draw.textbbox((0,0),credit,font=cf)[2],1274),credit,font=cf,fill=MUTED)
    # Actual photo owner/source remains credited and unrelated branding is not claimed.
    output.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(output,format="JPEG",quality=92,optimize=True,subsampling=0,progressive=False)
    with Image.open(output) as verify:
        assert verify.size==(1080,1350) and verify.format=="JPEG"
    print(f"RENDER_OK idx={index} path={output} bytes={output.stat().st_size}",flush=True)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--draft-json",default="social/instagram/drafts/2026-11-03-news.json")
    ap.add_argument("--dest",default="social/instagram/rendered/2026-11-03")
    ap.add_argument("--cache",default="social/instagram/.runtime/news-source-images")
    args=ap.parse_args()
    records=json.loads(Path(args.draft_json).read_text(encoding="utf-8"))
    assert len(records["items"])==5
    out=Path(args.dest)
    receipt=[]
    for item in records["items"]:
        i=int(item["no"])
        origin=Path(args.cache)/f"original_{i:02}.source"
        original=fetch_photo(SOURCES[i][1],origin)
        image=out/f"{i:02}_{SOURCES[i][0].lower()}_pillow.jpg"
        render(i,original,image)
        receipt.append({
            "item":i,"title":TITLES[i],"source_url":item["source_url"],
            "source_image":item["photo_url"],"source_credit":item["photo_attribution"],
            "file":image.name,"file_size":image.stat().st_size,
            "dimensions":[1080,1350],
            "status":"DRAFT_NOT_PUBLISHED",
            "reuse_permission_confirmed":bool(item.get("rights_verified")),
            "note":"Source copyright stays with owner. Rendering does not grant a reuse license.",
        })
    (out/"render_manifest.json").write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    # Visual five-up contact sheet for quick review without opening each image.
    tile_w, tile_h = 256, 320
    gap = 20
    sheet = Image.new("RGB",(gap+(tile_w+gap)*5,410),"#F6F3EB")
    sd=ImageDraw.Draw(sheet)
    sd.text((20,17),"BISABIKINWEB  •  5 EDITORIAL DRAFTS  •  03 NOV 2026",
            font=font(23,True),fill=INK)
    for idx in range(1,6):
        fpath=out/f"{idx:02}_{SOURCES[idx][0].lower()}_pillow.jpg"
        with Image.open(fpath) as src:
            tile=src.resize((tile_w,tile_h),Image.Resampling.LANCZOS)
        sheet.paste(tile,(gap+(idx-1)*(tile_w+gap),68))
    sheet.save(out/"contact_sheet.jpg",format="JPEG",quality=90,optimize=True)
    print(f"CONTACT_SHEET_OK {out / 'contact_sheet.jpg'}",flush=True)
    assert len(receipt)==5
    print("ALL_5_RENDERED_OK: five JPEG designs; NOT published to Instagram",flush=True)

if __name__=="__main__":
    main()
