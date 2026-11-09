import {test,expect} from '@playwright/test';

test('@integrity payment heading and provider labels remain visible',async ({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#bbw-doku-methods')).toBeVisible();
  await expect(page.locator('#bbw-doku-title')).toHaveText('Metode Pembayaran');
  const methods=page.locator('#bbw-doku-methods .bbw-payment-tile');
  expect(await methods.count()).toBeGreaterThan(5);
  await expect(page.locator('#bbw-doku-methods .bbw-payment-tile[aria-label="BCA"]')).toBeVisible();
  await expect(page.locator('#bbw-doku-methods .bbw-payment-tile[aria-label="QRIS"]')).toBeVisible();
});

test('@integrity ecommerce preview has an interactive desktop/mobile switch',async ({page})=>{
  await page.goto('/jasa/ecommerce/',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:/Bangun toko online yang/i})).toBeVisible();
  const desktop=page.getByRole('button',{name:'Desktop',exact:true}).first();
  const mobile=page.getByRole('button',{name:'Mobile',exact:true}).first();
  await expect(desktop).toHaveAttribute('aria-pressed','true');
  await mobile.click();
  await expect(mobile).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.ec-mejavi-mobile-shot')).toBeVisible();
  await desktop.click();
  await expect(desktop).toHaveAttribute('aria-pressed','true');
});

test('@integrity content does not overflow the viewport horizontally',async ({page},testInfo)=>{
  const routes=['/','/jasa/ecommerce/','/portfolio/','/beli-website/'];
  for(const path of routes) {
    await page.goto(path,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(150);
    const excess=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(excess, testInfo.project.name+' '+path+' horizontal overflow').toBeLessThanOrEqual(3);
  }
});
