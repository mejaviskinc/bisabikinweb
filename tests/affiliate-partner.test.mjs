import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {captureAffiliateReferral,getAffiliateReferral,validAffiliateCode} from '../static-source/lib/affiliate-referral.mjs';

function withBrowser(fn){
 const previous=globalThis.window,originalNow=Date.now,items=new Map();
 globalThis.window={location:{search:''},localStorage:{
   getItem:key=>items.has(key)?items.get(key):null,
   setItem:(key,value)=>items.set(key,String(value)),
   removeItem:key=>items.delete(key)
 }};
 try{fn(items)}finally{globalThis.window=previous;Date.now=originalNow;}
}
test('partner referral codes must be structurally valid',()=>{
 assert.equal(validAffiliateCode('BBW123456789ABC'),true);
 assert.equal(validAffiliateCode('bbw123456789abc'),true);
 assert.equal(validAffiliateCode('BBW123'),false);
 assert.equal(validAffiliateCode('javascript:alert(1)'),false);
});
test('referral persists for 30 days and expires without visitor identity',()=>withBrowser(items=>{
 const code='BBW123456789ABC';
 assert.equal(captureAffiliateReferral('?ref='+code),code);
 assert.equal(getAffiliateReferral(),code);
 assert.deepEqual(Object.keys(JSON.parse(items.get('bbweb_affiliate_ref_v1'))).sort(),['at','code']);
 const t=Date.now();Date.now=()=>t+31*24*60*60*1000;
 assert.equal(getAffiliateReferral(),'');
 assert.equal(items.has('bbweb_affiliate_ref_v1'),false);
}));
test('invalid query cannot overwrite an existing valid referral',()=>withBrowser(()=>{
 captureAffiliateReferral('?ref=BBW123456789ABC');
 assert.equal(captureAffiliateReferral('?ref=invalid<script>'),'BBW123456789ABC');
 assert.equal(getAffiliateReferral(),'BBW123456789ABC');
}));
test('storefront, API, settlement and SEO are wired together',async()=>{
 const [store,api,sql,build,studio,main]=await Promise.all([
  readFile('static-source/features/WebsiteStore.tsx','utf8'),
  readFile('supabase/functions/bbweb-website-store/index.ts','utf8'),
  readFile('docs/affiliate-schema.sql','utf8'),
  readFile('build-pages.mjs','utf8'),
  readFile('static-source/features/Studio.tsx','utf8'),
  readFile('static-source/main.tsx','utf8')
 ]);
 assert.match(store,/referral_code:getAffiliateReferral\(\)/);
 assert.match(api,/partner\.user_id!==user\.id/);
 assert.match(api,/affiliate_id:affiliateId/);
 assert.match(sql,/new\.payment_status = 'paid'/);
 assert.match(sql,/p\.environment='production'/);
 assert.match(sql,/unique references auth\.users/);
 assert.match(sql,/enable row level security/);
 assert.match(build,/pages\['\/affiliate'\]/);
 assert.match(studio,/if\(path==='\/affiliate'\)return <Affiliate\/>/);
 assert.match(main,/captureAffiliateReferral\(\)/);
});
