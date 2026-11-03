#!/usr/bin/env python3
"""Create FIVE original BisaBikinWeb quote images using Python + Pillow.

This keeps the measured Canva master structure (1080x1350, visual hero
0..794, original-logo chip 675..794, quote area 795..1350, footer x106/x624),
but replaces the news photograph with original typographic artwork.
No third-party photos, invented quote attributions, or Instagram publishing.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from instagram_render_news_pillow import canva_brand_art, paste_canva_ink, font, wrap

W,H=1080,1350
DARK="#17232B"
DEEP="#111B24"
GOLD="#D7B98B"
PANEL="#FFFFFF"
TEXT="#141A20"
GRAY="#647077"


def rgb(value):
    value=value.lstrip("#")
    return tuple(int(value[i:i+2],16) for i in (0,2,4))


def lower_quote_font(draw,quote):
    for size in range(76,45,-1):
        ft=font(size,True)
        # use the font for actual word measurement
        rows=wrap(draw,quote,ft,955)
        leading=int(size*1.23)
        if len(rows)<=5 and len(rows)*leading <= 315:
            return ft,rows,leading
    raise ValueError("Quote text too long for established Canva type zone")


def render(item,path):
    base=Image.new("RGB",(W,H),DARK)
    p=base.load()
    # Native Pillow color composition: clean dark-to-deep gradient, no external photo.
    a,b=rgb(DARK),rgb(DEEP)
    for y in range(795):
        t=y/794.0
        color=tuple(round((1-t)*x+t*z) for x,z in zip(a,b))
        for x in range(W):
            p[x,y]=color
    d=ImageDraw.Draw(base)
    # Understated editorial decorations, constrained to the master photo zone.
    for radius in (165,240,325,405):
        d.ellipse((840-radius,338-radius,840+radius,338+radius),outline="#30404A",width=3)
    d.ellipse((825,310,860,345),fill=GOLD)
    d.line((100,103,980,103),fill="#435058",width=2)
    d.text((102,120),"BISABIKINWEB     /     QUOTES",font=font(22,True),fill="#D9DBDC")
    d.text((102,198),"“",font=font(272,True),fill=GOLD)
    d.text((104,505),item["theme"],font=font(25,True),fill=GOLD)
    d.text((104,552),"IDE  •  AKSI  •  PERTUMBUHAN",font=font(29,True),fill="#F0E9DC")
    d.text((976,735),f"{int(item['no']):02d} / 05",font=font(19),anchor="ra",fill="#E7D8BF")

    # Original Canva logo artwork reused exactly instead of imitating italic Bikin.
    logo,cream=canva_brand_art()
    d.rounded_rectangle((-18,675,437,794),radius=18,fill=cream)
    paste_canva_ink(base,logo,(34,212,80,258),(20,691,104,777))
    paste_canva_ink(base,logo,(94,191,378,235),(119,696,401,748))
    paste_canva_ink(base,logo,(94,237,378,260),(119,744,386,769))

    d=ImageDraw.Draw(base)
    d.rectangle((0,795,W,1349),fill=PANEL)
    ft,rows,leading=lower_quote_font(d,item["quote"])
    y=861
    for row in rows:
        box=d.textbbox((0,0),row,font=ft)
        x=(W-(box[2]-box[0]))/2
        d.text((x,y),row,font=ft,fill=TEXT)
        y+=leading
    # Footer exactly aligns with source Canva master x106 and x624 at ~1265.
    d.text((106,1268),"SHARE",font=font(23,True),fill=TEXT)
    d.line((210,1282,260,1282),fill=TEXT,width=3)
    d.line((250,1274,260,1282),fill=TEXT,width=3)
    d.line((250,1290,260,1282),fill=TEXT,width=3)
    d.text((624,1268),"QUOTE ORISINAL • BISABIKINWEB",font=font(18),fill=GRAY)
    path.parent.mkdir(parents=True,exist_ok=True)
    base.save(path,format="JPEG",quality=93,optimize=True,subsampling=0)
    with Image.open(path) as check:
        if check.size!=(W,H) or check.format!="JPEG":
            raise ValueError(f"Invalid output: {path}")
    print(f"QUOTE_RENDER_OK {path} {path.stat().st_size} bytes",flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--draft",default="social/instagram/drafts/2026-11-03-quotes.json")
    parser.add_argument("--dest",default="social/instagram/rendered/2026-11-03-quotes")
    args=parser.parse_args()
    doc=json.loads(Path(args.draft).read_text(encoding="utf-8"))
    entries=doc["items"]
    if len(entries)!=5 or any(not x["quote_original"] for x in entries):
        raise ValueError("Expected five original quotes")
    root=Path(args.dest)
    report=[]
    for entry in entries:
        output=root/f"{entry['no']:02d}_quotes_pillow.jpg"
        render(entry,output)
        report.append({"no":entry["no"],"quote":entry["quote"],"file":output.name,"size":output.stat().st_size,
                       "status":"DRAFT","rights":"BisaBikinWeb original typographic artwork and text",
                       "format":"JPEG","dimensions":[W,H]})
    (root/"render_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    thumb=Image.new("RGB",(5*232+6*18,374),"#EFE9DE")
    td=ImageDraw.Draw(thumb)
    td.text((18,14),"BISABIKINWEB • QUOTES • 5 ORIGINAL FEEDS",font=font(21,True),fill=TEXT)
    for i in range(1,6):
        with Image.open(root/f"{i:02d}_quotes_pillow.jpg") as im:
            cut=im.resize((232,290),Image.Resampling.LANCZOS)
        thumb.paste(cut,(18+(i-1)*250,68))
    thumb.save(root/"contact_sheet.jpg",quality=93,optimize=True)
    print("QUOTES_ALL_5_OK • DRAFT ONLY • NO INSTAGRAM POST",flush=True)


if __name__=="__main__":
    main()
