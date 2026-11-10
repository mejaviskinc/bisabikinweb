#!/usr/bin/env python3
"""Collect up to 50 fresh candidate news carousel sources; does NOT publish."""
import datetime as dt
import email.utils
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

WIB=ZoneInfo('Asia/Jakarta')
ROOT=Path('social/instagram/news-carousels')
FEEDS=[
 ('Politik','ANTARA','https://www.antaranews.com/rss/politik.xml'),
 ('Ekonomi','ANTARA','https://www.antaranews.com/rss/ekonomi.xml'),
 ('Bisnis','ANTARA','https://www.antaranews.com/rss/ekonomi-bisnis.xml'),
 ('Hukum','ANTARA','https://www.antaranews.com/rss/hukum.xml'),
 ('Dunia','ANTARA','https://www.antaranews.com/rss/dunia.xml'),
 ('Teknologi','ANTARA','https://www.antaranews.com/rss/tekno.xml'),
 ('Sosial','ANTARA','https://www.antaranews.com/rss/metro.xml'),
 ('Olahraga','ANTARA','https://www.antaranews.com/rss/olahraga.xml'),
 ('Yogyakarta','ANTARA Jogja','https://jogja.antaranews.com/rss/terkini.xml'),
 ('Ekonomi Jogja','ANTARA Jogja','https://jogja.antaranews.com/rss/ekonomi.xml'),
 ('Pemerintah Jogja','ANTARA Jogja','https://jogja.antaranews.com/rss/politik.xml'),
 ('Global','BBC Indonesia','https://feeds.bbci.co.uk/indonesia/rss.xml'),
]
ALLOWED={'www.antaranews.com','antaranews.com','jogja.antaranews.com','bbc.com','www.bbc.com','bbc.co.uk','www.bbc.co.uk','bbcindonesia.com','www.bbcindonesia.com'}
class Txt(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,s):self.parts.append(s)
def clean(s):
 parser=Txt();parser.feed(html.unescape(s or ''))
 return re.sub(r'\s+',' ',' '.join(parser.parts)).strip()
def pubdate(v):
 try:
  x=email.utils.parsedate_to_datetime(v)
  return x.replace(tzinfo=dt.timezone.utc) if x.tzinfo is None else x.astimezone(dt.timezone.utc)
 except (ValueError,TypeError,OverflowError): return None
def fetch(url):
 request=urllib.request.Request(url,headers={'User-Agent':'BisaBikinWeb-Research/1.0','Accept':'application/rss+xml,application/xml,text/xml'})
 with urllib.request.urlopen(request,timeout=25) as res:
  raw=res.read(2_000_000)
 if len(raw)>=2_000_000:raise ValueError('Oversized feed')
 return ET.fromstring(raw)
def collect():
 now=dt.datetime.now(dt.timezone.utc)
 grouped={category:[] for category,_,_ in FEEDS};errors=[];ok=0
 for category,source,feed in FEEDS:
  try:
   root=fetch(feed);ok+=1
   for item in root.findall('.//item'):
    title=clean(item.findtext('title'));link=(item.findtext('link') or '').strip()
    parsed=urllib.parse.urlsplit(link)
    if parsed.scheme not in ('http','https') or parsed.hostname not in ALLOWED:continue
    stamp=pubdate(item.findtext('pubDate') or '')
    if not stamp:continue
    age=(now-stamp).total_seconds()
    if age>72*3600 or age< -3600:continue
    desc=clean(item.findtext('description') or '')
    if not (20<=len(title)<=230 and len(desc)>=20):continue
    grouped[category].append({
     'id':hashlib.sha256(link.encode()).hexdigest()[:18],
     'category':category,'source':source,'source_url':link,
     'published_utc':stamp.isoformat(),'published_wib':stamp.astimezone(WIB).isoformat(),
     'original_headline':title,'excerpt_for_internal_research':desc[:430],
     'review_status':'DRAFT_RESEARCH','fact_checked':False,'rights_verified':False,
     'licensed_documentary_photo':None,'slides':[],'caption':None,
    })
  except Exception as exc:
   errors.append({'feed':feed,'error':type(exc).__name__})
 if not ok:raise RuntimeError('No news sources available: retain prior draft')
 for rows in grouped.values():rows.sort(key=lambda a:a['published_utc'],reverse=True)
 selected=[];seen_url=set();seen_headline=set()
 categories=[c for c,rows in grouped.items() if rows]
 while categories and len(selected)<50:
  carry=[]
  for cat in categories:
   rows=grouped[cat]
   while rows:
    row=rows.pop(0)
    norm=re.sub(r'\W+',' ',row['original_headline'].casefold()).strip()
    if row['source_url'] in seen_url or norm in seen_headline:continue
    selected.append(row);seen_url.add(row['source_url']);seen_headline.add(norm);break
   if rows:carry.append(cat)
   if len(selected)>=50:break
  categories=carry
 if not selected:raise RuntimeError('No current verified-date headlines; retain prior draft')
 today=now.astimezone(WIB).date().isoformat();ROOT.mkdir(parents=True,exist_ok=True)
 manifest={
  'brand':'BisaBikinWeb','account':'bisabikinweb.id','generated_utc':now.isoformat(),
  'date_wib':today,'requested_count':50,'found_count':len(selected),
  'status':'RESEARCH_DRAFTS_ONLY_NOT_POSTABLE',
  'visual':'photo top, original owner logo overlay, headline black bold on white lower panel; 3-5 slides',
  'unchanged_logo_asset':'public-assets/brand/bisabikinweb-logo.svg',
  'caption':'Source publication + URL + publication date + photographer/licensing credits',
  'note':'RSS is evidence for editorial research, NOT permission to copy photo, NOT final fact-checking, NOT Instagram publishing.',
  'feed_success':ok,'feed_errors':errors,'items':selected,
 }
 serialized=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
 (ROOT/'latest.json').write_text(serialized,encoding='utf-8')
 (ROOT/f'{today}.json').write_text(serialized,encoding='utf-8')
 print(f'NEWS_RESEARCH_DRAFTS date={today} candidates={len(selected)} feeds_ok={ok} photos_licensed=0 published=0')
if __name__=='__main__':collect()
