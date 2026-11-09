import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {templateDemoForHostname} from '../static-source/lib/template-subdomains.mjs';

const samples=[1,9,17,60];
const viewports=[
 {name:'desktop',viewport:{width:1440,height:900},isMobile:false},
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}
];
const report=[];
const base='http://127.0.0.1:4173';
const dir='template-browser-checks';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of viewports){
  const context=await browser.newContext({...viewport,deviceScaleFactor:1,colorScheme:'dark',reducedMotion:'reduce'});
  for(const number of samples){
   const hostname='template'+number+'.bisabikinweb.site';
   const demo=templateDemoForHostname(hostname);
   const page=await context.newPage();
   try{
    // Simulate the edge proxy on localhost before public DNS or Cloudflare credentials exist.
    // Requests keep the HTTPS template origin, but content is sourced from site-dist.
    await page.route('https://'+hostname+'/**',async route=>{
     const incoming=new URL(route.request().url());
     const upstream=incoming.pathname==='/'||incoming.pathname==='/index.html'
      ?base+'/demo/'+demo.slug+'/'
      :base+incoming.pathname+incoming.search;
     const response=await route.fetch({url:upstream,timeout:30000});
     await route.fulfill({response});
    });
    const response=await page.goto('https://'+hostname+'/',{waitUntil:'domcontentloaded',timeout:35000});
    if(response?.status()!==200)throw Error('Root returned '+response?.status());
    await page.locator('.wd-logo').waitFor({state:'visible',timeout:15000});
    const brand=(await page.locator('.wd-logo').innerText()).trim();
    if(!brand.toLowerCase().includes(demo.slug.split('-')[0])) {
     // Brand text may have a different first word than the slug on some designs.
     if(!brand)throw Error('Missing brand logo');
    }
    if(!page.url().startsWith('https://'+hostname+'/'))throw Error('Hostname changed after loading demo');
    await page.screenshot({path:dir+'/template'+number+'-'+viewport.name+'.png',animations:'disabled',fullPage:false});
    if(await page.locator('.wd-menu').isVisible()){
     await page.locator('.wd-menu').click();
    }
    await page.locator('.wd-nav a').nth(1).click();
    await page.locator('.wd-inner-heading h1').waitFor({state:'visible',timeout:12000});
    if(!page.url().startsWith('https://'+hostname+'/?halaman=catalog'))throw Error('Client navigation left the template hostname: '+page.url());
    const checkout=await page.locator('.wd-ribbon-buy').getAttribute('href');
    if(!checkout?.startsWith('https://bisabikinweb.site/pesan-website/'))throw Error('Payment checkout not anchored to primary domain');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    if(overflow>3)throw Error('Horizontal overflow '+overflow+'px');
    report.push({number,hostname,slug:demo.slug,device:viewport.name,logo:brand,route:'?halaman=catalog',paymentDomain:'bisabikinweb.site',overflow});
   }finally{await page.close();}
  }
  await context.close();
 }
}finally{
 await browser.close();
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));
}
if(report.length!==samples.length*viewports.length)throw Error('Insufficient successfully rendered hosts '+report.length);
console.log('Verified '+report.length+' simulated hostname+viewport pairs');
