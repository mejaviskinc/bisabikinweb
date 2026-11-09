import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const origin='https://bisabikinweb.site';
const output='ui-live-captures';
const routes=[['home','/'],['ecommerce','/jasa/ecommerce/'],['portfolio','/portfolio/'],['website-store','/beli-website/']];
const devices=[
  {id:'desktop',viewport:{width:1440,height:900},deviceScaleFactor:1,isMobile:false},
  {id:'mobile',viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}
];
await mkdir(output,{recursive:true});
const results=[];
const browser=await chromium.launch({headless:true});
for(const device of devices) {
  const context=await browser.newContext({...device,colorScheme:'dark',reducedMotion:'reduce',locale:'id-ID'});
  for(const [name,path] of routes) {
    const page=await context.newPage();
    const url=new URL(path,origin).toString();
    try {
      const response=await page.goto(url,{timeout:25000,waitUntil:'domcontentloaded'});
      if(!response || response.status()>=400) throw new Error('HTTP '+(response?.status()??'no response'));
      await page.waitForTimeout(500);
      await page.screenshot({path:join(output,name+'-'+device.id+'.png'),fullPage:false,animations:'disabled',timeout:15000});
      results.push({url,device:device.id,status:'captured',http:response.status()});
    }catch(error) {
      results.push({url,device:device.id,status:'failed',error:String(error.message||error)});
    }finally{await page.close();}
  }
  await context.close();
}
await browser.close();
await writeFile(join(output,'capture-report.json'),JSON.stringify({capturedAt:new Date().toISOString(),results},null,2));
if(results.some(x=>x.status==='failed')) {
  console.error('Live screenshot capture incomplete: see capture-report.json');
  process.exitCode=1;
}
