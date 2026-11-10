#!/usr/bin/env python3
"""Visual QA only. Generates non-publishing original logo preview."""
from pathlib import Path
from PIL import Image, ImageDraw
from instagram_news_brand_logo import official_news_logo

def main():
    logo=official_news_logo()
    surface=Image.new("RGB",(1080,1350),"white")
    draw=ImageDraw.Draw(surface)
    draw.rectangle((0,0,1080,945),fill=(40,41,43))
    draw.rounded_rectangle((-16,835,440,934),radius=18,fill=(219,218,216))
    draw.rounded_rectangle((28,852,104,920),radius=13,fill=(228,211,186))
    surface.paste(logo,(28,846),logo)
    draw.text((100,1014),"LOGO ORIGINAL: FULL SVG",fill=(0,0,0))
    directory=Path("social/instagram/news-carousels/qa")
    directory.mkdir(parents=True,exist_ok=True)
    target=directory/"logo-original-vs-reference.png"
    surface.save(target,optimize=True)
    print("NEWS_LOGO_QA_PREVIEW_ONLY",str(target),logo.size)
if __name__=="__main__":
    main()
