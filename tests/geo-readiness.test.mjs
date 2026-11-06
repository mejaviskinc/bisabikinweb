import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root='https://bisabikinweb.site';
const home=await readFile('site-dist/index.html','utf8');
const about=await readFile('site-dist/tentang/index.html','utf8');
const pricing=await readFile('site-dist/harga/index.html','utf8');
const sitemap=await readFile('site-dist/sitemap.xml','utf8');
const robots=await readFile('site-dist/robots.txt','utf8');
const guides=[
  'checklist-memilih-jasa-pembuatan-website',
  'jasa-website-online-seluruh-indonesia'
];

assert.ok(home.includes('FAQPage'), 'Homepage needs visible, matching FAQ metadata');
assert.ok(pricing.includes('FAQPage'), 'Pricing page needs matching FAQ metadata');
assert.ok(home.includes('Apa website resmi BisaBikinWeb?'), 'Official-site FAQ missing');
assert.ok(home.includes(root), 'Official website URL missing');
assert.ok(about.includes('Website resmi BisaBikinWeb'), 'About page must identify official domain');
assert.ok(about.includes('bukan klaim cabang fisik'), 'Avoid misleading physical branch claims');
assert.ok(robots.includes('Sitemap: '+root+'/sitemap.xml'), 'robots.txt must expose the sitemap');
assert.ok(!robots.includes('Disallow: /'), 'Public pages must remain crawlable');

for(const slug of guides){
  const url=root+'/artikel/'+slug+'/';
  const html=await readFile('site-dist/artikel/'+slug+'/index.html','utf8');
  assert.ok(sitemap.includes('<loc>'+url+'</loc>'), 'Guide missing from sitemap: '+slug);
  assert.ok(html.includes('<meta name="robots" content="index,follow'), 'Guide must be indexable: '+slug);
  assert.ok(html.includes('<link rel="canonical" href="'+url+'"'), 'Guide needs self canonical: '+slug);
  assert.ok(html.includes('BlogPosting'), 'Guide needs BlogPosting data: '+slug);
  assert.ok(html.includes('BisaBikinWeb'), 'Guide should name publisher: '+slug);
  assert.ok(html.includes('/kontak/'), 'Guide should link to real consultation page: '+slug);
}

console.log('GEO readiness verified: official brand URL, FAQ, crawlability and useful editorial guides.');
