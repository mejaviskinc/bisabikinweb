import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('All in One budget and bounded deliverables are published in the service catalog',()=>{
 const data=read('static-source/lib/data.ts');
 assert.match(data,/id:'all-in-one',name:'Layanan All in One'/);
 assert.match(data,/price:25000000/);
 for(const phrase of ['Website company profile + toko online','SEO dasar & setup Google Ads','Pengelolaan Instagram selama 1 bulan','Branding & desain grafis','Maintenance website 1 bulan'])assert.ok(data.includes(phrase),phrase);
});

test('Homepage, navigation, and dedicated route link to the All in One service',()=>{
 const studio=read('static-source/features/Studio.tsx');
 const app=read('static-source/main.tsx');
 assert.ok(studio.includes('import AllInOne from'));
 assert.ok(studio.includes('href="/jasa/all-in-one/"'));
 assert.ok(studio.includes("if(path==='/jasa/all-in-one')return <AllInOne"));
 assert.ok(studio.includes("service-card-all-in-one"));
 assert.ok(studio.includes('bbw-shortcut-all-in-one'));
 assert.ok(app.includes("['kelola-instagram','all-in-one'].includes(s.id)"),'Live CMS should not erase the new service');
});

test('Dedicated service page has price, transparent exclusions and a WhatsApp action',()=>{
 const page=read('static-source/features/AllInOne.tsx');
 assert.match(page,/money\(price\)/);
 assert.match(page,/25000000/);
 assert.match(page,/whatsapp\(settings\.whatsapp,message\)/);
 assert.match(page,/all_in_one_whatsapp_click/);
 assert.match(page,/Anggaran tayang Google Ads\/Meta Ads/);
 assert.match(page,/Website company profile dan toko online merupakan satu proyek terintegrasi/);
 assert.ok(!page.includes('<main className="aio-page"'),'Must not create nested main landmarks');
 assert.match(page,/href="\/portfolio\/"/);
});

test('Service URL is SEO-indexable and responsive layout exists',()=>{
 const seo=read('static-source/lib/service-seo.mjs');
 const css=read('static-source/features/all-in-one.css');
 const shortCss=read('static-source/features/homepage-conversion.css');
 const links=read('static-source/lib/sitelinks.mjs');
 assert.match(seo,/'all-in-one': \{/);
 assert.match(links,/href:'\/jasa\/all-in-one\/'/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(shortCss,/\.bbw-shortcut-grid:has\(\.bbw-shortcut-all-in-one\)/);
});
