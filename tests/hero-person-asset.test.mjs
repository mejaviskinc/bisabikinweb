import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('homepage hero contains the photo alongside both existing brand mockups',()=>{
  const studio=source('static-source/features/Studio.tsx');
  assert.match(studio,/<BrandShowcase\/>/);
  assert.match(studio,/<BrandShowcase compact\/>/);
  assert.match(studio,/className="hero-person-cutout"/);
  assert.match(studio,/src="\/images\/bisabikinweb-hero-person\.svg"/);
});

test('hero photo asset is a complete lightweight WebP with transparent layout',()=>{
  const svg=source('public-assets/images/bisabikinweb-hero-person.svg');
  const match=svg.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(match,'Embedded WebP must be present');
  const bytes=Buffer.from(match[1],'base64');
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'WebP must not be truncated');
  assert.ok(bytes.length<20000,'Optimized visual should stay below 20 KB');
  assert.match(svg,/width="240" height="315"/);
});

test('photo stays in the showcase on mobile and does not intercept clicks',()=>{
  const css=source('static-source/styles.css');
  assert.match(css,/\.hero-showcase \.hero-person-cutout\{/);
  assert.match(css,/pointer-events:none/);
  assert.match(css,/@media\(max-width:650px\)[\s\S]*?\.hero-showcase \.hero-person-cutout/);
});
