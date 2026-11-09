import {test, expect} from '@playwright/test';

// A viewport snapshot intentionally avoids dynamic below-the-fold news feeds.
// Only the source-rendered UI is compared; the live domain is captured separately.
const criticalRoutes = [
  {id:'home',path:'/'},
  {id:'ecommerce',path:'/jasa/ecommerce/'},
  {id:'portfolio',path:'/portfolio/'},
  {id:'website-store',path:'/beli-website/'}
];

const stabilizationCSS = [
  '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important}',
  'video,canvas{visibility:hidden!important}',
  'iframe{visibility:hidden!important}',
  '.announcement-track{transform:none!important}'
].join('\n');

for(const route of criticalRoutes) {
  test('@visual '+route.id+' viewport is unchanged', async ({page}, testInfo) => {
    // Avoid non-deterministic Supabase content, rotating promotions and third-party assets.
    // The actual public site is captured separately without blocking external requests.
    await page.route('**/*',request=>{
      const target=new URL(request.request().url());
      const local=['127.0.0.1','localhost'].includes(target.hostname);
      return local ? request.continue() : request.abort();
    });
    const response=await page.goto(route.path,{waitUntil:'domcontentloaded'});
    expect(response,'Route must respond').not.toBeNull();
    expect(response.status(),'Route should not be a server error').toBeLessThan(400);
    await page.locator('body').waitFor({state:'visible'});
    await page.addStyleTag({content:stabilizationCSS});
    // Wait for webfonts and React hydration without relying on live third-party API calls.
    await page.evaluate(async ()=>{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])});
    await page.waitForTimeout(300);
    await page.mouse.move(0,0);
    await expect(page).toHaveScreenshot(route.id+'-'+testInfo.project.name+'.png',{fullPage:false});
  });
}
