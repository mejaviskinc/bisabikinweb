import assert from 'node:assert/strict';
import {serviceSeoById} from '../static-source/lib/service-seo.mjs';
import {readFile} from 'node:fs/promises';

const origin='https://bisabikinweb.site';
const indexable=['','jasa','wilayah','harga','portfolio','merch','tentang','kontak','artikel','berita','redaksi','privacy','terms','refund','shipping'];
const privateRoutes=['admin','admin/iklan','admin/sellers','admin/payments','seller','account','cart','checkout','track-order','layanan-digital'];
const getHtml=route=>readFile('site-dist/'+(route?route+'/':'')+'index.html','utf8');
const first=(html,re)=>html.match(re)?.[1]||'';
const scripts=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const titleSet=new Set(),descriptionSet=new Set();

// Jalur pencarian dari homepage harus menuju halaman layanan utama yang indexable.
const searchIntentTargets=[
 '/jasa/','/jasa/company-profile/','/jasa/landing-page/',
 '/jasa/ecommerce/','/jasa/kelola-instagram/','/harga/','/portfolio/','/wilayah/'
];
const homeMarkup=await getHtml('');
for(const target of searchIntentTargets){
 assert.ok(homeMarkup.includes('href="'+target+'"'),'Homepage should link directly to '+target);
}
assert.match(homeMarkup,/<h2 id="sitelinks-title">Jasa bikin website untuk kebutuhan bisnismu\.<\/h2>/);
const serviceMarkup=await getHtml('jasa');
assert.match(serviceMarkup,/jasa pembuatan website untuk bisnis/i);
const instagramMarkup=await getHtml('jasa/kelola-instagram');
assert.match(instagramMarkup,/<title>Jasa Kelola Instagram Bulanan untuk UMKM &amp; Brand/);
assert.match(instagramMarkup,/<meta name="robots" content="index,follow/);


const sitemap=await readFile('site-dist/sitemap.xml','utf8');
const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(locations).size,locations.length,'Sitemap contains duplicate URLs');
assert.ok(locations.every(url=>url.startsWith(origin+'/')),'Sitemap must not include other hosts');
const indexedLocations=new Set(locations);

for(const route of indexable){
 const html=await getHtml(route);
 const url=origin+'/'+(route?route+'/':'');
 const title=first(html,/<title>([^<]+)<\/title>/);
 const description=first(html,/<meta name="description" content="([^"]+)"/);
 const canonical=[...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m=>m[1]);
 const robots=first(html,/<meta name="robots" content="([^"]+)"/);
 assert.ok(title.length>15,route+' has a weak or empty title');
 assert.ok(description.length>=55,route+' has a weak or empty meta description');
 assert.ok(!titleSet.has(title),route+' repeats another core menu title');
 assert.ok(!descriptionSet.has(description),route+' repeats another core menu description');
 titleSet.add(title);descriptionSet.add(description);
 assert.equal(canonical.length,1,route+' must have exactly one canonical');
 assert.equal(canonical[0],url,route+' must self-canonicalize');
 assert.ok(!robots.includes('noindex'),route+' should be indexable');
 assert.ok(indexedLocations.has(url),route+' missing from sitemap');
 const schemas=scripts(html);
 assert.equal(schemas.filter(s=>s['@type']==='WebPage'||s['@type']==='CollectionPage').length,1,route+' needs one WebPage or CollectionPage');
 assert.ok(schemas.every(s=>s['@context']==='https://schema.org'),route+' has invalid JSON-LD context');
 assert.ok(schemas.filter(s=>s['@type']==='Organization').length<2,route+' repeats Organization markup');
 assert.ok(schemas.filter(s=>s['@type']==='WebSite').length<2,route+' repeats WebSite markup');
 if(route){
  const breadcrumb=schemas.find(s=>s['@type']==='BreadcrumbList');
  assert.ok(breadcrumb,route+' missing BreadcrumbList');
  assert.equal(breadcrumb.itemListElement[0].item,origin+'/');
  assert.equal(breadcrumb.itemListElement.at(-1).item,url);
 }
}
for(const route of privateRoutes){
 const html=await getHtml(route);
 assert.match(html,/<meta name="robots" content="noindex,nofollow"/,route+' needs noindex');
 assert.ok(!html.includes('rel="canonical"'),route+' must not send conflicting canonical');
 assert.ok(!indexedLocations.has(origin+'/'+route+'/'),route+' must not be in sitemap');
 assert.equal(scripts(html).length,0,route+' must not publish marketing/organization schema');
}
for(const route of ['jasa/landing-page','portfolio/berbeda','artikel/website-ekspor-bisnis-internasional']){
 const html=await getHtml(route),url=origin+'/'+route+'/';
 assert.ok(indexedLocations.has(url),route+' detail URL must be retained');
 assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url);
 const graph=scripts(html);
 assert.equal(graph.filter(s=>s['@type']==='BreadcrumbList').length,1,route+' requires one breadcrumb');
 if(route.startsWith('artikel/'))assert.equal(graph.filter(s=>['NewsArticle','BlogPosting'].includes(s['@type'])).length,1,'Article markup must not be duplicated');
 if(route.startsWith('jasa/'))assert.equal(graph.filter(s=>s['@type']==='Service').length,1,'Each service detail needs one Service markup');
}
// The language button translates the current page; no standalone /en/ pages or
// alternate hreflang URLs may be advertised after removing the old route tree.
assert.ok(!locations.some(url=>url.startsWith(origin+'/en/')),'Old English routes must be absent from sitemap');
for(const route of ['','jasa','harga','portfolio','kontak']){
 const html=await getHtml(route);
 assert.match(html,/<html lang="id">/,'Canonical source remains Indonesian for '+route);
 assert.ok(!html.includes('hreflang="en"'),'Removed English routes must not be linked in SEO metadata');
 assert.match(html,/class="icon-button language-switch"/,'Language toggle should exist on current page: '+route);
 assert.ok(!html.includes('href="/en/'),'Language toggle must never navigate to /en: '+route);
}
await assert.rejects(getHtml('en'),{code:'ENOENT'},'Standalone /en/ must not be published');
const robots=await readFile('site-dist/robots.txt','utf8');
assert.match(robots,/Allow: \//);
assert.doesNotMatch(robots,/Disallow: \/(admin|seller|account|cart|checkout|track-order)\//,'Do not hide noindex from crawlers');
assert.ok(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
assert.ok(!sitemap.includes('https://media.bisabikinweb.site')&&!sitemap.includes('https://shop.bisabikinweb.site'));
console.log('SEO output verified:',indexable.length,'unique core menus,',privateRoutes.length,'noindex areas,',locations.length,'canonical sitemap URLs.');

const nationwideHome=await getHtml('');
const nationwide=await getHtml('wilayah');
assert.match(nationwideHome, /href="\/wilayah\//, 'Homepage must link to nationwide coverage');
assert.match(nationwideHome, /Jasa bikin web/, 'Homepage must mention national website development service');
assert.match(nationwide, /38 provinsi/, 'Coverage page must specify all 38 provinces');
const {serviceAreaGroups}=await import('../static-source/lib/service-areas.mjs');
assert.equal(serviceAreaGroups.reduce((sum,group)=>sum+group.provinces.length,0),38,'All provinces must be represented');
for(const group of serviceAreaGroups)for(const province of group.provinces){
 assert.ok(nationwide.includes(province.name),province.name+' missing from coverage page');
 assert.ok(province.places.every(city=>nationwide.includes(city)),province.name+' missing city/region');
}
assert.equal(scripts(nationwide).filter(schema=>schema['@type']==='Service'&&schema.areaServed?.name==='Indonesia').length,1,'Nationwide page must have one national Service schema');
console.log('National coverage SEO verified: 38 provinces and selected major cities.');

const {cityLandingPages}=await import('../static-source/lib/city-pages.mjs');
assert.equal(cityLandingPages.length,16,'Create 16 priority city pages with unique content');
assert.equal(new Set(cityLandingPages.map(city=>city.title)).size,16,'City titles must be unique');
assert.equal(new Set(cityLandingPages.map(city=>city.description)).size,16,'City meta descriptions must be unique');
assert.equal(new Set(cityLandingPages.map(city=>city.scenario)).size,16,'City scenarios must be unique');
for(const city of cityLandingPages){
 const route='wilayah/'+city.slug;
 const html=await getHtml(route);
 const url=origin+'/'+route+'/';
 assert.ok(indexedLocations.has(url),route+' missing from sitemap');
 assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url,route+' needs self canonical');
 assert.match(html,/<meta name="robots" content="index,follow/,route+' indexable');
 assert.ok(html.includes(city.city)&&html.includes(city.scenarioTitle),route+' lacks local useful content');
 assert.ok(html.includes(city.tip),route+' lacks specific business recommendation');
 assert.ok(html.includes(city.faq[0][0])&&html.includes(city.faq[1][0]),route+' lacks local FAQ');
 assert.ok(nationwide.includes('href="/wilayah/'+city.slug+'/'),route+' not linked from national area hub');
 const graph=scripts(html);
 const service=graph.find(s=>s['@type']==='Service');
 assert.equal(service?.areaServed?.name,city.city,route+' must describe the city served');
 const breadcrumb=graph.find(s=>s['@type']==='BreadcrumbList');
 assert.ok(breadcrumb?.itemListElement.some(el=>el.item===origin+'/wilayah/'),route+' missing hub in breadcrumb');
}
console.log('City SEO output verified:',cityLandingPages.length,'unique pages, self canonical, index, schema, and hub links.');


const {provincePages,localityPages,placeLink}=await import('../static-source/lib/geo-pages.mjs');
assert.equal(provincePages.length,38,'Must have 38 province guides');
assert.equal(localityPages.length,174,'Must cover 174 additional places');
assert.equal(new Set([...provincePages,...localityPages].map(page=>page.path)).size,212,'All added URLs unique');
for(const province of serviceAreaGroups.flatMap(group=>group.provinces)){
 for(const place of province.places){
  const path=placeLink(place,province.name);
  assert.ok(nationwide.includes('href="'+path),place+' must appear as linked location');
 }
}
for(const page of provincePages){
 const url=origin+page.path+'/';
 const html=await getHtml(page.path.slice(1));
 assert.ok(indexedLocations.has(url),page.path+' missing sitemap');
 assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url,page.path+' canonical mismatch');
 assert.equal(first(html,/<title>([^<]+)<\/title>/),page.title,page.path+' title mismatch');
 assert.ok(!first(html,/<meta name="robots" content="([^"]+)"/).includes('noindex'),page.path+' noindex');
 const graph=scripts(html),service=graph.find(s=>s['@type']==='Service'),breadcrumbs=graph.find(s=>s['@type']==='BreadcrumbList');
 assert.equal(graph.filter(s=>s['@type']==='Service').length,1,page.path+' service schema duplicates');
 assert.ok(breadcrumbs?.itemListElement.some(c=>c.item===origin+'/wilayah/'),page.path+' breadcrumb missing');
 assert.equal(service?.areaServed?.name,page.name);
 assert.ok(html.includes(page.name)&&html.includes(page.locations[0]),page.path+' directory missing');
}
let readyCount=0;
for(const page of localityPages){
 const html=await getHtml(page.path.slice(1));
 const url=origin+page.path+'/';
 assert.equal(first(html,/<title>([^<]+)<\/title>/),page.title,page.path+' title mismatch');
 assert.ok(page.editorial.scenario.length>=80,page.path+' needs a substantial location-specific scenario');
 assert.ok(page.editorial.assets.length>=3,page.path+' needs a practical local brief checklist');
 assert.ok(html.includes(page.editorial.scenario),page.path+' must show its distinctive scenario');
 assert.ok(html.includes(page.provinceEditorial.journey),page.path+' must show regional context');
 assert.ok(html.includes(page.topic.name)&&html.includes(page.topic.steps[0]),page.path+' must contain useful visible guide');
 if(page.indexReady){
  readyCount++;
  assert.ok(page.source,'Only source-backed locality guides may be enabled at this stage');
  assert.ok(indexedLocations.has(url),page.path+' must be in the sitemap');
  assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url,page.path+' canonical mismatch');
  assert.match(html,/<meta name="robots" content="index,follow/,page.path+' should be indexable');
  assert.ok(scripts(html).some(schema=>schema['@type']==='Service'),page.path+' needs Service schema');
 }else{
  assert.equal(first(html,/<meta name="robots" content="([^"]+)"/),'noindex,nofollow',page.path+' draft remains noindex');
  assert.ok(!html.includes('rel="canonical"'),page.path+' draft should not claim canonical');
  assert.ok(!indexedLocations.has(url),page.path+' draft must stay out of sitemap');
  assert.equal(scripts(html).length,0,page.path+' draft should not expose marketing schema');
 }
}
assert.equal(readyCount,14,'Expected 14 individually curated, source-backed locality guides');
assert.equal(new Set([...provincePages,...localityPages].map(page=>page.title)).size,212,'Generated titles should be unique');
console.log('National coverage SEO verified: 38 provinces, 14 source-backed localities, 160 remaining drafts, plus 16 priority cities.');

const {sitelinkTargets}=await import('../static-source/lib/sitelinks.mjs');
assert.match(nationwideHome,/class="reference-main-nav"/,'Desktop reference navigation must render');
for(const label of ['Beranda','Beli Website','Portofolio','FAQ']){
 assert.ok(nationwideHome.includes('>'+label+'</a>'),'Main navigation is missing '+label);
}
for(const label of ['Layanan','Tentang']){
 assert.match(nationwideHome,new RegExp('<summary[^>]*>'+label+'(?:\\s|<)'),'Main navigation is missing grouped menu '+label);
}
assert.match(nationwideHome,/<details class="site-nav-dropdown">/,'Layanan must offer a dropdown');
assert.match(nationwideHome,/href="\/jasa\/company-profile\/"/,'Service flyout must link to company profile');
assert.match(nationwideHome,/href="https:\/\/media\.bisabikinweb\.site\/">Media<\/a>/,'Media must link directly to the newsroom subdomain');
assert.match(nationwideHome,/<section class="section faq-section" id="faq">/,'FAQ should target the homepage FAQ anchor');
assert.equal(sitelinkTargets.length,9,'Homepage should expose nine intent-focused service destinations');
assert.equal(new Set(sitelinkTargets.map(item=>item.href)).size,sitelinkTargets.length,'Sitelink URLs must be unique');
assert.ok(nationwideHome.includes('<title>Jasa Pembuatan Website &amp; Bikin Web | BisaBikinWeb Indonesia</title>'),'Homepage title must prioritize service keywords and selected brand');
assert.match(nationwideHome,/<meta property="og:site_name" content="BisaBikinWeb Indonesia"\/>/,'Open Graph site name should use the chosen brand');
assert.match(nationwideHome,/<meta name="application-name" content="BisaBikinWeb Indonesia"\/>/,'Application name should use the chosen brand');
assert.equal(scripts(nationwideHome).find(s=>s['@type']==='WebSite')?.name,'BisaBikinWeb Indonesia','Google WebSite structured data should use the chosen site name');
assert.match(nationwideHome,/aria-label="Halaman utama layanan BisaBikinWeb"/,'Homepage must have a clearly labelled priority navigation section');
assert.equal((nationwideHome.match(/class="bbw-hero-slide(?: is-active)?"/g)||[]).length,5,'Homepage hero must render five complete slides');
assert.match(nationwideHome,/aria-label="Slide 5: Siap Berkembang"/,'All hero slides must offer direct navigation');
assert.doesNotMatch(nationwideHome,/aria-label="(?:Slide sebelumnya|Slide berikutnya|Jeda slide otomatis)"/,'Hero must not show previous, next, or pause buttons');
assert.match(nationwideHome,/YOUR NEXT <b>WEBSITE<\/b>/,'Hero supporting headline should remain steady without rapid text rotation');
for(const target of sitelinkTargets){
 const url=origin+target.href;
 const route=target.href.replace(/^\/+|\/+$/g,'');
 const html=await getHtml(route);
 assert.ok(indexedLocations.has(url),'Sitelink destination must be in sitemap: '+url);
 assert.ok(nationwideHome.includes('href="'+target.href+'"'),'Homepage must have crawlable href: '+target.href);
 assert.ok(nationwideHome.includes(target.label.replace(/&/g,'&amp;')),'Homepage must show descriptive sitelink label: '+target.label);
 assert.ok((nationwideHome.match(new RegExp('href="'+target.href.replace(/\//g,'\\/')+'"','g'))||[]).length>=2,'Homepage and footer should link to '+target.href);
 assert.match(html,/<meta name="robots" content="index,follow/,'Sitelink destination must be indexable: '+route);
 assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url,'Sitelink destination needs self-canonical: '+route);
}
console.log('Sitelink navigation verified: six crawlable homepage and footer destinations with indexable pages.');


// Commercial SEO and on-page bilingual QA.
const jasaHtml=await getHtml('jasa');
const hargaHtml=await getHtml('harga');
const portfolioHtml=await getHtml('portfolio');
const kontakHtml=await getHtml('kontak');
assert.match(jasaHtml,/<title>Jasa Pembuatan Website untuk Bisnis &amp; Perusahaan \| BisaBikinWeb Indonesia<\/title>/);
for(const href of ['/harga/','/portfolio/','/artikel/struktur-website-company-profile-b2b-rfq/','/artikel/biaya-website-bisnis-domain-hosting-maintenance/']){
 assert.ok(jasaHtml.includes('href="'+href+'"'),'Jasa page should link to '+href);
}
for(const href of ['/jasa/','/kontak/','/artikel/biaya-website-bisnis-domain-hosting-maintenance/']){
 assert.ok(hargaHtml.includes('href="'+href+'"'),'Harga page should link to '+href);
}
assert.ok(portfolioHtml.includes('href="/jasa/ecommerce/"'),'Portfolio should link to e-commerce service');
assert.ok(portfolioHtml.includes('href="/jasa/company-profile/"'),'Portfolio should link to company profile service');
assert.match(kontakHtml,/class="consult-form"/,'Same lead form is kept for both client-side languages');
for(const field of ['name','company','phone','email','type','budget','domain','deadline','features','reference','message']){
 assert.ok(kontakHtml.includes('name="'+field+'"'),'Contact form lacks '+field);
}
assert.match(jasaHtml,/aria-label=".*language|aria-label="Change this page to English without navigation"/i,'Language control must describe non-navigation intent');
const service=scripts(await getHtml('jasa/company-profile')).find(schema=>schema['@type']==='Service');
assert.equal(service?.areaServed?.name,'Worldwide','Remote client coverage belongs to the original URL');
console.log('Inline bilingual SEO checks passed: no /en routes, canonical ID pages, live switch, public form and commercial links.');

// Commercial service pages must describe an actual service, not six generic headings.
// Keep one URL per service topic, with an indexable canonical and helpful crosslinks.
for(const [slug,seo] of Object.entries(serviceSeoById)){
 const route='jasa/'+slug;
 const html=await getHtml(route);
 const url=origin+'/'+route+'/';
 const title=first(html,/<title>([^<]+)<\/title>/);
 const description=first(html,/<meta name="description" content="([^"]+)"/);
 const service=scripts(html).find(schema=>schema['@type']==='Service');
 assert.equal(title,seo.title+' | BisaBikinWeb Indonesia',route+' must target real buying intent');
 assert.ok(description.startsWith(seo.description.slice(0,80)),route+' needs a service-specific summary');
 assert.equal(first(html,/<link rel="canonical" href="([^"]+)"/),url,route+' canonical mismatch');
 assert.ok(indexedLocations.has(url),route+' is missing from the public sitemap');
 assert.equal(service?.name,seo.title,route+' must advertise the matching Service schema');
 assert.ok(html.includes(seo.heading.replaceAll('&','&amp;')),route+' must render a descriptive H1');
 for(const related of seo.related){
  assert.ok(html.includes('href="'+related.href+'"'),route+' missing meaningful internal link: '+related.href);
  assert.ok(indexedLocations.has(origin+related.href),route+' references a non-indexable sitemap target: '+related.href);
 }
}
console.log('Commercial SEO verified: six focused service pages and crawlable relevant internal links.');
