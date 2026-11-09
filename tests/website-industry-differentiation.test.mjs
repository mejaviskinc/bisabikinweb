import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {industryExperiences} from '../static-source/lib/demo-industries.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const cards=source('static-source/features/WebsiteStore.tsx');
const architecture=source('static-source/components/IndustrySitePreview.tsx');
const css=source('static-source/components/industry-site-preview.css');
const live=source('static-source/features/WebsiteLiveDemo.tsx');

test('Company Profile and E-Commerce are unmistakable catalog filters and badges',()=>{
 assert.match(cards,/PROFIL PERUSAHAAN/);
 assert.match(cards,/Company Profile/);
 assert.match(cards,/E-Commerce/);
 assert.match(cards,/setCategory\('company-profile'\)/);
 assert.match(cards,/setCategory\('toko-online'\)/);
 assert.match(cards,/ws-type-badge/);
 assert.match(cards,/ws-category-quick/);
 assert.match(cards,/hasLivePreview\?<LiveSitePreview/);
});

test('Catalog minisites have eight genuinely different sector-specific structures',()=>{
 const categories=[...new Set(websiteDemos.map(d=>d.category))];
 assert.equal(categories.length,8);
 assert.deepEqual(new Set(categories),new Set(Object.keys(industryExperiences)));
 const visualClasses={
   umkm:'ws-ip-local','company-profile':'ws-ip-corporate','toko-online':'ws-ip-commerce',
   ekspor:'ws-ip-export',travel:'ws-ip-travel',restoran:'ws-ip-restaurant',
   fashion:'ws-ip-fashion',pendidikan:'ws-ip-education'
 };
 for(const category of categories){
   assert.ok(architecture.includes("d.category==='"+category+"'"),category+' needs its own visual structure');
   assert.ok(architecture.includes(visualClasses[category]),category+' needs dedicated markup');
   assert.ok(css.includes('.'+visualClasses[category]),category+' needs dedicated styling');
 }
 assert.match(architecture,/profile.nav.slice\(0,4\)/);
 assert.match(architecture,/data-industry-preview=/);
 assert.match(cards,/IndustrySitePreview demo=\{d\}/);
});

test('Company Profile shows corporate service cards, not mock shopping products',()=>{
 assert.match(architecture,/ws-ip-corp-services/);
 assert.match(architecture,/SOLUSI/);
 assert.match(architecture,/Konsultasi proyek/);
 assert.match(architecture,/PORTFOLIO/);
 assert.match(architecture,/PROFIL PERUSAHAAN/);
});
test('E-Commerce renders shopping collection, real demo product names and example prices',()=>{
 assert.match(architecture,/ws-ip-shop-categories/);
 assert.match(architecture,/ws-ip-products/);
 assert.match(architecture,/idr\(p.price\)/);
 assert.match(architecture,/galleryPhotoFor\(d,i\)/);
 assert.match(architecture,/ShoppingBag/);
 assert.match(architecture,/E-COMMERCE/);
});
test('Shared live demo includes visible industry signatures without changing checkout',()=>{
 assert.match(live,/DemoIndustrySignature demo=\{d\}/);
 assert.match(css,/\.wd-signature-company-profile/);
 assert.match(css,/\.wd-signature-toko-online/);
 assert.match(css,/\.wd-industry-signature/);
 assert.doesNotMatch(architecture,/checkout\s*\(/);
});
