import {test, expect} from '@playwright/test';

// Separate live production captures are not modified by this deterministic test suite.
const criticalRoutes=[
 {id:'home',path:'/'},
 {id:'ecommerce',path:'/jasa/ecommerce/'},
 {id:'portfolio',path:'/portfolio/'},
 {id:'website-store',path:'/beli-website/'}
];
const protectedComponents=[
 {id:'ecommerce-mejavi-media',path:'/jasa/ecommerce/',selector:'.ec-mejavi-shot-link'},
 {id:'payment-methods',path:'/',selector:'#bbw-doku-methods'}
];
const stabilizationCSS=[
 '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important}',
 'video,canvas{visibility:hidden!important}',
 'iframe{visibility:hidden!important}',
 '.announcement-track{transform:none!important}'
].join('\n');

async function prepare(page,path){
 // Use main-branch HTML/assets only. Live Supabase, promotions, fonts and ads
 // can change without any code change and would cause false positive diffs.
 await page.route('**/*',request=>{
   const target=new URL(request.request().url());
   return ['127.0.0.1','localhost'].includes(target.hostname)?request.continue():request.abort();
 });
 const response=await page.goto(path,{waitUntil:'domcontentloaded'});
 expect(response,'Route must respond').not.toBeNull();
 expect(response.status(),'Route should not be a server error').toBeLessThan(400);
 await page.locator('body').waitFor({state:'visible'});
 await page.addStyleTag({content:stabilizationCSS});
 await page.evaluate(async()=>{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])});
 await page.waitForTimeout(400);
 await page.mouse.move(0,0);
}

for(const route of criticalRoutes){
 test('@visual '+route.id+' viewport is unchanged',async({page},testInfo)=>{
  await prepare(page,route.path);
  await expect(page).toHaveScreenshot(route.id+'-'+testInfo.project.name+'.png',{fullPage:false});
 });
}
for(const component of protectedComponents){
 test('@visual '+component.id+' component is unchanged',async({page},testInfo)=>{
  await prepare(page,component.path);
  const target=page.locator(component.selector).first();
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  await expect(target).toHaveScreenshot(component.id+'-'+testInfo.project.name+'.png');
 });
}
