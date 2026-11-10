import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {englishPages,englishHref} from '../static-source/lib/languages.mjs';

const origin='https://bisabikinweb.site';
const indexable=['','jasa','wilayah','harga','portfolio','merch','tentang','kontak','artikel','berita','redaksi','privacy','terms','refund','shipping'];
const privateRoutes=['admin','admin/iklan','admin/sellers','admin/payments','seller','account','cart','checkout','track-order','layanan-digital'];
const getHtml=route=>readFile('site-dist/'+(route?route+'/':'')+'index.html','utf8');
const first=(html,re)=>html.match(re)?.[1]||'';
const scripts=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const titleSet=new Set(),descriptionSet=new Set();

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
for(const path of Object.keys(englishPages)){
 const en=englishHref(path);
 const id=path==='/'?'/':path+'/';
 const [english,indonesian]=await Promise.all([getHtml(en.slice(1,-1)),getHtml(id.slice(1,-1))]);
 assert.match(english,/<html lang="en">/);
 assert.match(indonesian,/<html lang="id">/);
 assert.equal(first(english,/<link rel="canonical" href="([^"]+)"\/>/),origin+en);
 assert.ok(indexedLocations.has(origin+en),en+' missing from sitemap');
 for(const html of [english,indonesian]){
  assert.ok(html.includes('hreflang="en" href="'+origin+en+'"'));
  assert.ok(html.includes('hreflang="id" href="'+origin+id+'"'));
 }
 assert.ok(english.includes('href="'+id+'" lang="id"'));
 assert.ok(indonesian.includes('href="'+en+'" lang="en"'));
}
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
assert.equal(sitelinkTargets.length,6,'Homepage should prioritize six core sitelink destinations');
assert.equal(new Set(sitelinkTargets.map(item=>item.href)).size,6,'Sitelink URLs must be unique');
assert.match(nationwideHome,/<title>BisaBikinWeb\.id \| Jasa Bikin Website Indonesia &amp; Global<\/title>/,'Branded homepage title must describe national and global availability');
assert.match(nationwideHome,/aria-label="Halaman utama layanan BisaBikinWeb"/,'Homepage must have a clearly labelled priority navigation section');
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


// Global commercial SEO QA: visible offers, internal links, reciprocal metadata and honest remote scope.
const jasaHtml=await getHtml('jasa');
const hargaHtml=await getHtml('harga');
const portfolioHtml=await getHtml('portfolio');
const enHomeHtml=await getHtml('en');
const enServicesHtml=await getHtml('en/jasa');
const enPricingHtml=await getHtml('en/harga');
const enPortfolioHtml=await getHtml('en/portfolio');
const enContactHtml=await getHtml('en/kontak');
assert.match(jasaHtml,/<title>Jasa Pembuatan Website untuk Bisnis &amp; Perusahaan \| BisaBikinWeb\.id<\/title>/);
assert.ok(jasaHtml.includes('href="/en/jasa/"'),'Main services must link to English services');
for(const href of ['/harga/','/portfolio/','/artikel/struktur-website-company-profile-b2b-rfq/','/artikel/biaya-website-bisnis-domain-hosting-maintenance/']){
 assert.ok(jasaHtml.includes('href="'+href+'"'),'Jasa page should link to '+href);
}
for(const href of ['/jasa/','/en/harga/','/artikel/biaya-website-bisnis-domain-hosting-maintenance/']){
 assert.ok(hargaHtml.includes('href="'+href+'"'),'Harga page should link to '+href);
}
assert.ok(portfolioHtml.includes('href="/jasa/ecommerce/"'),'Portfolio should lead to relevant e-commerce service');
assert.ok(portfolioHtml.includes('href="/jasa/company-profile/"'),'Portfolio should lead to company profile service');
assert.match(enHomeHtml,/businesses worldwide/,'English homepage should explain global remote availability');
assert.match(enServicesHtml,/How remote website projects work/);
assert.ok(enServicesHtml.includes('href="/en/kontak/"'),'English service page must have a contact path');
assert.ok(enServicesHtml.includes('href="/en/portfolio/"'),'English service page must link to portfolio');
assert.match(enPricingHtml,/international quote|business operates in/i,'English pricing must explain international custom scope');
assert.ok(enPortfolioHtml.includes('href="/portfolio/mejavi-skin/"'),'English portfolio should offer actual case study context');
assert.match(enContactHtml,/other countries/,'English contact must support remote clients');
for(const route of ['en','en/jasa']){
 const html=await getHtml(route);
 const service=scripts(html).find(schema=>schema['@type']==='Service');
 assert.equal(service?.areaServed?.name,'Worldwide',route+' should mark remote global coverage accurately');
 assert.equal(service?.areaServed?.['@type'],'Place');
}
for(const route of ['en/jasa/ecommerce','en/jasa/company-profile']){
 const service=scripts(await getHtml(route)).find(schema=>schema['@type']==='Service');
 assert.equal(service?.areaServed?.name,'Worldwide',route+' global service details should use remote coverage');
}
console.log('Global conversion and international SEO verified: metadata, contextual links, English buyer path, and remote service schema.');


// The English version must retain the Indonesian site's main visual and lead flow,
// rather than rendering a disconnected minimal landing page.
assert.match(enHomeHtml,/class="hero"/,'English homepage must use the shared hero design');
assert.match(enHomeHtml,/class="hero-showcase"/,'English hero must keep the shared visual design');
assert.match(enHomeHtml,/class="sitelink-grid"/,'English site needs a service navigation hub');
assert.match(enHomeHtml,/class="portfolio-grid"/,'English homepage needs project previews');
assert.match(enHomeHtml,/class="project-card"/,'English and Indonesian portfolio cards should match');
assert.match(enHomeHtml,/class="pricing-grid"/,'English pricing must use the same visual grid');
assert.match(enPortfolioHtml,/class="portfolio-live-card"/,'English portfolio needs actual live website previews');
assert.match(enContactHtml,/class="consult-form"/,'English contacts must offer the real inquiry form');
for(const field of ['name','company','phone','email','type','budget','domain','deadline','features','reference','message']){
 assert.ok(enContactHtml.includes('name="'+field+'"'),'English inquiry form lacks field '+field);
}
assert.ok(enContactHtml.includes('privacy policy (Indonesian)'),'Translated consent must identify the policy language');
assert.ok(enPricingHtml.includes('IDR')&&enPricingHtml.includes('800,000'),'Prices must stay in IDR with no 3.5x English markup');
assert.ok(enHomeHtml.includes('href="/beli-website/" lang="id"'),'Untranslated catalog link must be labelled Indonesian');
assert.ok(enHomeHtml.includes('href="/artikel/" lang="id"'),'Untranslated article link must be labelled Indonesian');
assert.ok(nationwideHome.includes('this page is currently in Indonesian')||nationwideHome.includes('View this page in English'),'Language switch should describe its destination');
console.log('Bilingual UI parity verified: shared visual components, same price, bidirectional locale links and functional translated consultation form.');
