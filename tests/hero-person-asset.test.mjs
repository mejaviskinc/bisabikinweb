import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('homepage uses the photo cutout with linked, factual service cards',()=>{
  const studio=source('static-source/features/Studio.tsx');
  const hero=studio.slice(studio.indexOf('function AnimatedHeroShowcase()'),studio.indexOf('function Home({data',studio.indexOf('function AnimatedHeroShowcase()')));
  assert.ok(hero.includes('className="hero-person-cutout"'));
  assert.ok(hero.includes('src={heroPersonImage}'));
  assert.ok(studio.includes("import {heroPersonImage} from '../lib/hero-person-image.mjs'"));
  assert.ok(!hero.includes('<BrandShowcase/>'),'Old illustrated mockup must be removed from hero');
  assert.ok(!hero.includes('<BrandShowcase compact/>'),'Old secondary mockup must be removed from hero');
  for(const route of ['/jasa/landing-page/','/jasa/company-profile/','/jasa/ecommerce/','/jasa/custom-website/','/jasa/maintenance/']){
    assert.ok(hero.includes('href="'+route+'"'),route+' must be clickable');
  }
  for(const label of ['Landing Page','Company Profile','Toko Online','Custom Web App','Website Maintenance']){
    assert.ok(hero.includes(label),'Service should be prominently listed: '+label);
  }
  assert.ok(!/500\+|10M\+|klien puas/i.test(hero),'Unverified performance figures should not be shown');
});

test('native WebP data image is valid and compact',()=>{
  const sourceModule=source('static-source/lib/hero-person-image.mjs');
  const match=sourceModule.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(match,'Data URI must embed WebP content');
  const bytes=Buffer.from(match[1],'base64');
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'Image must not be truncated');
  assert.ok(bytes.length<20000,'Keep the image lightweight');
});

test('hero cutout remains visible and does not intercept click events',()=>{
  const css=source('static-source/styles.css');
  assert.ok(css.includes('.hero-showcase .hero-person-cutout{'));
  assert.ok(css.includes('pointer-events:none'));
  assert.match(css,/@media\(max-width:650px\)[\s\S]*?\.hero-showcase \.hero-person-cutout/);
});