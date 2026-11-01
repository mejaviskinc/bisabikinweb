import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

for (const kind of ['media','shop']) {
  test('build '+kind+' isolates public pages and inserts noindex',async()=>{
    const dir=await mkdtemp(join(tmpdir(),'bbweb-'+kind+'-'));
    const source=join(dir,'site-dist'),out=join(dir,'dist');
    try{
      for(const path of ['assets','brand','artikel','berita','redaksi','merch','cart','checkout','track-order','account','admin','seller','auto-artikel','portfolio']){
        await mkdir(join(source,path),{recursive:true});
        await writeFile(join(source,path,'index.html'),'<html><head><meta name="robots" content="index,follow"></head><body>'+path+'</body></html>');
      }
      await writeFile(join(source,'index.html'),'<html><head></head><body>home</body></html>');
      await writeFile(join(source,'assets/client.js'),'test');
      await writeFile(join(source,'CNAME'),'bisabikinweb.site');
      await writeFile(join(source,'sitemap.xml'),'<urlset/>');
      execFileSync(process.execPath,['scripts/build-subdomain.mjs',kind],{
        cwd:process.cwd(),env:{...process.env,BBWEB_SITE_DIST:source,BBWEB_OUTPUT_DIST:out},stdio:'pipe'
      });
      const entries=await readdir(out);
      for(const forbidden of ['admin','seller','auto-artikel','portfolio','CNAME','sitemap.xml'])assert.ok(!entries.includes(forbidden),forbidden);
      for(const needed of ['index.html','_headers','_redirects','assets','subdomain-navigation.js'])assert.ok(entries.includes(needed),needed);
      assert.match(await readFile(join(out,'robots.txt'),'utf8'),/Disallow: \//);
      assert.match(await readFile(join(out,'index.html'),'utf8'),/noindex,nofollow/);
      if(kind==='media'){
        const home=await readFile(join(out,'index.html'),'utf8');
        assert.match(home,/http-equiv="refresh" content="0;url=\/artikel\/"/);
        assert.match(home,/location\.replace\('\/artikel\/'\)/);
        assert.doesNotMatch(home,/Ideas worth|THE COLLECTION/i);
        for(const needed of ['artikel','berita','redaksi'])assert.ok(entries.includes(needed));
        for(const forbidden of ['merch','cart','checkout','track-order','account','_spa.html'])assert.ok(!entries.includes(forbidden));
        const html=await readFile(join(out,'artikel/index.html'),'utf8');
        assert.doesNotMatch(html,/content="index,follow"/);
        assert.match(html,/subdomain-navigation.js/);
      }else{
        for(const needed of ['merch','cart','checkout','track-order','account','_spa.html'])assert.ok(entries.includes(needed));
        for(const forbidden of ['artikel','berita','redaksi'])assert.ok(!entries.includes(forbidden));
        assert.match(await readFile(join(out,'_redirects'),'utf8'),/\/toko\/\*/);
      }
    }finally{await rm(dir,{recursive:true,force:true});}
  });
}

test('shop navigation retains storefront paths and previews remain noindex',async()=>{
  const nav=await readFile('subdomains/navigation.js','utf8');
  const storefront=await readFile('static-source/features/Storefront.tsx','utf8');
  assert.match(nav,/shop\.bisabikinweb\.site[^\n]*\/toko/);
  assert.match(storefront,/window\.location\.hostname==='shop\.bisabikinweb\.site'\?'noindex,nofollow'/);
});
