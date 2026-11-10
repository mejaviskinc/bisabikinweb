/**
 * Read-only production QA for all 60 independently hosted GitHub Pages demos.
 * Does not change DNS, GitHub Pages settings, payment, or the primary website.
 * Strict HTTPS certificate validation is intentional.
 */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';

const output='template-live-qa';
const reports=[];
const viewports=[
 {label:'desktop',viewport:{width:1440,height:900},isMobile:false},
 {label:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}
];
const normalize=value=>String(value||'').normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(let number=1;number<=60;number++){
  const slug=templateSlugOrder[number-1];
  const demo=websiteDemos.find(item=>item.slug===slug);
  if(!demo)throw new Error('Demo source missing for '+slug);
  const hostname='template'+number+'.bisabikinweb.site';
  for(const device of viewports){
   const record={number,hostname,slug,expectedBrand:demo.title,device:device.label,url:'https://'+hostname+'/',status:'failed',httpStatus:null,brand:null,overflow:null,error:null};
   const context=await browser.newContext({
    viewport:device.viewport,isMobile:device.isMobile,hasTouch:!!device.hasTouch,
    deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce',
    ignoreHTTPSErrors:false,locale:'id-ID'
   });
   const page=await context.newPage();
   const failedAssets=[];
   page.on('response',response=>{
    if(response.url().startsWith(record.url+'assets/')&&response.status()>=400)
     failedAssets.push(response.status()+' '+response.url());
   });
   try{
    const response=await page.goto(record.url,{waitUntil:'domcontentloaded',timeout:18000});
    record.httpStatus=response?.status()??null;
    if(record.httpStatus!==200)throw new Error('HTTP status '+record.httpStatus);
    const contentType=(response.headers()['content-type']||'').toLowerCase();
    if(!contentType.includes('text/html'))throw new Error('Unexpected content type '+contentType);
    if(new URL(page.url()).hostname!==hostname)throw new Error('Redirected away from demo hostname');
    const logo=page.locator('.wd-header .wd-logo');
    await logo.waitFor({state:'visible',timeout:12000});
    record.brand=(await logo.innerText()).replace(/\s+/g,' ').trim();
    if(!normalize(record.brand).includes(normalize(demo.title)))
     throw new Error('Unexpected brand: '+record.brand+' (expected '+demo.title+')');
    const pageMarkup=await page.content();
    if(!/noindex\s*,\s*nofollow/i.test(pageMarkup))throw new Error('SEO noindex metadata missing');
    await page.screenshot({path:output+'/template'+number+'-'+device.label+'.png',animations:'disabled',fullPage:false});
    const menu=page.locator('.wd-menu');
    if(await menu.isVisible())await menu.click({timeout:8000});
    await page.locator('.wd-nav a').nth(1).click({timeout:12000});
    await page.locator('.wd-inner-heading h1').waitFor({state:'visible',timeout:10000});
    if(!page.url().startsWith(record.url+'?halaman=catalog'))
     throw new Error('Catalog navigation changed demo hostname: '+page.url());
    const purchase=await page.locator('.wd-ribbon-buy').getAttribute('href');
    if(!purchase?.startsWith('https://bisabikinweb.site/pesan-website/'))
     throw new Error('Purchase CTA does not point to primary domain');
    record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    if(record.overflow>3)throw new Error('Horizontal overflow '+record.overflow+'px');
    if(failedAssets.length)throw new Error('Failed same-origin assets: '+failedAssets.slice(0,3).join(', '));
    record.status='passed';
   }catch(error){record.error=String(error?.message||error).slice(0,800)}
   finally{reports.push(record);await context.close()}
  }
  console.log('LIVE-QA '+number+'/60 '+hostname+' '+reports.slice(-2).map(x=>x.device+':'+x.status).join(' '));
 }
}finally{
 await browser.close();
 const passed=reports.filter(r=>r.status==='passed').length;
 const failed=reports.filter(r=>r.status!=='passed').length;
 const summary={checkedAt:new Date().toISOString(),sitesExpected:60,deviceChecksExpected:120,deviceChecksCompleted:reports.length,passed,failed,allReady:passed===120,results:reports};
 await writeFile(output+'/report.json',JSON.stringify(summary,null,2));
 await writeFile(output+'/SUMMARY.md',
  '# BisaBikinWeb 60-site live QA\n\n'+
  'Checked: '+summary.checkedAt+'\n\n'+
  'Strict HTTPS, HTTP 200, brand, noindex, assets, browser navigation, checkout-domain and viewport overflow.\n\n'+
  'Passed: '+passed+'/120 device checks. Failed: '+failed+'/120.\n\n'+
  reports.filter(r=>r.status!=='passed').map(r=>'- '+r.hostname+' ('+r.device+'): '+r.error).join('\n')+'\n');
 console.log('LIVE-QA SUMMARY '+passed+'/120 passed; '+failed+'/120 failed');
 if(passed!==120)process.exitCode=1;
}
