import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile('static-source/main.tsx','utf8');

test('admin, storefront and demo routes stay out of the initial public JavaScript bundle',()=>{
  for(const [name,path] of [
    ['Admin','./features/Admin'],
    ['AdsManager','./features/AdsManager'],
    ['SellerDashboard','./features/SellerDashboard'],
    ['Storefront','./features/Storefront'],
    ['SellerAdmin','./features/SellerAdmin'],
    ['PaymentGatewayAdmin','./features/PaymentGatewayAdmin'],
    ['WebsiteStoreAdmin','./features/WebsiteStoreAdmin'],
    ['DigitalOrdersAdmin','./features/DigitalOrdersAdmin'],
    ['WebsiteLiveDemo','./features/WebsiteLiveDemo']
  ]){
    assert.ok(source.includes(`const ${name}=lazy(()=>import('${path}'))`),name+' must be route-lazy');
    assert.ok(!source.includes(`import ${name} from '${path}'`),name+' must not be eagerly imported');
  }
  assert.match(source,/<Suspense fallback=/,'lazy routes need a loading boundary');
});
