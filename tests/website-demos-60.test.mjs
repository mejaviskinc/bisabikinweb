import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {websiteDemos, demoBySlug, demoCounts} from '../static-source/lib/website-demos.mjs';
const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const build=source('build-pages.mjs');
const studio=source('static-source/features/WebsiteStore.tsx');
const client=source('static-source/main.tsx');
const ssr=source('static-source/render.tsx');
const demo=source('static-source/features/WebsiteLiveDemo.tsx');
const api=source('supabase/functions/bbweb-website-store/index.ts');

test('60 distinct real demo site records: no missing business content or duplicate URLs',()=>{
 assert.equal(websiteDemos.length,60);
 assert.equal(new Set(websiteDemos.map(x=>x.slug)).size,60);
 assert.deepEqual(Object.values(demoCounts).sort((a,b)=>a-b),[7,7,7,7,8,8,8,8]);
 for(const d of websiteDemos){
  assert.match(d.slug,/^[a-z0-9-]+$/);
  assert.equal(demoBySlug[d.slug].slug,d.slug);
  assert.ok(d.title.length>=4 && d.description.length>30 && d.headline.length>12,d.slug);
  assert.ok(Array.isArray(d.highlights)&&d.highlights.length>=3,d.slug);
  assert.equal(d.offerings.length,3,d.slug);
  assert.ok(d.offerings.every(x=>x.name.length>3&&x.description.length>25),d.slug);
  assert.ok(typeof d.tagline==='string'&&d.tagline.length>5,d.slug);
  assert.ok(d.image.startsWith('https://images.unsplash.com/photo-'),d.slug);
  assert.ok(d.layout>=0&&d.layout<6,d.slug);
 }
});
test('60 demos and 60 product detail pages are SSR prerendered',()=>{
 assert.ok(build.includes('for(const demo of websiteDemos)'));
 assert.ok(build.includes("pages['/demo/'+demo.slug]"));
 assert.ok(build.includes("pages['/desain/'+demo.slug]"));
 assert.ok(client.includes("path.startsWith('/demo/')?<WebsiteLiveDemo"));
 assert.ok(ssr.includes("path.startsWith('/demo/')?<WebsiteLiveDemo"));
 assert.ok(studio.includes('websiteDemos.map('));
});
test('Demo pages noindex while each design detail remains indexable, no sitemap demo URLs',()=>{
 assert.ok(build.includes("path.startsWith('/demo/')"));
 assert.ok(build.includes("!path.startsWith('/demo/')"));
});
test('Demos show clear disclaimers and no real checkout',()=>{
 assert.match(demo,/DEMO INTERAKTIF/);
 assert.match(demo,/brand fiktif|Brand contoh|contoh.*bisnis/i);
 assert.match(demo,/data tidak dikirim|Data tidak dikirim/);
 assert.match(demo,/Tidak ada checkout, pembayaran/);
 assert.match(demo,/\/pesan-website\/\?desain=/);
 assert.ok(!demo.includes('localStorage.setItem'));
 assert.ok(!demo.includes("fetch("));
 assert.ok(!demo.includes("window.open("));
});
test('60 website template slugs are backed by catalog rows for authenticated quote orders',()=>{
 assert.match(api,/bbweb_website_templates\?select=slug/);
 const seed=source('supabase/patches/website_demos_60_seed_20261108.sql');
 assert.equal((seed.match(/https:\/\/bisabikinweb\.site\/demo\/[a-z0-9-]+\//g)||[]).length,60);
 assert.match(seed,/on conflict \(slug\) do nothing/);
});
