import assert from 'node:assert/strict';
import {serviceAreaGroups} from '../static-source/lib/service-areas.mjs';
import {cityLandingPages} from '../static-source/lib/city-pages.mjs';
import {cityEditorial} from '../static-source/lib/locality-editorial.mjs';
import {provinceEditorial,provinceSources} from '../static-source/lib/geo-editorial.mjs';
import {provincePages,localityPages,indexableLocalityNames} from '../static-source/lib/geo-pages.mjs';

const provinces=serviceAreaGroups.flatMap(region=>region.provinces);
const cities=provinces.flatMap(province=>province.places);
const priority=new Set(cityLandingPages.map(x=>x.city));
assert.equal(provinces.length,38);
assert.equal(cities.length,189);
assert.equal(Object.keys(provinceEditorial).length,38,'Every province needs a hand-written business context');
assert.equal(Object.keys(cityEditorial).length,189,'Every covered city needs an original project scenario');
assert.equal(provincePages.length,38);
assert.equal(localityPages.length,174);
assert.equal(new Set(cities).size,cities.length,'City names must be unique across covered provinces');

for(const province of provinces){
 const editorial=provinceEditorial[province.name];
 assert.ok(editorial,'Missing provincial editorial content: '+province.name);
 for(const key of ['focus','context','journey','decision'])assert.ok(editorial[key]?.length>25,'Missing '+key+' for '+province.name);
 for(const city of province.places){
  const brief=cityEditorial[city];
  assert.ok(brief,'Missing hand-authored city brief: '+city);
  assert.ok(brief.scenario.length>=80,'City scenario too short: '+city);
  assert.ok(brief.assets.length>=3,'City brief missing practical assets: '+city);
 }
}
const scenarios=Object.values(cityEditorial).map(x=>x.scenario);
assert.equal(new Set(scenarios).size,189,'City stories must not repeat');
for(const page of localityPages){
 assert.ok(!priority.has(page.city));
 assert.equal(page.editorial.scenario,cityEditorial[page.city].scenario);
 assert.ok(page.provinceEditorial.context===provinceEditorial[page.province].context);
 assert.equal(page.topic.name,[
 'company profile','toko online','website wisata','katalog B2B','landing page','website kursus','website portofolio','website kuliner','website kontraktor','website organisasi'
 ][page.editorial.topicIndex]);
 assert.ok(Number.isInteger(page.layoutVariant)&&page.layoutVariant>=0&&page.layoutVariant<=3);
 if(page.indexReady){
  assert.ok(indexableLocalityNames.has(page.city));
  assert.ok(page.source?.startsWith('https://')&&page.source.includes('.bps.go.id/'),'Indexable locations require a verified regional statistical publication');
 }
}
assert.equal(localityPages.filter(p=>p.indexReady).length,14);
for(const [province,url] of Object.entries(provinceSources)){
 assert.ok(provinceEditorial[province]&&url.startsWith('https://')&&url.includes('.bps.go.id/'));
}
console.log('Regional editorial verified: 38 provinces, 189 distinct city scenarios, 14 indexed locality guides.');
