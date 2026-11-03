#!/usr/bin/env python3
"""Read-only research: enumerate image references in official source pages."""
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import urljoin
import json
import re

PAGES={
 "ojk":"https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-Gelar-Puncak-Bulan-Inklusi-Keuangan-%28BIK%29-dan-Financial-Expo-2026-di-Bandung.aspx",
 "kemenkeu":"https://www.kemenkeu.go.id/informasi-publik/publikasi/siaran-pers/Keadilan-Pajak-Ekonomi-Digital",
 "kemenkeu_news":"https://www.kemenkeu.go.id/informasi-publik/publikasi/berita-utama/Wamen-Nurkholisoh-Pentingnya-Keadilan-Pajak",
 "pajak":"https://pajak.go.id/index.php/id/berita/taxes-digital-economy-and-cripto-assets-perspective-shariah-pajak-dan-prinsip-syariah-dua",
 "pajak_listing":"https://www.pajak.go.id/en/berita-page",
 "genie4":"https://blog.google/innovation-and-ai/models-and-research/google-deepmind/introducing-genie-4/",
 "microsoft":"https://news.microsoft.com/source/2026/11/02/lumen-and-microsoft-expand-collaboration-to-co-sell-enterprise-ai-ready-networks/",
}
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36","Accept":"text/html,application/xhtml+xml,*/*"}
class Collector(HTMLParser):
    def __init__(self,base):
        super().__init__()
        self.base=base
        self.images=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="meta":
            k=d.get("property",d.get("name","")).lower()
            if k in ("og:image","twitter:image","og:image:secure_url","image"):
                self.add("meta:"+k,d.get("content",""),"")
        if tag in ("img","source","video","link"):
            for k in ("src","data-src","data-original","data-lazy-src","srcset","data-srcset","poster","imagesrcset"):
                u=d.get(k)
                if u:
                    u=u.split(",")[0].strip().split(" ")[0]
                    self.add(tag+":"+k,u,(d.get("alt") or d.get("title") or "")[:160])
    def add(self,kind,u,alt):
        if not u or u.startswith("data:"):
            return
        u=urljoin(self.base,u)
        if u.startswith("https://") and (kind,u) not in [(x["type"],x["url"]) for x in self.images]:
            self.images.append({"type":kind,"url":u,"alt":alt})

for key,url in PAGES.items():
    print("=== "+key+" ===",flush=True)
    try:
        with urlopen(Request(url,headers=HEADERS),timeout=25) as r:
            body=r.read(2200000).decode("utf-8",errors="replace")
            print("HTTP:",r.status,"FINAL:",r.geturl(),"bytes:",len(body))
            base=r.geturl()
        c=Collector(base)
        c.feed(body)
        for element in c.images[:25]:
            print("IMAGE",json.dumps(element,ensure_ascii=False))
        if key in ("genie4","kemenkeu_news","pajak"):
            urls=re.findall(r'https?://[^\s"<>]{15,240}',body)
            selected=[]
            for u in urls:
                u=u.split("'")[0].split("\\")[0].replace("&amp;","&")
                if any(word in u.lower() for word in ("genie", "kemenkeu", "pajak", "taxes", "crypto", "media", "storage")) and any(ext in u.lower() for ext in (".jpg",".jpeg",".png",".webp")):
                    if u not in selected:
                        selected.append(u)
            for u in selected[:30]:
                print("URL_HINT",u)
    except Exception as exc:
        print("ERROR",type(exc).__name__,str(exc)[:300])
