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


test('Catalog cards use actual live demo pages instead of repeating placeholder photos',()=>{
 assert.match(studio,/function LiveSitePreview/);
 assert.match(studio,/IntersectionObserver/);
 assert.match(studio,/<iframe src=\{url\}/);
 assert.match(studio,/internalLiveDemo\?<LiveSitePreview/);
 assert.match(studio,/ws-template-visual-link/);
 assert.match(studio,/href=\{safeUrl\(t\.demo_url\)/);
});

test('All 60 industry showcases have independent visual identity and editorial identity',async()=>{
 const {creativeDirections,galleryPhotoFor}=await import('../static-source/lib/demo-creative.mjs');
 const {industryExperiences,brandPositioning}=await import('../static-source/lib/demo-industries.mjs');
 assert.equal(Object.keys(creativeDirections).length,60);
 assert.equal(new Set(websiteDemos.map(d=>d.image)).size,60,'Hero images must not be repeated across the 60 concept brands');
 assert.equal(Object.keys(industryExperiences).length,8);
 const keys=new Set(websiteDemos.map(d=>d.slug));
 assert.deepEqual(new Set(Object.keys(creativeDirections)),keys);
 for(const d of websiteDemos){
  const creative=creativeDirections[d.slug];
  assert.equal(creative.hero,d.image,d.slug);
  assert.ok(creative.story.length>55&&creative.headline.length>12,d.slug);
  assert.ok(galleryPhotoFor(d,0).startsWith('https://images.unsplash.com/photo-'),d.slug);
  const profile=brandPositioning(d);
  assert.equal(profile.nav.length,5,d.slug);
  assert.equal(profile.specialties.length,3,d.slug);
  assert.equal(profile.steps.length,3,d.slug);
  assert.ok(profile.fields.length>=3,d.slug);
  assert.ok(profile.specialties.every(x=>x.detail.length>50),d.slug);
 }
});
test('Each demo offers real multipage navigation and item detail interactions without fake checkout',()=>{
 const creative=source('static-source/lib/demo-creative.mjs');
 const sectors=source('static-source/lib/demo-industries.mjs');
 const styles=source('static-source/features/website-live-demo.css');
 const cards=source('static-source/features/WebsiteStore.tsx');
 assert.match(demo,/activePage==='detail'/);
 assert.match(demo,/navigate\('detail',i\)/);
 assert.match(demo,/wd-detail-page/);
 assert.match(demo,/galleryPhotoFor\(d,i\)/);
 assert.match(demo,/history\.pushState/);
 assert.match(demo,/popstate/);
 assert.match(sectors,/Request RFQ/);
 assert.match(sectors,/Size Guide/);
 assert.match(sectors,/Itinerary/);
 assert.match(sectors,/Kurikulum/);
 assert.match(styles,/\.wd-detail-grid/);
 assert.match(styles,/@media\(max-width:560px\)/);
 assert.match(cards,/ws-live-canvas/); // Catalog embeds actual on-site interactive previews, rather than static mockups.
 assert.ok(!demo.includes('window.open('),'No false merchant checkout should open');
});
