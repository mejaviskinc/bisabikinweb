import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {seoCluster20261109} from '../static-source/lib/seo-cluster-20261109.mjs';
const ids=new Set();
const destinations=new Set(['/jasa/company-profile/','/jasa/ecommerce/','/jasa/','/portfolio/','/portfolio/mejavi-skin/','/portfolio/gooninks/','/portfolio/gojogja-travel/','/industri/skincare/','/industri/fashion/','/industri/travel/','/harga/','/kontak/']);
test('five unique, substantive and accurately described SEO guides',()=>{
 assert.equal(seoCluster20261109.length,5);
 for(const article of seoCluster20261109){
  assert.match(article.id,/^[a-z0-9-]+$/);assert.ok(!ids.has(article.id),'duplicate slug: '+article.id);ids.add(article.id);
  assert.ok(article.title.length>=35 && article.summary.length>=90,'brief metadata: '+article.id);
  assert.ok(article.body.join(' ').trim().split(/\s+/).length>=300,'thin article: '+article.id);
  assert.ok(article.body.some(line=>line.startsWith('## ')),'missing headings: '+article.id);
  assert.ok(article.image.startsWith('https://images.unsplash.com/photo-'),'missing illustrative photo: '+article.id);
  assert.ok(article.image_license_url==='https://unsplash.com/license');
  assert.ok(article.image_caption.includes('ilustrasi'));
  assert.ok(Array.isArray(article.related_links)&&article.related_links.length>=3);
  for(const link of article.related_links)assert.ok(destinations.has(link.href),'unexpected related URL: '+link.href);
 }
});
test('cluster content is included and cross-linked from industry and portfolio',async()=>{
 const editorial=await readFile('static-source/lib/editorial-posts.mjs','utf8');
 const industry=await readFile('static-source/features/IndustrySolutions.tsx','utf8');
 const studio=await readFile('static-source/features/Studio.tsx','utf8');
 assert.ok(editorial.includes("import {seoCluster20261109} from './seo-cluster-20261109.mjs'"));
 assert.ok(editorial.includes('editorialPosts.push(...seoCluster20261109.filter'));
 assert.ok(studio.includes('aria-label="Bacaan dan layanan terkait"'));
 for(const slug of ['website-skincare-katalog-komposisi-kepercayaan','website-fashion-size-chart-stok-preorder','website-travel-paket-wisata-booking-jelas']){
  assert.ok(industry.includes(slug),'industry link missing: '+slug);
  assert.ok(studio.includes(slug),'portfolio link missing: '+slug);
 }
});
