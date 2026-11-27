import datetime as dt, hashlib, io, json, os, time, urllib.parse, urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont, ImageOps
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta
from instagram_carousel60_publish_one import upload_once, image_available, quota_available
REPO="mejaviskinc/bisabikinweb"
P=Path("social/instagram/requests/2026-11-27-two-carousel-final.json")
W,H=1080,1350
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
GREEN=(191,255,0)
WHITE=(250,250,250)
def wrapped(draw,s,f,maxw):
    out=[]; acc=""
    for word in s.split():
        t=(acc+" "+word).strip()
        if acc and draw.textlength(t,font=f)>maxw:
            out.append(acc); acc=word
        else: acc=t
    if acc: out.append(acc)
    if any(draw.textlength(l,font=f)>maxw for l in out): raise SafeStop("Word too wide")
    return out
def photo(p):
    name=p["file"]; md=hashlib.md5(name.encode()).hexdigest()
    url="https://upload.wikimedia.org/wikipedia/commons/"+md[0]+"/"+md[:2]+"/"+urllib.parse.quote(name)
    req=urllib.request.Request(url,headers={"User-Agent":"BisaBikinWebEditorial/1.0 (https://bisabikinweb.site; licensed news design)"})
    with urllib.request.urlopen(req,timeout=45) as r:
        if not r.geturl().startswith("https://upload.wikimedia.org/"): raise SafeStop("Unexpected photo host")
        b=r.read(15000001)
    if len(b)>15000000: raise SafeStop("Photo too large")
    with Image.open(io.BytesIO(b)) as im:
        if min(im.size)<700: raise SafeStop("Photo too small")
        return ImageOps.exif_transpose(im).convert("RGB")
def render(im,category,head,body,final):
    c=Image.new("RGB",(W,H),(6,6,7))
    c.paste(ImageOps.fit(im,(W,960),Image.Resampling.LANCZOS,centering=(.5,.48)),(0,0))
    ov=Image.new("RGBA",(W,H)); d=ImageDraw.Draw(ov)
    for y in range(520,H):
        alpha=min(255,max(0,round(255*(y-520)/430)))
        d.line((0,y,W,y),fill=(6,6,7,alpha))
    c=Image.alpha_composite(c.convert("RGBA"),ov).convert("RGB");d=ImageDraw.Draw(c)
    f=ImageFont.truetype(BOLD,60); sf=ImageFont.truetype(REG,32); cat=ImageFont.truetype(BOLD,30)
    ls=wrapped(d,head,f,920); bs=wrapped(d,body,sf,960)
    if not 2<=len(ls)<=4 or len(bs)>4: raise SafeStop("Fixed master text overflow: "+head)
    y=810
    cw=int(d.textlength(category,font=cat))
    d.rounded_rectangle((55,728,95+cw,783),radius=17,fill=GREEN)
    d.text((75,735),category,font=cat,fill=(6,6,7))
    d.rectangle((55,y,65,y+len(ls)*70-9),fill=GREEN)
    for l in ls:
        d.text((86,y),l,font=f,fill=WHITE);y+=70
    y+=15
    for l in bs:
        d.text((55,y),l,font=sf,fill=(232,232,232));y+=39
    if y>1250: raise SafeStop("Narrative/footer overlap: "+head)
    d.text((55,1270),"bisabikinweb.site",font=ImageFont.truetype(BOLD,30),fill=WHITE)
    d.line((403,1270,403,1310),fill=WHITE,width=2)
    d.text((425,1270),"26 November 2026",font=ImageFont.truetype(REG,30),fill=WHITE)
    d.ellipse((960,1253,1030,1323),fill=(44,44,46))
    if final:
        d.line((980,1286,992,1297,1012,1277),fill=WHITE,width=5)
    else:
        d.line((978,1288,1012,1288),fill=WHITE,width=5)
        d.line((999,1275,1012,1288,999,1301),fill=WHITE,width=5)
    out=io.BytesIO(); c.save(out,format="JPEG",quality=94,subsampling=0,optimize=True)
    raw=out.getvalue()
    with Image.open(io.BytesIO(raw)) as chk:
        assert chk.format=="JPEG" and chk.size==(W,H)
    return raw
def main():
    m=json.loads(P.read_text()); assert m["account"]=="bisabikinweb.id" and m["approved_to_publish_now"] is True and len(m["topics"])==2
    assert os.environ["GITHUB_REPOSITORY"]==REPO and os.environ["GITHUB_REF"]=="refs/heads/main"
    token=os.environ["IG_ACCESS_TOKEN"];uid=os.environ["IG_USER_ID"];gh=os.environ["GITHUB_TOKEN"]
    profile=meta("GET",uid,token,{"fields":"id,username"},stage="PROFILE_ACCESS")
    assert profile.get("username","").lower()=="bisabikinweb.id"
    state,_=github_state(REPO,gh)
    ready=[]
    for t in m["topics"]:
        if t["id"] in state["entries"]: print("SKIP_ALREADY_CLAIMED",t["id"]);continue
        assert len(t["slides"])==5
        pics=[photo(p) for p in t["photos"]]
        urls=[]
        for i,(headline,body,index) in enumerate(t["slides"],1):
            payload=render(pics[index],t["category"],headline,body,i==5)
            urls.append(upload_once("instagram-news/20261127-carousels/"+t["id"]+"/slide_%02d.jpg"%i,payload))
        for u in urls: image_available(u)
        now=dt.datetime.now(ZoneInfo("Asia/Jakarta"))
        item=dict(id=t["id"],date=now.date().isoformat(),slot=now.strftime("%H:%M"),caption=t["caption"],source_url=t["source"],rights_note="Verified Wikimedia Commons archive photographs, credits and licenses in caption; not event documentation.",fact_checked=True,rights_verified=True,status="approved",image_urls=urls)
        eligible(item,item["date"],item["slot"])
        ready.append(item)
    for item in ready:
        if not quota_available(token,uid): raise SafeStop("Meta quota exhausted")
        live_publish(item)
        time.sleep(8)
if __name__=="__main__":main()
