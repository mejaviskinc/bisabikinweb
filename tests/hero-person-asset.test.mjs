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

test('homepage has one stable sales headline, working purchase and WhatsApp paths, and five supporting slides',()=>{
  const studio=source('static-source/features/Studio.tsx');
  const home=studio.slice(studio.indexOf('function Home({data'),studio.indexOf('\nfunction ',studio.indexOf('function Home({data')+10));
  const css=source('static-source/features/homepage-conversion.css');
  assert.ok(home.includes('className="bbw-hero-primary-title"'),'Headline should be fixed, not rotate');
  assert.ok(!home.includes('className="bbw-hero-slides"'),'Rotating large hero headings should not distract buyers');
  assert.ok(home.includes('Lihat Paket & Pesan'));
  assert.ok(home.includes('Konsultasi via WhatsApp'));
  assert.ok(home.includes('href="/beli-website/"'));
  assert.ok(home.includes('href="/portfolio/"'));
  assert.ok(home.includes('heroSlides.map((panel,index)=>'),'Five supporting carousel dots must remain');
  assert.ok(home.includes('id="paket-website"'),'Price comparison should be near the top');
  assert.equal(home.split('<Pricing items={data.pricing}/>').length-1,1,'Homepage must show one pricing section');
  assert.ok(home.includes('<Pricing items={data.pricing}/>'));
  assert.ok(css.includes('.bbw-mobile-close-bar'),'Mobile conversion CTA needs responsive styling');
});

test('single-photo hero has mobile styling and does not block interaction',()=>{
  const css=source('static-source/styles.css');
  assert.ok(css.includes('.hero-showcase.hero-dummy-photo{'));
  assert.ok(css.includes('object-fit:cover'));
  assert.ok(css.includes('pointer-events:none'));
  const smallScreenStyles=css.slice(css.lastIndexOf('@media(max-width:650px)'));
  assert.ok(smallScreenStyles.includes('.hero-showcase.hero-dummy-photo{'),'Mobile breakpoint must style the photo');
});
