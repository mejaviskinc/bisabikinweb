#!/usr/bin/env python3
"""Render new motivational quotes, preserving real Canva logo and footer."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, "scripts")
import instagram_render_90_quotes as renderer

DATA=Path("social/instagram/drafts/2026-11-04-10-motivasi-quotes.json")
renderer.ROOT=Path("social/instagram/rendered/2026-11-04-motivasi")

def main():
    doc=json.loads(DATA.read_text(encoding="utf-8"))
    items=doc["items"]
    assert len(items)==10
    base=renderer.load_base()
    report=[]
    for item in items:
        renamed=dict(item,no=item["render_no"])
        p=renderer.render(base,renamed)
        report.append(dict(no=item["no"],render_no=item["render_no"],image=p.name,bytes=p.stat().st_size,quote=item["quote"],status="IMAGE_READY_NOT_POSTED"))
    renderer.ROOT.mkdir(parents=True,exist_ok=True)
    (renderer.ROOT/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    sheet=Image.new("RGB",(5*232+6*18,2*290+3*18+52),"#EFEAE1")
    d=ImageDraw.Draw(sheet)
    d.text((18,12),"BisaBikinWeb / 10 Quotes Motivasi / 04 Nov 2026",font=renderer.font(18),fill="black")
    for i,item in enumerate(report):
        with Image.open(renderer.ROOT/item["image"]) as im:
            tile=im.resize((232,290),Image.Resampling.LANCZOS)
        sheet.paste(tile,(18+i%5*250,52+i//5*308))
    sheet.save(renderer.ROOT/"preview.jpg",format="JPEG",quality=90,optimize=True)
    print("ALL_10_MOTIVATION_QUOTES_RENDERED",flush=True)

if __name__=="__main__":
    main()
