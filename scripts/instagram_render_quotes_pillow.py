#!/usr/bin/env python3
"""Render BisaBikinWeb original quotes (1080x1350) with Pillow.

Visual references: user's 30-page Canva quote collection DAHWlFQyJHE,
particularly pages 3-11 (text verified by Canva). Recreates the recurring
content hierarchy: original Canva logo/wordmark + large quote + footer
'bisabikinweb.id' / '@bisabikinweb' / 'Jasa Pembuatan Website Profesional'.

This is an editable code approximation of a shared Canva reference, not an
exact pixel export. The shared design has read access but not editing rights.
No auto-posting and no third-party photograph rights are involved.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw
from instagram_render_news_pillow import canva_brand_art, paste_canva_ink, font, wrap

W,H=1080,1350
PAPER="#FAFAF8"
BLACK="#111111"
BEIGE="#F4EBD9"
ACCENT="#D3B688"
MUTED="#444444"


def draw_logo(canvas):
    logo,_=canva_brand_art()
    # This is original logo artwork from the owner's Canva quote design
    # with proper italic 'Bikin' — never use a substituted text font.
    paste_canva_ink(canvas,logo,(34,212,80,258),(83,102,158,178))
    paste_canva_ink(canvas,logo,(94,191,378,235),(183,105,656,182))
    paste_canva_ink(canvas,logo,(94,237,378,260),(183,179,656,218))


def fit_quote(draw,text,max_width=850,max_lines=7):
    for px in range(82,43,-1):
        ft=font(px,True)
        lines=wrap(draw,text,ft,max_width)
        step=int(px*1.25)
        if len(lines)<=max_lines and len(lines)*step<=570:
            return ft,lines,step
    raise ValueError(f"Cannot fit quote: {text}")


def render(item,path):
    image=Image.new("RGB",(W,H),PAPER)
    draw=ImageDraw.Draw(image)

    # Header follows actual shared Canva quote pages: identity first.
    draw_logo(image)
    draw=ImageDraw.Draw(image)

    # Restrained cream accent inspired by the source Canva logo asset.
    # No photo/banner, since actual reference pages are standalone quotes.
    draw.rounded_rectangle((94,325,986,981),radius=30,fill=BEIGE)
    draw.text((151,344),"“",font=font(144,True),fill=ACCENT)

    ft,lines,line_h=fit_quote(draw,item["quote"])
    block_h=line_h*len(lines)
    start_y=486+max(0,(410-block_h)/2)
    for line in lines:
        bounds=draw.textbbox((0,0),line,font=ft)
        x=(W-(bounds[2]-bounds[0]))/2
        draw.text((x,start_y),line,font=ft,fill=BLACK)
        start_y+=line_h

    # Footer contents are the ORIGINAL text from all Canva quote pages.
    draw.line((84,1056,996,1056),fill="#D7D0C6",width=2)
    draw.text((87,1112),"bisabikinweb.id",font=font(28,True),fill=BLACK)
    right="@bisabikinweb"
    rw=draw.textbbox((0,0),right,font=font(28,True))[2]
    draw.text((994-rw,1112),right,font=font(28,True),fill=BLACK)
    service="Jasa Pembuatan Website Profesional"
    fw=draw.textbbox((0,0),service,font=font(25))[2]
    draw.text(((W-fw)/2,1186),service,font=font(25),fill=MUTED)
    draw.rectangle((0,1296,W,H),fill=BEIGE)

    path.parent.mkdir(parents=True,exist_ok=True)
    image.save(path,"JPEG",quality=94,subsampling=0,optimize=True)
    with Image.open(path) as verify:
        assert verify.format=="JPEG" and verify.size==(W,H)
    print("QUOTE_RENDER_OK",path,path.stat().st_size,flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--draft",default="social/instagram/drafts/2026-11-03-quotes.json")
    parser.add_argument("--dest",default="social/instagram/rendered/2026-11-03-quotes")
    args=parser.parse_args()
    obj=json.loads(Path(args.draft).read_text(encoding="utf-8"))
    items=obj["items"]
    if len(items)!=5 or any(not x["quote_original"] for x in items):
        raise ValueError("Require exactly five original quotes")
    root=Path(args.dest)
    receipts=[]
    for item in items:
        path=root/f"{item['no']:02d}_quotes_pillow.jpg"
        render(item,path)
        receipts.append({
          "no":item["no"],"quote":item["quote"],"file":path.name,
          "size":path.stat().st_size,"dimensions":[W,H],"status":"DRAFT_NOT_POSTED",
          "reference_design_id":"DAHWlFQyJHE",
          "style_note":"Original Canva quote collection hierarchy, with matching brand/footer copy; not an exact pixel-export.",
          "original_content":True
        })
    (root/"render_manifest.json").write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    tile_w,tile_h,gap=232,290,18
    contact=Image.new("RGB",(5*(tile_w+gap)+gap,380),"#EEEAE2")
    c=ImageDraw.Draw(contact)
    c.text((gap,18),"BISABIKINWEB / QUOTES / CANVA REFERENCE",font=font(21,True),fill=BLACK)
    for i in range(1,6):
        with Image.open(root/f"{i:02d}_quotes_pillow.jpg") as src:
            tile=src.resize((tile_w,tile_h),Image.Resampling.LANCZOS)
        contact.paste(tile,(gap+(i-1)*(tile_w+gap),70))
    contact.save(root/"contact_sheet.jpg",quality=93,optimize=True)
    print("FIVE_CANVA_STYLE_QUOTES_READY / DRAFTS_ONLY",flush=True)


if __name__=="__main__":
    main()
