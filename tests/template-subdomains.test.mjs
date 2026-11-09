import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {templateSlugOrder,templateDemoForHostname,templateAddressForSlug,publicDemoUrl,TEMPLATE_SUBDOMAINS_READY} from '../static-source/lib/template-subdomains.mjs';
import {handleTemplateRequest} from '../cloudflare/template-router.mjs';

const site='https://bisabikinweb.site';
test('60 unique fixed template1..template60 hostnames map one-to-one to catalog demos',()=>{
 assert.equal(templateSlugOrder.length,60);
 assert.deepEqual(templateSlugOrder,websiteDemos.map(x=>x.slug),'Do not reorder catalog demo slugs without migration and approval');
 assert.equal(new Set(templateSlugOrder).size,60);
 for(let i=1;i<=60;i++){
  const host='template'+i+'.bisabikinweb.site';
  const demo=templateDemoForHostname(host);
  assert.deepEqual(demo,{number:i,slug:websiteDemos[i-1].slug,hostname:host});
  assert.equal(templateAddressForSlug(websiteDemos[i-1].slug),'https://'+host+'/');
 }
 for(const bad of ['template0.bisabikinweb.site','template61.bisabikinweb.site','template01.bisabikinweb.site','template1.badsite.test','template1.bisabikinweb.site.badsite.test','app.bisabikinweb.site','bisabikinweb.site']){
  assert.equal(templateDemoForHostname(bad),null,bad);
 }
});
test('Catalog still links to working legacy demo until DNS and SSL are verified',()=>{
 assert.equal(publicDemoUrl('meridian-advisory',{subdomainsReady:false}),site+'/demo/meridian-advisory/');
 assert.equal(publicDemoUrl('meridian-advisory',{subdomainsReady:TEMPLATE_SUBDOMAINS_READY}),TEMPLATE_SUBDOMAINS_READY?'https://template9.bisabikinweb.site/':site+'/demo/meridian-advisory/');
 assert.equal(publicDemoUrl('meridian-advisory',{subdomainsReady:true}),'https://template9.bisabikinweb.site/');
});
test('Cloudflare config uses exactly 60 host-specific routes, never wildcard app/media/shop routes',()=>{
 const conf=JSON.parse(readFileSync(new URL('../cloudflare/wrangler.json',import.meta.url),'utf8'));
 assert.equal(conf.routes.length,60);
 assert.deepEqual(conf.routes.map(x=>x.pattern),Array.from({length:60},(_,i)=>'template'+(i+1)+'.bisabikinweb.site/*'));
 assert.ok(conf.routes.every(x=>x.zone_name==='bisabikinweb.site'));
 assert.ok(conf.workers_dev===false);
});
test('Each template hostname serves the correct self-contained demo SSR root',async()=>{
 for(let i=1;i<=60;i++){
  const host='https://template'+i+'.bisabikinweb.site/';
  let called;
  const response=await handleTemplateRequest(new Request(host),async(url,options)=>{
   called={url,options};
   return new Response('<!doctype html><html>'+websiteDemos[i-1].title+'</html>',{status:200,headers:{'Content-Type':'text/html; charset=UTF-8','Set-Cookie':'private=dont-forward','Content-Security-Policy':"default-src 'self'",'Content-Length':'999'}});
  });
  assert.equal(called.url,site+'/demo/'+websiteDemos[i-1].slug+'/',host);
  assert.equal(called.options.method,'GET');
  assert.equal(response.status,200);
  assert.ok((await response.text()).includes(websiteDemos[i-1].title),host);
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
  assert.equal(response.headers.get('Set-Cookie'),null);
  assert.equal(response.headers.get('Content-Length'),null);
  assert.equal(response.headers.get('Content-Security-Policy'),"default-src 'self'");
 }
});
test('Assets are proxied from primary origin, checkout and account leave subdomain',async()=>{
 let hit='';
 const fetcher=async(url)=>{hit=url;return new Response('asset',{status:200,headers:{'Content-Type':'application/javascript'}})};
 const root='https://template60.bisabikinweb.site';
 const js=await handleTemplateRequest(new Request(root+'/assets/index-abc.js'),fetcher);
 assert.equal(js.status,200);
 assert.equal(hit,site+'/assets/index-abc.js');
 for(const path of ['/pesan-website/?desain=kreativa-learning','/beli-website/','/account/','/admin/','/portfolio/']){
  hit='';
  const result=await handleTemplateRequest(new Request(root+path),fetcher);
  assert.equal(result.status,302);
  assert.equal(result.headers.get('Location'),site+path);
  assert.equal(hit,'','Protected path must never proxy through a demo subdomain');
 }
 const short=await handleTemplateRequest(new Request(root+'/demo/kreativa-learning/'),fetcher);
 assert.equal(short.status,308);
 assert.equal(short.headers.get('Location'),root+'/');
 const unknown=await handleTemplateRequest(new Request(root+'/unknown/'),fetcher);
 assert.equal(unknown.status,302);
 assert.equal(unknown.headers.get('Location'),site+'/unknown/');
});
test('Unknown hosts or invalid methods do not reach the origin',async()=>{
 let called=0;
 const fetcher=async()=>{called++;return new Response('ok')};
 const h='https://template1.bisabikinweb.site/';
 assert.equal((await handleTemplateRequest(new Request('https://template61.bisabikinweb.site/'),fetcher)).status,404);
 assert.equal((await handleTemplateRequest(new Request(h,{method:'POST'}),fetcher)).status,405);
 assert.equal(called,0);
});
test('Browser routing hydrates demo at template root, and purchases remain apex-origin',()=>{
 const main=readFileSync(new URL('../static-source/main.tsx',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../static-source/features/WebsiteLiveDemo.tsx',import.meta.url),'utf8');
 assert.match(main,/templateDemoForHostname\(location.hostname\)/);
 assert.match(main,/activeTemplate\?'\/demo\/'\+activeTemplate.slug/);
 assert.match(main,/templateDeepLink/);
 assert.match(demo,/https:\/\/bisabikinweb\.site\/pesan-website\//);
 assert.match(demo,/https:\/\/bisabikinweb\.site\/beli-website\//);
});
