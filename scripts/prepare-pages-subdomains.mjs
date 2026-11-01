import {cp,readFile,writeFile,mkdir,rm,readdir,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const root=process.cwd();
for (const [kind,host] of Object.entries({
  app:'app.bisabikinweb.site',
  media:'media.bisabikinweb.site',
  shop:'shop.bisabikinweb.site'
})){
  const source=resolve(root,kind+'-dist');
  const target=resolve(root,'pages-'+kind);
  await access(join(source,'index.html'));
  await rm(target,{recursive:true,force:true});
  await mkdir(target,{recursive:true});
  await cp(source,target,{recursive:true,force:true});
  // GitHub Pages is not Netlify: headers and redirect syntax do not work there.
  for(const netlifyOnly of ['_headers','_redirects']){
    await rm(join(target,netlifyOnly),{force:true});
  }
  await writeFile(join(target,'CNAME'),host+'\n');
  await writeFile(join(target,'.nojekyll'),'');
  // GitHub Pages uses 404.html for unmatched dynamic /toko/:slug routes.
  // Static path still returns 404 HTTP; must move to prerendered slugs for SEO later.
  if(kind==='shop'){
    let html=await readFile(join(target,'_spa.html'),'utf8');
    html=html.replace(/<meta\s+name="robots"[^>]*>/gi,'');
    html=html.replace(/<head([^>]*)>/i,'<head$1><meta name="robots" content="noindex,nofollow">');
    html=html.replace(/<\/body>/i,'<script src="/subdomain-navigation.js" defer></script></body>');
    await writeFile(join(target,'404.html'),html);
    await rm(join(target,'_spa.html'));
  }
  for(const section of ['admin','seller','auto-artikel']){
    if((await readdir(target)).includes(section))throw new Error(kind+' contains private page '+section);
  }
  console.log('GitHub Pages bundle pages-'+kind+' -> '+host);
}
