import datetime as dt, io, json, os, time, urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont, ImageOps
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta
from instagram_carousel60_publish_one import upload_once, image_available, quota_available
import hashlib, urllib.parse
P=Path("social/instagram/requests/2026-11-27-ten-news.json")
REPO="mejaviskinc/bisabikinweb"
W,H=1080,1350
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def lines(d,s,font,width):
    out=[]; line=""
    for word in s.split():
        candidate=(line+" "+word).strip()
        if line and d.textlength(candidate,font=font)>width:
            out.append(line); line=word
        else: line=candidate
    if line: out.append(line)
    return out
def render(item):
    req=urllib.request.Request(item["photo_url"],headers={"User-Agent":"BisaBikinWebEditorial/1.0 (https://bisabikinweb.site; licensed news graphics)"})
    with urllib.request.urlopen(req,timeout=45) as r:
        if not r.geturl().startswith("https://upload.wikimedia.org/"): raise SafeStop("Unexpected photo host")
        raw=r.read(15000001)
    if len(raw)>15000000: raise SafeStop("Photo too large")
    with Image.open(io.BytesIO(raw)) as im:
        if min(im.size)<700: raise SafeStop("Photo too small")
        im=ImageOps.exif_transpose(im).convert("RGB")
        photo=ImageOps.fit(im,(W,960),Image.Resampling.LANCZOS)
    surface=Image.new("RGB",(W,H),(9,9,11)); surface.paste(photo,(0,0))
    overlay=Image.new("RGBA",(W,H)); d=ImageDraw.Draw(overlay)
    for y in range(570,H):
        alpha=min(255,round(255*(y-570)/400))
        d.line((0,y,W,y),fill=(9,9,11,alpha))
    surface=Image.alpha_composite(surface.convert("RGBA"),overlay).convert("RGB")
    d=ImageDraw.Draw(surface)
    green=(191,255,0); white=(250,250,250)
    cat=ImageFont.truetype(BOLD,29)
    label=ImageFont.truetype(BOLD,20)
    tag="FOTO ARSIP / ILUSTRASI"
    tw=d.textlength(tag,font=label)
    d.rounded_rectangle((W-48-tw-24,40,W-40,77),radius=7,fill=(15,15,17))
    d.text((W-48-tw-12,46),tag,font=label,fill=white)
    for size in range(74,43,-1):
        f=ImageFont.truetype(BOLD,size); ls=lines(d,item["headline"],f,925)
        if len(ls)*int(size*1.18)<=275: break
    step=int(size*1.18); y=820; category_y=y-78
    cw=int(d.textlength(item["category"],font=cat))
    d.rounded_rectangle((55,category_y,55+cw+40,category_y+51),radius=15,fill=green)
    d.text((75,category_y+7),item["category"],font=cat,fill=(10,10,10))
    d.rectangle((55,y,67,y+len(ls)*step-10),fill=green)
    for l in ls:
        d.text((88,y),l,font=f,fill=white); y+=step
    y+=18; sf=ImageFont.truetype(REG,31)
    sl=lines(d,item["summary"],sf,970)
    for l in sl:
        d.text((55,y),l,font=sf,fill=white); y+=38
    if y>1230: raise SafeStop("Text overflow")
    d.text((55,1275),"bisabikinweb.site",font=ImageFont.truetype(BOLD,29),fill=white)
    d.text((405,1277),"|  27 November 2026",font=ImageFont.truetype(REG,27),fill=white)
    d.ellipse((970,1254,1030,1314),fill=(43,43,45))
    d.line((984,1284,1014,1284),fill=white,width=4);d.line((1001,1271,1014,1284,1001,1297),fill=white,width=4)
    b=io.BytesIO();surface.save(b,format="JPEG",quality=94,optimize=True)
    return b.getvalue()

def main():
    m=json.loads(P.read_text())
    assert m["account"]=="bisabikinweb.id" and m["approved_to_publish_now"] is True and len(m["items"])==10
    assert os.getenv("GITHUB_REPOSITORY")==REPO and os.getenv("GITHUB_REF")=="refs/heads/main"
    token=os.environ["IG_ACCESS_TOKEN"]; uid=os.environ["IG_USER_ID"]; gh=os.environ["GITHUB_TOKEN"]
    profile=meta("GET",uid,token,{"fields":"id,username"},stage="PROFILE_ACCESS")
    assert profile.get("username","").lower()=="bisabikinweb.id"
    state,_=github_state(REPO,gh)
    failures=[]
    for item in m["items"]:
        if item["id"] in state["entries"]:
            print("SKIP_ALREADY_CLAIMED",item["id"],flush=True); continue
        try:
            name=item["file"].replace(" ","_")
            digest=hashlib.md5(name.encode()).hexdigest()
            quoted=urllib.parse.quote(name)
            item["photo_url"]="https://upload.wikimedia.org/wikipedia/commons/"+digest[0]+"/"+digest[:2]+"/"+quoted
            item["photo_page"]="https://commons.wikimedia.org/wiki/File:"+quoted
            data=render(item)
            with Image.open(io.BytesIO(data)) as im:
                assert im.size==(1080,1350) and im.format=="JPEG"
            url=upload_once("instagram-news/20261127/"+item["id"]+".jpg",data)
            image_available(url)
            caption=item["headline"]+"\n\n"+item["body"]+"\n\nSumber berita: "+item["source"]+"\n"+item["source_url"]+"\n\n"+item["photo_context"]+"\nKredit foto: "+item["author"]+" / Wikimedia Commons\n"+item["photo_page"]+"\nLisensi: "+item["license"]+"\nFoto dipotong dan diberi desain teks. Adaptasi tersedia dengan lisensi yang sama.\n\nbisabikinweb.site\n#BeritaIndonesia #BisaBikinWeb"
            now=dt.datetime.now(ZoneInfo("Asia/Jakarta"))
            post=dict(id=item["id"],date=now.date().isoformat(),slot=now.strftime("%H:%M"),caption=caption,source_url=item["source_url"],rights_note=item["photo_page"]+" "+item["license"]+" "+item["author"],fact_checked=True,rights_verified=True,status="approved",image_url=url)
            eligible(post,post["date"],post["slot"])
        except Exception as e:
            print("PREPARATION_FAILED",item["id"],type(e).__name__,flush=True)
            failures.append(item["id"])
            continue
        if not quota_available(token,uid): raise SafeStop("Meta quota exhausted")
        live_publish(post)
        time.sleep(8)
    if failures: raise SafeStop("Preparation failed for: "+", ".join(failures))
if __name__=="__main__":main()
