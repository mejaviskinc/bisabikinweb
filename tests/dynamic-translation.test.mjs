import test from 'node:test';
import assert from 'node:assert/strict';
import {
 primeDynamicTranslator,shouldTranslatePublicText,queuePublicTranslation,
 cachedDynamicTranslation,clearDynamicTranslationQueue
} from '../static-source/lib/live-content-translation.mjs';
import {translateInterfaceText} from '../static-source/lib/inline-translation.mjs';
const publicElement={
 closest(query){
  return query.includes('data-dynamic-translate="public"')?{dataset:{dynamicTranslate:'public'}}:null;
 }
};
const privateForm={closest:query=>query.includes('data-dynamic-translate="public"')||query.includes('.consult-form')?{}:null};

test('new public CMS copy gets accepted without pre-registering a phrase',()=>{
 assert.ok(shouldTranslatePublicText('Harga dan layanan website untuk perusahaan pada bulan ini',publicElement));
 assert.ok(shouldTranslatePublicText('Pemerintah Indonesia menerbitkan berita ekonomi terbaru untuk pelaku usaha',publicElement));
 assert.equal(shouldTranslatePublicText('Harga dan layanan website untuk perusahaan',privateForm),false);
 assert.equal(shouldTranslatePublicText('https://example.com untuk bisnis',publicElement),false);
 assert.equal(shouldTranslatePublicText('Alamat email customer@example.com untuk bisnis',publicElement),false);
 assert.equal(shouldTranslatePublicText('Rp800.000',publicElement),false);
 assert.equal(shouldTranslatePublicText('Browse the website',publicElement),false);
});

test('on-device translator is primed from a click and caches previously unseen CMS text',async()=>{
 const previous=globalThis.Translator;
 let started=0;
 globalThis.Translator={create(options){
  started++;
  assert.deepEqual(options,{sourceLanguage:'id',targetLanguage:'en'});
  return Promise.resolve({translate:async value=>'EN: '+value});
 }};
 try{
  assert.equal(primeDynamicTranslator(),true);
  const original='Pemerintah Indonesia menyampaikan berita terbaru untuk bisnis kecil';
  const translated=await Promise.race([
   new Promise(resolve=>{assert.equal(queuePublicTranslation(original,resolve),true)}),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('translation timeout')),2500))
  ]);
  assert.equal(translated,'EN: '+original);
  assert.equal(cachedDynamicTranslation(original),translated);
  assert.equal(translateInterfaceText(original),translated);
  assert.equal(started,1,'reuse native translator session');
 }finally{
  clearDynamicTranslationQueue();
  if(previous===undefined)delete globalThis.Translator;
  else globalThis.Translator=previous;
 }
});

test('CMS scope and async integration are wired to existing marketing components only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const [studio,inline,endpoint,client]=await Promise.all([
  readFile('static-source/features/Studio.tsx','utf8'),
  readFile('static-source/lib/inline-translation.mjs','utf8'),
  readFile('supabase/functions/bbweb-public-translate/index.ts','utf8'),
  readFile('static-source/lib/live-content-translation.mjs','utf8')
 ]);
 for(const marker of [
  'className="services-grid" data-dynamic-translate="public"',
  'className="pricing-grid" data-dynamic-translate="public"',
  'className="portfolio-grid" data-dynamic-translate="public"',
  'className="article-grid" data-dynamic-translate="public"',
  'className="section article-detail narrow" data-dynamic-translate="public"',
  'className="section case-study" data-dynamic-translate="public"'
 ])assert.ok(studio.includes(marker),'Missing public CMS marker: '+marker);
 assert.match(studio,/if\(next==='en'\)primeDynamicTranslator\(\)/);
 assert.match(inline,/queuePublicTranslation\(source\.trim\(\)/);
 assert.match(inline,/node\.isConnected&&textOriginals\.get\(node\)===source/);
 assert.match(client,/credentials:'omit'/,'No user credentials forwarded to translator');
 assert.match(endpoint,/ALLOWED_ORIGINS/);
 assert.match(endpoint,/invalid_public_segments/);
 assert.match(endpoint,/translation_provider_not_configured/);
 assert.ok(!studio.includes('href="/en/'));
});
