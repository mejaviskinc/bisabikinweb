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
