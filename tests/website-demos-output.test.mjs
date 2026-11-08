import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';

const origin='https://bisabikinweb.site';
const sitemap=readFileSync('site-dist/sitemap.xml','utf8');
let checked=0;
for(const demo of websiteDemos){
  const demoPath='site-dist/demo/'+demo.slug+'/index.html';
  const designPath='site-dist/desain/'+demo.slug+'/index.html';
  assert.ok(existsSync(demoPath),'Missing standalone live demo '+demoPath);
  assert.ok(existsSync(designPath),'Missing product detail '+designPath);
  const html=readFileSync(demoPath,'utf8');
  const design=readFileSync(designPath,'utf8');
  assert.ok(html.includes('DEMO INTERAKTIF'),demo.slug+' has no standalone SSR page');
  const escapedBrand=demo.title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  assert.ok(html.includes(escapedBrand),demo.slug+' missing brand');
  assert.ok(html.includes('Pakai desain ini'),demo.slug+' missing buyer CTA');
  assert.ok(html.includes('name="robots" content="noindex,nofollow"'),demo.slug+' should be noindex');
  assert.ok(design.includes('Buka website demo'),demo.slug+' missing live preview CTA');
  assert.ok(design.includes('name="robots" content="index,follow'),demo.slug+' detail must be indexable');
  assert.ok(sitemap.includes('<loc>'+origin+'/desain/'+demo.slug+'/</loc>'),demo.slug+' missing detail in sitemap');
  assert.ok(!sitemap.includes('/demo/'+demo.slug+'/'),demo.slug+' demo should stay out of sitemap');
  checked++;
}
assert.equal(checked,60);
console.log('Verified all '+checked+' standalone HTML demo pages and 60 SEO design pages.');
