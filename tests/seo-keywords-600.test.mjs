import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const raw=await readFile('seo/keyword-targets-600.json','utf8');
const data=JSON.parse(raw);
test('600 keyword SEO targets are unique and mapped to indexable pages',async()=>{
 assert.equal(data.total,600);
 assert.equal(data.keywords.length,600);
 assert.deepEqual(data.counts,{'nasional':40,'jenis-website':144,industri:160,lokasi:216,fitur:40});
 const unique=new Set(data.keywords.map(row=>row.keyword));
 assert.equal(unique.size,600,'Every search phrase must be unique');
 const sitemap=await readFile('site-dist/sitemap.xml','utf8');
 const sitemapUrls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]));
 const allowed=new Set(['P1','P2','P3']);
 for(const [i,row] of data.keywords.entries()){
  assert.equal(row.id,i+1);
  assert.ok(row.keyword.length>=10,'Short keyword at '+row.id);
  assert.ok(row.keyword===row.keyword.toLocaleLowerCase('id-ID'),'Non-normalized keyword at '+row.id);
  assert.ok(allowed.has(row.priority));
  assert.ok(row.target_url.startsWith('/')&&row.target_url.endsWith('/'));
  assert.ok(sitemapUrls.has('https://bisabikinweb.site'+row.target_url),'No indexable landing target: '+row.target_url);
  assert.ok(!row.target_url.includes('/admin/'));
 }
 const content=await readFile('site-dist/jasa/index.html','utf8');
 assert.match(content,/Bukan sekadar bikin web/);
 assert.ok(content.includes('href="/jasa/ecommerce/"'));
 assert.ok(content.includes('href="/wilayah/"'));
});
