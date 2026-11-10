import test from 'node:test';
import assert from 'node:assert/strict';
import {translateInterfaceText,canTranslatePath} from '../static-source/lib/inline-translation.mjs';

test('public site translation is immediate, offline and only changes text, not URLs',()=>{
 const examples=[
  ['Jasa Website','Web Services'],
  ['Harga & Paket Website','Website Packages & Pricing'],
  ['Beli Website','Buy a Website'],
  ['Artikel','Articles'],
  ['Berita','News'],
  ['Bikin Website Sekarang','Start Your Website Project'],
  ['Konsultasi Gratis','Free Consultation'],
  ['Nama kamu *','Your Name *'],
  ['Nama bisnis','Business Name'],
  ['Fitur yang dibutuhkan','Required Features'],
  ['Sekali bayar','One-Time Project'],
  ['Portofolio Website','Website Portfolio'],
  ['di seluruh Indonesia.','across Indonesia.'],
  ['Harga pembuatan website.','Website Development Pricing.']
 ];
 for(const [id,en] of examples){
  assert.equal(translateInterfaceText(id),en,id);
  assert.equal(translateInterfaceText('  '+id+'  '),'  '+en+'  ',id+' preserves whitespace');
 }
 assert.equal(translateInterfaceText('Custom client-provided content'), 'Custom client-provided content');
 assert.equal(translateInterfaceText('https://bisabikinweb.site/jasa/'),'https://bisabikinweb.site/jasa/');
});

test('sensitive pages, transactions and legal documents are excluded',()=>{
 for(const path of ['/','/jasa','/harga','/portfolio','/kontak','/artikel','/industri/skincare']){
  assert.ok(canTranslatePath(path),path);
 }
 for(const path of ['/admin','/admin/iklan','/seller','/account','/checkout','/payment','/cart','/privacy','/terms','/refund','/shipping']){
  assert.equal(canTranslatePath(path),false,path);
 }
});

test('UI language module never calls remote translation API or redirects a page',async()=>{
 const {readFile}=await import('node:fs/promises');
 const [engine,studio]=await Promise.all([
  readFile('static-source/lib/inline-translation.mjs','utf8'),
  readFile('static-source/features/Studio.tsx','utf8')
 ]);
 assert.ok(!/fetch\(|location\.(?:assign|replace|href)\s*=|window\.open\(/.test(engine));
 assert.match(studio,/className="icon-button language-switch" data-no-translate/);
 assert.match(studio,/onClick=\{\(\)=>changeLocale\(locale===/);
 assert.ok(studio.includes("localStorage.setItem('bbweb_locale'"));
 assert.ok(!studio.includes('englishSwitchHref'));
});
