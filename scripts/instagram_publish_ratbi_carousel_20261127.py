import datetime as dt, io, os, urllib.request
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont, ImageOps
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta
from instagram_carousel60_publish_one import upload_once, image_available, quota_available
from instagram_publish_licensed_news_20261126 import lines
REPO="mejaviskinc/bisabikinweb"
ID="bbweb-news-carousel-20261127-ratbi-2027"
SOURCE="https://finance.detik.com/berita-ekonomi-bisnis/d-8771877/dpr-bi-sepakati-proyeksi-ekonomi-2027"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BASE="https://upload.wikimedia.org/wikipedia/commons/"
SLIDES=[
("DPR DAN BI SEPAKATI PROYEKSI EKONOMI 2027","Komisi XI DPR menyetujui asumsi ekonomi dalam rancangan anggaran BI pada Kamis, 26 November 2026.","5/5f/Gedung_Bank_Indonesia_di_Jakarta_(2026)_02.jpg",0.50),
("EKONOMI DIPROYEKSIKAN TUMBUH 5,2–6%","Rentang tersebut menjadi asumsi pertumbuhan ekonomi Indonesia sepanjang 2027 dibandingkan tahun sebelumnya.","d/d4/Tanjung_Priok_container_terminal_2006.jpg",0.50),
("INFLASI DIPROYEKSIKAN 2,5% ± 1%","DPR dan BI menyepakati asumsi inflasi tahunan dengan rentang 1,5% hingga 3,5%.","8/89/Jakarta_Skyline.jpeg",0.76),
("KURS RUPIAH DIPROYEKSIKAN RP17.800–18.200","Kisaran per dolar AS ini merupakan asumsi untuk 2027, bukan kepastian nilai tukar di pasar.","d/dc/Uang_rupiah_kertas.jpg",0.50),
("ANGGARAN OPERASIONAL BI JUGA DISEPAKATI","Penerimaan diproyeksikan Rp37,79 triliun dan pengeluaran Rp23,24 triliun. Realisasi masih perlu dipantau.","5/57/Pemandangan_Luar_Gedung_DPR_RI.jpg",0.95)]
CAPTION="""Komisi XI DPR dan Bank Indonesia menyepakati asumsi makroekonomi 2027 dalam pembahasan rancangan anggaran tahunan BI di Senayan, Jakarta, pada 26 November 2026.

Proyeksinya mencakup pertumbuhan ekonomi 5,2–6% secara tahunan, inflasi 2,5% dengan toleransi satu poin persentase, serta kurs Rp17.800–Rp18.200 per dolar AS.

Anggaran operasional BI juga disetujui, dengan penerimaan Rp37,79 triliun dan belanja Rp23,24 triliun. Angka proyeksi ini bukan jaminan realisasi ekonomi tahun depan.

Sumber: Andi Hidayat, detikFinance, 26 November 2026, 21.52 WIB.
"""+SOURCE+"""

Foto arsip/ilustrasi asli (bukan dokumentasi rapat 26 November):
1. Medelam, Gedung BI (2026)
https://commons.wikimedia.org/wiki/File:Gedung_Bank_Indonesia_di_Jakarta_(2026)_02.jpg
2. Niels Johannes, terminal Tanjung Priok (2006)
https://commons.wikimedia.org/wiki/File:Tanjung_Priok_container_terminal_2006.jpg
3. Applaused, Jakarta (2022)
https://commons.wikimedia.org/wiki/File:Jakarta_Skyline.jpeg
4. Pak.syafda, uang rupiah (2019)
https://commons.wikimedia.org/wiki/File:Uang_rupiah_kertas.jpg
Slide 1–4: adaptasi berlisensi CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/
5. Eryantii, kawasan DPR (2024), CC BY 4.0
https://commons.wikimedia.org/wiki/File:Pemandangan_Luar_Gedung_DPR_RI.jpg
https://creativecommons.org/licenses/by/4.0/
Semua foto dipotong dan diberi gradasi serta teks.

bisabikinweb.site
#EkonomiIndonesia #BankIndonesia #DPR #BisaBikinWeb"""
def render(row, index):
    headline, summary, path, cy=row
    req=urllib.request.Request(BASE+path,headers={"User-Agent":"BisaBikinWebEditorial/1.0 (https://bisabikinweb.site; licensed editorial)"})
    with urllib.request.urlopen(req, timeout=45) as r:
        if not r.geturl().startswith(BASE): raise SafeStop("Unexpected image source")
        raw=r.read(15000001)
    if len(raw)>15000000: raise SafeStop("Photo too large")
    with Image.open(io.BytesIO(raw)) as original:
        im=ImageOps.exif_transpose(original).convert("RGB")
        if min(im.size)<700: raise SafeStop("Photo too small")
        photo=ImageOps.fit(im,(1080,1000),Image.Resampling.LANCZOS,centering=(0.5,cy))
    base=Image.new("RGB",(1080,1350),(9,9,11));base.paste(photo)
    overlay=Image.new("RGBA",base.size);d=ImageDraw.Draw(overlay)
    for y in range(580,1350):
        a=min(255,round(255*(y-580)/420))
        d.line((0,y,1080,y),fill=(9,9,11,a))
    base=Image.alpha_composite(base.convert("RGBA"),overlay).convert("RGB")
    d=ImageDraw.Draw(base);green=(191,255,0);white=(250,250,250)
    cat=ImageFont.truetype(BOLD,30);hf=ImageFont.truetype(BOLD,60);bf=ImageFont.truetype(REG,32)
    foot=ImageFont.truetype(BOLD,30);date=ImageFont.truetype(REG,30)
    x=55; y=820
    label="EKONOMI"
    cw=int(d.textlength(label,font=cat))
    d.rounded_rectangle((x,742,x+cw+40,793),radius=15,fill=green)
    d.text((x+20,749),label,font=cat,fill=(9,9,11))
    hl=lines(d,headline,hf,925); bl=lines(d,summary,bf,970)
    if len(hl)>4 or len(bl)>4 or any(d.textlength(t,font=hf)>925 for t in hl): raise SafeStop("Fixed headline overflow")
    d.rectangle((x,y,x+12,y+70*len(hl)-7),fill=green)
    for line in hl:
        d.text((88,y),line,font=hf,fill=white);y+=70
    y+=18
    for line in bl:
        d.text((x,y),line,font=bf,fill=white);y+=39
    if y>1230: raise SafeStop("Fixed font overflow")
    d.text((55,1275),"bisabikinweb.site",font=foot,fill=white)
    d.text((405,1275),"|  26 November 2026",font=date,fill=white)
    d.ellipse((970,1254,1030,1314),fill=(43,43,45))
    if index<5:
        d.line((984,1284,1014,1284),fill=white,width=4)
        d.line((1001,1271,1014,1284,1001,1297),fill=white,width=4)
    else:
        d.line((986,1284,996,1294,1014,1275),fill=white,width=4)
    b=io.BytesIO();base.save(b,"JPEG",quality=94,optimize=True,subsampling=0)
    return b.getvalue()
def main():
    if os.getenv("GITHUB_REPOSITORY")!=REPO or os.getenv("GITHUB_REF")!="refs/heads/main": raise SafeStop("Wrong repository")
    if os.getenv("IG_AUTOPUBLISH_ENABLED")!="true": raise SafeStop("Publishing disabled")
    token=os.environ["IG_ACCESS_TOKEN"]; uid=os.environ["IG_USER_ID"]; gh=os.environ["GITHUB_TOKEN"]
    state,_=github_state(REPO,gh)
    if ID in state["entries"]:
        print("ALREADY_CLAIMED",ID);return
    profile=meta("GET",uid,token,{"fields":"id,username"},stage="PROFILE_ACCESS")
    if profile.get("username","").lower()!="bisabikinweb.id": raise SafeStop("Unexpected Instagram account")
    if not quota_available(token,uid): raise SafeStop("Meta quota exhausted")
    images=[render(row,i) for i,row in enumerate(SLIDES,1)]
    urls=[]
    for i,data in enumerate(images,1):
        with Image.open(io.BytesIO(data)) as im:
            if im.size!=(1080,1350) or im.format!="JPEG": raise SafeStop("Invalid media")
        url=upload_once(f"instagram-news/20261127-ratbi-carousel/slide-{i:02d}.jpg",data)
        image_available(url);urls.append(url)
    now=dt.datetime.now(ZoneInfo("Asia/Jakarta"))
    item=dict(id=ID,date=now.date().isoformat(),slot=now.strftime("%H:%M"),caption=CAPTION,source_url=SOURCE,rights_note="Wikimedia Commons photo credits and licenses in caption; CC BY-SA 4.0 and CC BY 4.0",fact_checked=True,rights_verified=True,status="approved",image_urls=urls)
    eligible(item,item["date"],item["slot"])
    live_publish(item)
    print("PUBLISHED_RATBI_CAROUSEL",ID)
if __name__=="__main__": main()
