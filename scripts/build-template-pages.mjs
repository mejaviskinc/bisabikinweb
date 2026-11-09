/**
 * Generate 60 deployable, standalone GitHub Pages sites from the already-built
 * single source of truth. Does not create repositories or mutate DNS.
 *
 * Run BBWEB_OFFLINE_BUILD=1 npm run build first.
 * Output: template-pages-dist/template1..template60/, each with its own CNAME.
 */
import {access,cp,readFile,writeFile,mkdir,rm,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';

const root=process.cwd();
const source=resolve(root,process.env.BBWEB_SITE_DIST||'site-dist');
const output=resolve(root,process.env.BBWEB_TEMPLATE_DIST||'template-pages-dist');
if(source===output||output===root||source===root)throw new Error('Unsafe output path');
const demoBySlug=new Map(websiteDemos.map(d=>[d.slug,d]));
if(templateSlugOrder.length!==60||new Set(templateSlugOrder).size!==60)throw new Error('Expected 60 unique template slugs');
await access(join(source,'assets'));
await rm(output,{force:true,recursive:true});
await mkdir(output,{recursive:true});
const shared=['assets','brand','favicon.ico','favicon.svg','apple-touch-icon.png','og.svg'];
const report=[];
for(let number=1;number<=60;number++){
 const slug=templateSlugOrder[number-1];
 const demo=demoBySlug.get(slug);
 if(!demo)throw new Error('Missing demo '+slug);
 const dest=join(output,'template'+number);
 await mkdir(dest,{recursive:true});
 const html=await readFile(join(source,'demo',slug,'index.html'),'utf8');
 if(!html.includes('DEMO INTERAKTIF')||!html.includes('noindex,nofollow')){
  throw new Error('SSR or noindex missing: '+slug);
 }
 await writeFile(join(dest,'index.html'),html);
 // A logo opened in a new tab still points at /demo/{slug}/; preserve that URL.
 const compat=join(dest,'demo',slug);
 await mkdir(compat,{recursive:true});
 await writeFile(join(compat,'index.html'),html);
 for(const path of shared){
  const from=join(source,path);
  try{await access(from)}catch{if(path==='assets')throw new Error('Vite assets missing');continue}
  await cp(from,join(dest,path),{recursive:true});
 }
 const hostname='template'+number+'.bisabikinweb.site';
 await writeFile(join(dest,'CNAME'),hostname+'\n');
 await writeFile(join(dest,'.nojekyll'),'');
 // Fictional showcase domains must not compete with the indexed main catalog.
 await writeFile(join(dest,'robots.txt'),'User-agent: *\nDisallow: /\n');
 report.push({number,hostname,slug,title:demo.title,category:demo.category});
 console.log('PACKAGED',number,hostname,slug);
}
await writeFile(join(output,'manifest.json'),JSON.stringify({schema:1,templateCount:report.length,source:'single BisaBikinWeb site build',sites:report},null,2));
console.log('Exported '+report.length+' standalone GitHub Pages packages to '+output);
