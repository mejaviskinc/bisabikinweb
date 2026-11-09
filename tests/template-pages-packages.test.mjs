import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';

const root=resolve(process.env.BBWEB_TEMPLATE_DIST||'template-pages-dist');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
assert.equal(manifest.templateCount,60);
assert.equal(manifest.sites.length,60);
assert.deepEqual(manifest.sites.map(x=>x.slug),templateSlugOrder);
for(let number=1;number<=60;number++){
 const slug=templateSlugOrder[number-1],hostname='template'+number+'.bisabikinweb.site';
 const dir=join(root,'template'+number);
 assert.equal((await readFile(join(dir,'CNAME'),'utf8')).trim(),hostname,'Incorrect Pages custom domain: '+hostname);
 await access(join(dir,'.nojekyll'));
 const robots=await readFile(join(dir,'robots.txt'),'utf8');
 assert.match(robots,/Disallow:\s*\//);
 const html=await readFile(join(dir,'index.html'),'utf8');
 assert.match(html,/DEMO INTERAKTIF/);
 assert.match(html,/name="robots" content="noindex,nofollow"/);
 const brand=websiteDemos[number-1].title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 assert.ok(html.includes(brand),hostname+' must not show another demo brand');
 assert.equal(await readFile(join(dir,'demo',slug,'index.html'),'utf8'),html);
 const assetLinks=[...html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map(m=>m[1]);
 assert.ok(assetLinks.length>=1,'Vite asset links missing in '+hostname);
 for(const asset of assetLinks)await access(join(dir,'assets',asset));
 const names=await readdir(dir);
 for(const forbidden of ['admin','seller','auto-artikel','sitemap.xml','news-sitemap.xml']){
  assert.ok(!names.includes(forbidden),hostname+' accidentally includes '+forbidden);
 }
}
console.log('Verified 60 unique standalone GitHub Pages bundles with CNAME, assets, SSR and noindex.');
