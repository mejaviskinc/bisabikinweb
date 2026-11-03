#!/usr/bin/env python3
"""Render Canva-font-matched Instagram quote assets, preserving original logo and footer.

Matched against the user's exported 1080x1350 Canva PNG typography:
Inter Display Bold (best available visual match), tracking -6.5% em,
left align at 105px, roughly 114% line height, pure black on white.
This is a visual reconstruction; Canva source did not expose named font metadata.
"""
import io
import json
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CANVA_PUBLISHED_ASSET = "https://static.metricool.com/planner/202611/7727294-file-16266071073116126624.jpeg"
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
INPUTS = [
    ("social/instagram/drafts/2026-11-04-to-12-90-quotes.json", "social/instagram/rendered/fontmatched-2026-11-04-to-12"),
    ("social/instagram/drafts/2026-11-04-10-motivasi-quotes.json", "social/instagram/rendered/fontmatched-2026-11-04-motivasi"),
]
SIZE = (1080, 1350)

def get_canvas_base():
    for attempt in range(3):
        try:
            req=urllib.request.Request(CANVA_PUBLISHED_ASSET,headers={"User-Agent":"Mozilla/5.0"})
            with urllib.request.urlopen(req,timeout=30) as r: source=r.read()
            image=Image.open(io.BytesIO(source)).convert("RGB")
            if image.size != SIZE:
                raise ValueError(f"Expected 1080x1350, got {image.size}")
            return image
        except Exception:
            if attempt == 2: raise
            time.sleep(2*(attempt+1))

def get_adv(font,text,tracking):
    return font.getlength(text) + tracking * max(0,len(text)-1)

def wrap(font,text,tracking,maxwidth=865):
    out=[];cur=""
    for word in text.split():
        candidate=(cur+" "+word).strip()
        if cur and get_adv(font,candidate,tracking)>maxwidth:
            out.append(cur);cur=word
        else:cur=candidate
    if cur:out.append(cur)
    return out

def ink(d,text,x,y,font,tracking):
    for idx,letter in enumerate(text):
        d.text((x+font.getlength(text[:idx])+tracking*idx,y),letter,font=font,fill="black")

def render(base,text):
    canvas=base.copy();d=ImageDraw.Draw(canvas)
    d.rectangle((0,210,1080,1143),fill="white")
    for size in range(100,55,-1):
        ft=ImageFont.truetype(FONT,size)
        tracking=-0.065*size
        lines=wrap(ft,text,tracking)
        leading=round(size*1.14)
        if len(lines)<=10 and len(lines)*leading<=834:break
    else: raise ValueError(f"Quote cannot fit: {text!r}")
    height=len(lines)*leading
    y=max(230,min(1110-height,round(680-height/2)))
    for i,line in enumerate(lines):
        ink(d,line,105,y+i*leading,ft,tracking)
    return canvas

def main():
    if not Path(FONT).is_file():raise RuntimeError("Install fonts-inter from Ubuntu universe first")
    base=get_canvas_base()
    total=0
    for src,dst in INPUTS:
        data=json.loads(Path(src).read_text(encoding="utf-8"))
        p=Path(dst);p.mkdir(parents=True,exist_ok=True)
        rows=[]
        for item in data["items"]:
            idx=item.get("render_no",item["no"])
            q=item["quote"]
            output=p/f"{idx:03d}.jpg"
            pic=render(base,q)
            pic.save(output,format="JPEG",quality=93,subsampling=0,optimize=True)
            with Image.open(output) as im:
                assert im.size==SIZE and im.format=="JPEG",str(output)
            rows.append({"id":idx,"quote":q,"path":str(output),"status":"ASSET_READY_NOT_PUBLISHED"})
            total+=1
            print("FONT_MATCH_RENDER",idx,output,output.stat().st_size,flush=True)
        (p/"render_manifest.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        # One static contact sheet per batch, not one for each item.
        for batch_start in range(0,len(rows),10):
            subset=rows[batch_start:batch_start+10]
            sheet=Image.new("RGB",(5*232+6*18,2*290+3*18+42),(238,235,231))
            d=ImageDraw.Draw(sheet)
            d.text((18,9),"BisaBikinWeb  /  Font-matched Quotes",font=ImageFont.truetype(FONT,19),fill="black")
            for i,it in enumerate(subset):
                with Image.open(it["path"]) as im:
                    tile=im.resize((232,290),Image.Resampling.LANCZOS)
                sheet.paste(tile,(18+(i%5)*250,42+(i//5)*308))
            sheet.save(p/f"preview_{subset[0]['id']:03d}-{subset[-1]['id']:03d}.jpg",quality=90,optimize=True)
    assert total==100,total
    print("FONT_MATCH_ALL_100_DONE_NOT_PUBLISHED",flush=True)

if __name__=="__main__": main()
