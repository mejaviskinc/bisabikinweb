import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteDemos,demoBySlug,demoCounts} from '../static-source/lib/website-demos.mjs';
import {demoExperiences,brandStories,demoRouteList,demoSlug,demoItemPath} from '../static-source/lib/demo-site-config.mjs';
const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const build=source('build-pages.mjs');
const store=source('static-source/features/WebsiteStore.tsx');
const client=source('static-source/main.tsx');
const ssr=source('static-source/render.tsx');
const demo=source('static-source/features/WebsiteExperience.tsx');
const shim=source('static-source/features/WebsiteLiveDemo.tsx');
const api=source('supabase/functions/bbweb-website-store/index.ts');
const allRoutes=new Set();
test('60 individually branded demo websites across eight industries',()=>{
 assert.equal(websiteDemos.length,60);
 assert.equal(new Set(websiteDemos.map(x=>x.slug)).size,60);
 assert.deepEqual(Object.values(demoCounts).sort((a,b)=>a-b),[7,7,7,7,8,8,8,8]);
 assert.deepEqual(Object.keys(demoExperiences).sort(),Object.keys(demoCounts).sort());
 assert.equal(Object.keys(brandStories).length,60);
 for(const d of websiteDemos){
  assert.match(d.slug,/^[a-z0-9-]+$/);
  assert.equal(demoBySlug[d.slug].slug,d.slug);
  assert.ok(d.title.length>=4&&d.description.length>30&&d.headline.length>12,d.slug);
  assert.equal(d.offerings.length,3,d.slug);
  assert.ok(d.highlights.length>=3,d.slug);
  assert.ok(d.image.startsWith('https://images.unsplash.com/photo-'),d.slug);
  assert.ok(d.layout>=0&&d.layout<6,d.slug);
  assert.ok(brandStories[d.slug]&&brandStories[d.slug].length>=70,'Unique brand story '+d.slug);
 }
});
test('Every demo has full internal routes and three individual product or service detail pages',()=>{
 for(const d of websiteDemos){
  const experience=demoExperiences[d.category];
  assert.ok(experience,'Industry settings '+d.slug);
  const routes=demoRouteList(d);
  assert.equal(routes[0],'');
  assert.ok(routes.includes(experience.catalog));
  assert.ok(routes.includes(experience.secondary));
  assert.ok(routes.includes(experience.story));
  assert.ok(routes.includes(experience.contact));
  assert.ok(routes.length>=8,'Eight or more pages: '+d.slug);
  for(const p of d.offerings){
   assert.ok(routes.includes(experience.catalog+'/'+demoSlug(p.name)));
   assert.equal(demoItemPath(d,p),'/demo/'+d.slug+'/'+experience.catalog+'/'+demoSlug(p.name));
  }
  for(const route of routes){
   const url='/demo/'+d.slug+(route?'/'+route:'');
   assert.ok(!allRoutes.has(url),'Duplicate URL: '+url);
   allRoutes.add(url);
  }
 }
 assert.ok(allRoutes.size>=480,'At least 480 demo pages, including 60 homepages');
});
test('SSR prerender routes, React routing and canonical catalog are connected',()=>{
 assert.ok(build.includes('for(const demo of websiteDemos)'));
 assert.ok(build.includes('for(const subPath of demoRouteList(demo).filter(Boolean))'));
 assert.ok(build.includes("pages['/demo/'+demo.slug+'/'+subPath]"));
 assert.ok(client.includes("path.startsWith('/demo/')?<WebsiteLiveDemo"));
 assert.ok(ssr.includes("path.startsWith('/demo/')?<WebsiteLiveDemo"));
 assert.ok(shim.includes("export {default} from './WebsiteExperience'"));
 assert.ok(store.includes('websiteDemos.map('));
 assert.ok(store.includes('setTemplates(conceptTemplates)'));
});
test('Demo sites are noindex while design pages remain available to buyers',()=>{
 assert.ok(build.includes("path.startsWith('/demo/')"));
 assert.ok(build.includes("!path.startsWith('/demo/')"));
 assert.ok(store.includes('/pesan-website/?desain='));
});
test('Industry workflows offer demo-only form and cart behavior, without creating real transactions',()=>{
 assert.match(demo,/DEMO WEBSITE/);
 assert.match(demo,/Brand & data fiktif/);
 assert.match(demo,/Tidak ada data yang dikirim atau disimpan/);
 assert.match(demo,/Tidak ada pembayaran sungguhan/);
 assert.match(demo,/\/pesan-website\/\?desain=/);
 assert.match(demo,/type="date"/);
 assert.match(demo,/Request a quotation/);
 assert.match(demo,/checkout demo/i);
 assert.ok(!demo.includes('localStorage.setItem'));
 assert.ok(!demo.includes('fetch('));
 assert.ok(!demo.includes('window.open('));
});
test('Existing 60 template IDs remain valid in ordering system',()=>{
 assert.match(api,/bbweb_website_templates\?select=slug/);
 const seed=source('supabase/patches/website_demos_60_seed_20261108.sql');
 assert.equal((seed.match(/https:\/\/bisabikinweb\.site\/demo\/[a-z0-9-]+\//g)||[]).length,60);
});
