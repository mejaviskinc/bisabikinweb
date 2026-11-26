import datetime as dt, json, os, io
from zoneinfo import ZoneInfo
from PIL import Image
from instagram_publish_licensed_news_20261126 import render
from instagram_autopost import SafeStop, eligible, github_state, live_publish, meta
from instagram_carousel60_publish_one import upload_once, image_available, quota_available
ITEM=json.loads("{\"id\":\"bbweb-news-20261126-rupiah-msci\",\"category\":\"EKONOMI\",\"headline\":\"RUPIAH SEMPAT SENTUH RP18.400 PER DOLAR AS\",\"summary\":\"BI menyebut kekhawatiran penilaian MSCI dan kebutuhan valas akhir bulan ikut menekan rupiah.\",\"source_url\":\"https://sumsel.antaranews.com/berita/829251/bi-tekananrupiah-turut-dipengaruhi-kekhawatiran-penilaian-msci\",\"photo_url\":\"https://upload.wikimedia.org/wikipedia/commons/d/dc/Uang_rupiah_kertas.jpg\",\"photo_page\":\"https://commons.wikimedia.org/wiki/File:Uang_rupiah_kertas.jpg\",\"author\":\"Pak.syafda\",\"license\":\"https://creativecommons.org/licenses/by-sa/4.0/\",\"caption\":\"Rupiah kembali berada di bawah tekanan. Pada Kamis (26/11/2026), mata uang Indonesia sempat menyentuh Rp18.400 per dolar Amerika Serikat pada perdagangan siang. Angka ini merupakan posisi intraday, bukan nilai penutupan perdagangan.\\n\\nMenurut Bank Indonesia (BI), pasar mencermati kemungkinan perubahan klasifikasi pasar saham Indonesia oleh MSCI. Kekhawatiran tersebut berpotensi mendorong keluarnya dana investor asing. Permintaan valuta asing dari perusahaan menjelang akhir bulan juga menjadi faktor domestik yang ikut memengaruhi kurs.\\n\\nBI menjelaskan bahwa ketidakpastian global dan ekspektasi kenaikan suku bunga AS turut memperberat kondisi pasar. Bank sentral melanjutkan upaya stabilisasi melalui intervensi di pasar valas dalam dan luar negeri serta menjaga likuiditas valuta asing perbankan. Pada November 2026, suku bunga acuan BI telah dinaikkan menjadi 6 persen.\\n\\nBagi pelaku usaha, pelemahan rupiah dapat meningkatkan biaya pembelian bahan baku impor atau pembayaran kewajiban dalam dolar AS. Dampaknya berbeda pada setiap perusahaan, tergantung struktur biaya, kontrak, dan strategi pengelolaan risiko kurs.\\n\\nSumber: ANTARA, 26 November 2026, 14.02 WIB.\\nhttps://sumsel.antaranews.com/berita/829251/bi-tekananrupiah-turut-dipengaruhi-kekhawatiran-penilaian-msci\\nFoto ilustrasi arsip 2019: Pak.syafda / Wikimedia Commons. Foto dipotong dan diberi overlay; adaptasi CC BY-SA 4.0.\\nhttps://commons.wikimedia.org/wiki/File:Uang_rupiah_kertas.jpg\\nhttps://creativecommons.org/licenses/by-sa/4.0/\\n\\nbisabikinweb.site\\n#Rupiah #EkonomiIndonesia #BankIndonesia #BeritaEkonomi #BisaBikinWeb\"}")
REPO="mejaviskinc/bisabikinweb"
def main():
    if os.getenv("GITHUB_REPOSITORY")!=REPO or os.getenv("GITHUB_REF")!="refs/heads/main": raise SafeStop("Wrong repository")
    token=os.environ["IG_ACCESS_TOKEN"]; uid=os.environ["IG_USER_ID"]; gh=os.environ["GITHUB_TOKEN"]
    state,_=github_state(REPO,gh)
    if ITEM["id"] in state["entries"]:
        print("ALREADY_CLAIMED_SKIP", ITEM["id"]); return
    profile=meta("GET",uid,token,{"fields":"id,username"},stage="PROFILE_ACCESS")
    if profile.get("username","").lower()!="bisabikinweb.id": raise SafeStop("Wrong account")
    if not quota_available(token,uid): raise SafeStop("Publishing quota exhausted")
    payload=render(ITEM)
    with Image.open(io.BytesIO(payload)) as im:
        if im.format!="JPEG" or im.size!=(1080,1350): raise SafeStop("Bad output dimensions")
    url=upload_once("instagram-news/20261126-licensed/"+ITEM["id"]+".jpg",payload)
    image_available(url)
    now=dt.datetime.now(ZoneInfo("Asia/Jakarta"))
    post=dict(id=ITEM["id"],date=now.date().isoformat(),slot=now.strftime("%H:%M"),caption=ITEM["caption"],source_url=ITEM["source_url"],rights_note=ITEM["photo_page"]+" "+ITEM["author"]+" "+ITEM["license"],fact_checked=True,rights_verified=True,status="approved",image_url=url)
    eligible(post,post["date"],post["slot"])
    live_publish(post)
if __name__=="__main__": main()
