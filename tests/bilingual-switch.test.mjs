import test from 'node:test';
import assert from 'node:assert/strict';
import {
  englishPages,englishHref,englishSwitchHref,indonesianSwitchHref,
  normalizeLocalePath,hasEnglishPage,formatEnglishPrice
} from '../static-source/lib/languages.mjs';

test('language switch stays on the same translated page, both directions',()=>{
 for(const path of Object.keys(englishPages)){
  const expected=path==='/'?'/en/':'/en'+path+'/';
  const id=path==='/'?'/':path+'/';
  assert.equal(englishSwitchHref(path),expected);
  assert.equal(englishSwitchHref(id),expected);
  assert.equal(indonesianSwitchHref(path),id);
  assert.equal(normalizeLocalePath(path),path);
  assert.equal(hasEnglishPage(id),true);
 }
});

test('untranslated routes are explicitly directed to English overview',()=>{
 for(const path of ['/artikel','/artikel/website-umkm','/beli-website','/portfolio/mejavi-skin','/wilayah/jakarta']){
  assert.equal(hasEnglishPage(path),false);
  assert.equal(englishSwitchHref(path),'/en/');
 }
 assert.equal(englishHref('/jasa/'),'/en/jasa/');
 assert.equal(englishHref('/'),'/en/');
 assert.equal(indonesianSwitchHref('/jasa/'),'/jasa/');
});

test('English prices preserve the exact Indonesian price, without a hidden markup',()=>{
 const prices=[800_000,1_500_000,3_500_000];
 for(const price of prices){
  const displayed=formatEnglishPrice(price);
  assert.ok(displayed.includes(price.toLocaleString('en-US')),'numeric price mismatch: '+displayed);
  assert.match(displayed,/IDR/);
  assert.ok(!displayed.includes('USD'));
 }
});
