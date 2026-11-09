import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='industry-preview-report';
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
try{
 for(const device of [
  {name:'desktop',viewport:{width:1440,height:900},isMobile:false},
  {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}
 ]){
  const context=await browser.newContext({...device,deviceScaleFactor:1,colorScheme:'dark',reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  const response=await page.goto('http://127.0.0.1:4173/beli-website/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,device.name+' site HTTP status');
  await page.locator('[data-industry-preview]').first().waitFor({state:'visible'});
  const allCategories=await page.locator('[data-industry-preview]').evaluateAll(els=>[...new Set(els.map(e=>e.getAttribute('data-industry-preview')))].sort());
  assert.equal(allCategories.length,8,'All 8 industry structures must be available');
  const company=page.getByRole('button',{name:/Company Profile/i}).first();
  await company.click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.ws-template .ws-type-badge')].every(x=>x.textContent?.includes('COMPANY PROFILE')));
  assert.ok(await page.locator('.ws-template').count()>=7,'Company profile templates should be present');
  assert.ok(await page.locator('.ws-ip-corp-services').count()>=7,'Every corporate template should show corporate service anatomy');
  assert.equal(await page.locator('.ws-ip-products').count(),0,'Company profile must not show ecommerce product grids');
  const companyCard=page.locator('.ws-template').first();
  await companyCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const companyImage=await companyCard.screenshot({path:root+'/company-profile-'+device.name+'.png',animations:'disabled'});
  const ecommerce=page.getByRole('button',{name:/E-Commerce/i}).first();
  await ecommerce.click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.ws-template .ws-type-badge')].every(x=>x.textContent?.includes('E-COMMERCE')));
  assert.ok(await page.locator('.ws-template').count()>=7,'E-commerce templates should be present');
  assert.ok(await page.locator('.ws-ip-products').count()>=7,'Every e-commerce template needs product cards with example prices');
  assert.equal(await page.locator('.ws-ip-corp-services').count(),0,'E-commerce must not show corporate service grids');
  const ecommerceCard=page.locator('.ws-template').first();
  await ecommerceCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const ecommerceImage=await ecommerceCard.screenshot({path:root+'/ecommerce-'+device.name+'.png',animations:'disabled'});
  assert.equal(companyImage.equals(ecommerceImage),false,'Two industry screenshots must be different');
  await page.getByRole('button',{name:/Semua Desain/i}).first().click();
  await page.waitForFunction(()=>document.querySelectorAll('.ws-template').length===60);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=3,device.name+' horizontal overflow: '+overflow);
  await page.screenshot({path:root+'/all-catalog-'+device.name+'.png',animations:'disabled',fullPage:false});
  assert.deepEqual(errors,[],'Unexpected browser runtime errors');
  report.push({device:device.name,categoryCount:allCategories.length,companyCard:true,ecommerceCard:true,screenshotsDifferent:true,overflowPx:overflow,runtimeErrors:errors});
  await context.close();
 }
} finally{
 await browser.close();
 await writeFile(root+'/results.json',JSON.stringify(report,null,2));
}
console.log('Website Industry Visual QA PASSED:',JSON.stringify(report));
