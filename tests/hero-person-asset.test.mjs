import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('homepage right hero uses one accessible dummy workspace photo',()=>{
  const studio=source('static-source/features/Studio.tsx');
  const hero=studio.slice(studio.indexOf('function AnimatedHeroShowcase()'),studio.indexOf('function Home({data',studio.indexOf('function AnimatedHeroShowcase()')));
  assert.ok(hero.includes('className="hero-showcase hero-dummy-photo"'));
  assert.ok(hero.includes('className="hero-dummy-photo-image"'));
  assert.ok(hero.includes('images.unsplash.com/photo-1498050108023-c5249f4df085'));
  assert.ok(hero.includes('alt="Foto ilustrasi laptop dan area kerja pengembangan website"'));
  assert.ok(!hero.includes('hero-person-cutout'),'Previous portrait must be removed');
  assert.ok(!hero.includes('showcase-orbit'),'Previous decorative orbit must be removed');
  assert.ok(!hero.includes('hero-service-card'),'Previous floating service cards must be removed');
  assert.ok(!hero.includes('<BrandShowcase'),'Previous layered mockup must be removed');
  assert.ok(!/500\\+|10M\\+|klien puas/i.test(hero),'Unverified performance figures should not be shown');
});

test('hero placeholder leaves main sales carousel and its CTA intact',()=>{
  const studio=source('static-source/features/Studio.tsx');
  assert.ok(studio.includes('className="bbw-hero-slides"'));
  assert.ok(studio.includes('Bikin Website Sekarang'));
  assert.ok(studio.includes('Lihat Portfolio'));
});

test('single-photo hero has mobile styling and does not block interaction',()=>{
  const css=source('static-source/styles.css');
  assert.ok(css.includes('.hero-showcase.hero-dummy-photo{'));
  assert.ok(css.includes('object-fit:cover'));
  assert.ok(css.includes('pointer-events:none'));
  const smallScreenStyles=css.slice(css.lastIndexOf('@media(max-width:650px)'));
  assert.ok(smallScreenStyles.includes('.hero-showcase.hero-dummy-photo{'),'Mobile breakpoint must style the photo');
});
