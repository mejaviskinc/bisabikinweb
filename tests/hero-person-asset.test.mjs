import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('homepage hero contains the WebP cutout alongside existing mockups',()=>{
  const studio=source('static-source/features/Studio.tsx');
  assert.ok(studio.includes('<BrandShowcase/>'));
  assert.ok(studio.includes('<BrandShowcase compact/>'));
  assert.ok(studio.includes('className="hero-person-cutout"'));
  assert.ok(studio.includes('src={heroPersonImage}'));
  assert.ok(studio.includes("import {heroPersonImage} from '../lib/hero-person-image.mjs'"));
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