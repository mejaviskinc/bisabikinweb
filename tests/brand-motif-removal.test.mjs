import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const affected=[
  'static-source/features/Studio.tsx',
  'static-source/features/EnglishStudio.tsx',
  'static-source/features/WebsiteLiveDemo.tsx',
  'static-source/features/WebsiteStore.tsx',
  'static-source/features/SeoSolutions.tsx',
  'static-source/components/Visuals.tsx',
  'static-source/lib/data.ts'
];

test('eight-ray asterisk artwork is absent from main site, English pages, SEO and all 60 demos',()=>{
  const asterisks=/[\u2733\u2731\u2734\u274b\u2735\u273a]/u;
  for(const path of affected)assert.doesNotMatch(source(path),asterisks,path);
});
test('removed standalone decoration classes cannot reappear as active markup',()=>{
  const homepage=source('static-source/features/Studio.tsx');
  const demo=source('static-source/features/WebsiteLiveDemo.tsx');
  assert.doesNotMatch(homepage,/className="(?:showcase-star|tiny-spark|contact-star)"/);
  assert.doesNotMatch(demo,/className="wd-symbol"/);
  assert.match(homepage,/brand\/bisabikinweb-logo\.svg/,'Original BisaBikinWeb wordmark must stay intact');
  assert.match(demo,/className="wd-about-mark">\{d\.title\}/);
  assert.match(demo,/className="wd-art-icon"/);
});
test('decorative CSS rules for removed asterisk are not shipped',()=>{
  const css=source('static-source/styles.css');
  const demoCss=source('static-source/features/website-live-demo.css');
  for(const selector of ['.showcase-star{','.tiny-spark{','.contact-star{','.bbw-code-art>i{'])assert.ok(!css.includes(selector),selector);
  assert.ok(!demoCss.includes('.wd-symbol{'));
  assert.match(demoCss,/\.wd-about-mark\{[^}]*text-transform:uppercase/);
});

test('all 60 website previews and live demos are free of concentric ring overlays',()=>{
  const demo=source('static-source/features/WebsiteLiveDemo.tsx');
  const catalog=source('static-source/features/WebsiteStore.tsx');
  const styles=source('static-source/features/website-live-demo.css');
  const industryPreview=source('static-source/components/IndustrySitePreview.tsx');
  const industryCss=source('static-source/components/industry-site-preview.css');
  // The shared renderers cover the whole 60-site catalog: no item-by-item patches.
  assert.match(demo,/function DemoVisual/);
  assert.match(catalog,/function LiveSitePreview/);
  assert.match(demo,/wd-visual/);
  assert.match(catalog,/IndustrySitePreview/);
  assert.match(industryPreview,/ws-ip-corp-services/);
  assert.match(industryPreview,/ws-ip-products/);
  for(const [path,content] of [['Live demo JSX',demo],['Catalog JSX',catalog],['Demo CSS',styles],['Industry preview JSX',industryPreview],['Industry preview CSS',industryCss]]){
    assert.doesNotMatch(content,/wd-visual-halo|wd-visual-note/,path+' must not introduce decorative circles');
  }
  assert.match(styles,/\.wd-visual img\{[^}]*object-fit:cover/);
  assert.match(styles,/\.wd-visual img\{[^}]*filter:none/);
  assert.doesNotMatch(industryCss,/radial-gradient|conic-gradient/,'New industry previews must not bring back circular decorative motifs');
});
