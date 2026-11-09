import test from 'node:test';
import assert from 'node:assert/strict';
import {createDigiflazzGateway} from '../services/digiflazz-egress/server.mjs';

const config={BBWEB_EGRESS_SHARED_SECRET:'123456789012345678901234567890123456',DIGIFLAZZ_USERNAME:'buyer',DIGIFLAZZ_API_KEY:'fake-test-only'};
async function server(env,impl,fn){
 const srv=createDigiflazzGateway({env,fetchImpl:impl,logger:{error(){}}});
 await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
 try{await fn('http://127.0.0.1:'+srv.address().port)}
 finally{await new Promise(resolve=>srv.close(resolve))}
}
test('fail closed when secrets are unset',async()=>{
 await server({},()=>{throw Error('network should not be called')},async url=>{
  assert.equal((await fetch(url+'/health')).status,503);
  assert.equal((await fetch(url+'/api/price-list',{method:'POST'})).status,503);
 });
});
test('deny unauthenticated requests and transaction commands',async()=>{
 let count=0;
 await server(config,()=>{count++;return new Response('{}')},async url=>{
  const headers={'content-type':'application/json'};
  assert.equal((await fetch(url+'/api/price-list',{method:'POST',headers,body:'{"cmd":"prepaid"}'})).status,401);
  headers['x-bbweb-egress-token']=config.BBWEB_EGRESS_SHARED_SECRET;
  assert.equal((await fetch(url+'/api/price-list',{method:'POST',headers,body:'{"cmd":"transaction"}'})).status,400);
  assert.equal((await fetch(url+'/api/price-list',{method:'POST',headers,body:'{"cmd":"prepaid","url":"http://evil"}'})).status,400);
  assert.equal((await fetch(url+'/v1/transaction',{method:'POST',headers,body:'{"cmd":"prepaid"}'})).status,404);
  assert.equal(count,0);
 });
});
test('send signed payload only to fixed Digiflazz price-list endpoint',async()=>{
 let call;
 await server(config,async(url,opts)=>{call={url,...opts};return new Response('{"data":[{"buyer_sku_code":"XYZ"}]}')},async url=>{
  const res=await fetch(url+'/api/price-list',{method:'POST',headers:{'content-type':'application/json','x-bbweb-egress-token':config.BBWEB_EGRESS_SHARED_SECRET},body:'{"cmd":"prepaid"}'});
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).data,[{buyer_sku_code:'XYZ'}]);
  assert.equal(call.url,'https://api.digiflazz.com/v1/price-list');
  assert.equal(call.method,'POST');
  assert.deepEqual(Object.keys(JSON.parse(call.body)).sort(),['cmd','sign','username']);
  assert.match(JSON.parse(call.body).sign,/^[0-9a-f]{32}$/);
 });
});
