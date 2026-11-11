import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {INDUSTRY_DESIGN_SYSTEM,resolveDesignIndustry,buildIndustryBlueprint,blueprintCssVariables,validateIndustryBlueprint} from '../static-source/lib/industry-design-system.mjs';

test('at least 15 real industry blueprints exist with distinct conversion structures',()=>{
 assert.ok(Object.keys(INDUSTRY_DESIGN_SYSTEM).length>=15);
 for(const industry of Object.keys(INDUSTRY_DESIGN_SYSTEM)){
  const blueprint=buildIndustryBlueprint({name:'Brand Contoh',slug:'test-'+industry,industry},{demo:true});
  assert.equal(blueprint.industry,industry);
  assert.deepEqual(validateIndustryBlueprint(blueprint),[]);
  assert.ok(blueprint.navigationFlow.length>=5);
  assert.ok(blueprint.features.length>=3);
  assert.ok(blueprint.hero.photography.length>10);
  assert.match(blueprint.primaryCta,/\S/);
 }
 assert.notDeepEqual(INDUSTRY_DESIGN_SYSTEM.fashion.sections,INDUSTRY_DESIGN_SYSTEM.ekspor.sections);
 assert.notDeepEqual(INDUSTRY_DESIGN_SYSTEM.travel.features,INDUSTRY_DESIGN_SYSTEM.technology.features);
});
test('explicit industries and recognized subindustries override broad categories',()=>{
 assert.equal(resolveDesignIndustry({category:'toko-online',industry:'skincare'}),'skincare');
 assert.equal(resolveDesignIndustry({category:'toko-online',slug:'botanika-care'}),'skincare');
 assert.equal(resolveDesignIndustry({category:'company-profile',slug:'karsa-architecture'}),'construction');
 assert.equal(resolveDesignIndustry({category:'ekspor'}),'ekspor');
 assert.equal(resolveDesignIndustry({category:'unknown'}),'umkm');
});
test('all 60 public demos get deterministic, valid and brand-preserving plans',()=>{
 assert.equal(websiteDemos.length,60);
 const compositions=new Set();
 const brands=new Set();
 for(const d of websiteDemos){
  const blueprint=buildIndustryBlueprint(d,{demo:true});
  assert.deepEqual(validateIndustryBlueprint(blueprint),[],d.slug);
  assert.equal(blueprint.name,d.title);
  assert.equal(blueprint.mode,'demo');
  assert.equal(blueprint.features.every(x=>x.status==='demo-or-specification'),true);
  for(const token of ['ink','accent','paper','deep'])assert.equal(blueprint.palette[token],d.palette[token],d.slug);
  assert.deepEqual(blueprintCssVariables(blueprint),blueprint.tokens);
  assert.deepEqual(blueprint,buildIndustryBlueprint(d,{demo:true}),d.slug);
  compositions.add(blueprint.hero.composition);
  brands.add(blueprint.slug);
 }
 assert.ok(compositions.size>=6,'Hero compositions must vary between the 60 sites');
 assert.equal(brands.size,60);
});
test('industrial and healthcare safety: no unverifiable business claims',()=>{
 assert.match(INDUSTRY_DESIGN_SYSTEM.ekspor.features.join(' '),/RFQ/);
 assert.match(INDUSTRY_DESIGN_SYSTEM.healthcare.photography,/jangan mengarang/i);
 const demo=buildIndustryBlueprint({title:'Klinik Contoh',industry:'healthcare'},{demo:true});
 assert.match(demo.safetyRules.join(' '),/No fabricated certifications/);
 assert.match(demo.safetyRules.join(' '),/Demo interactions must be labeled/);
 assert.throws(()=>buildIndustryBlueprint({}),/name\/title/);
});
test('blueprints actually power both full demos and catalog preview',()=>{
 const full=readFileSync(new URL('../static-source/features/WebsiteLiveDemo.tsx',import.meta.url),'utf8');
 const catalog=readFileSync(new URL('../static-source/features/WebsiteStore.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../static-source/features/industry-blueprint.css',import.meta.url),'utf8');
 for(const source of [full,catalog]){
  assert.match(source,/buildIndustryBlueprint\(d,\{demo:true\}\)/);
  assert.match(source,/blueprintCssVariables\(blueprint\)/);
  assert.match(source,/data-design-industry=\{blueprint.industry\}/);
 }
 assert.match(full,/wd-industry-essentials/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/data-hero-composition/);
});
