import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const raw=await readFile('seo/keyword-targets-600.json','utf8');
const data=JSON.parse(raw);
const {keywordPages}=await import('../static-source/lib/seo-solutions.mjs');
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
  assert.equal(keywordPages[i].target,row.target_url,'Runtime and keyword map differ');
  if(row.intent.includes('price'))assert.equal(row.target_url,'/harga/','Price queries belong to pricing');
  if(row.cluster==='nasional'&&!row.intent.includes('price'))assert.equal(row.target_url,'/','National commercial phrases belong to homepage');
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

test('industry destinations have useful content, canonical metadata and portfolio links',async()=>{
 const {industryPages}=await import('../static-source/lib/industry-pages.mjs');
 const sitemap=await readFile('site-dist/sitemap.xml','utf8');
 const home=await readFile('site-dist/index.html','utf8');
 const hub=await readFile('site-dist/solusi/index.html','utf8');
 for(const page of industryPages){
  const html=await readFile('site-dist'+page.path+'/index.html','utf8');
  const url='https://bisabikinweb.site'+page.path+'/';
  assert.ok(sitemap.includes('<loc>'+url+'</loc>'));
  assert.ok(html.includes('<link rel="canonical" href="'+url+'"'));
  assert.ok(html.includes('name="robots" content="index,follow'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  for(const [heading] of page.sections)assert.ok(html.includes(heading));
  assert.ok(html.includes('href="/portfolio/'+page.project+'/"'));
  assert.ok(home.includes('href="'+page.path+'/"'));
  assert.ok(hub.includes('href="'+page.path+'/"'));
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match=>JSON.parse(match[1]));
  assert.equal(schemas.filter(item=>item['@type']==='Service').length,1);
  const crumb=schemas.find(item=>item['@type']==='BreadcrumbList');
  assert.equal(crumb.itemListElement.at(-1).item,url);
 }
 const pricing=await readFile('site-dist/harga/index.html','utf8');
 assert.ok(pricing.includes('Biaya awal dan biaya berulang.'));
 const portfolio=await readFile('site-dist/portfolio/index.html','utf8');
 for(const page of industryPages)assert.ok(portfolio.includes('href="/portfolio/'+page.project+'/"'));
});
