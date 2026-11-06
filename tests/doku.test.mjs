import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createHmac,createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const env={DOKU_CLIENT_ID:'merchant-test',DOKU_SECRET_KEY:'secret-test',DOKU_ENV:'sandbox'};
const context=vm.createContext({crypto:webcrypto,TextEncoder,btoa,URL,Headers,Date,AbortSignal,Deno:{env:{get:key=>env[key]}},fetch:async()=>{throw Error('Unexpected network call')}});
let source=stripTypeScriptTypes(readFileSync('supabase/functions/_shared/doku.ts','utf8')).replaceAll('export ','');
vm.runInContext(source+'\nglobalThis.api={signature,verifyNotification,dokuStatus,validateResult,applyDokuResult,safePaymentUrl,dokuRequest,refreshDoku};',context);
const api=context.api;
test('DOKU POST and GET signatures match independently computed HMAC and raw-body digest',async()=>{
 const body='{"order":{"amount":10000}}',time='2026-11-06T08:00:00Z',target='/checkout/v1/payment';
 const canonical=['Client-Id:merchant-test','Request-Id:req-1','Request-Timestamp:'+time,'Request-Target:'+target,'Digest:'+createHash('sha256').update(body).digest('base64')].join('\n');
 assert.equal(await api.signature('secret-test','merchant-test','req-1',time,target,body),'HMACSHA256='+createHmac('sha256','secret-test').update(canonical).digest('base64'));
 const getCanonical=canonical.split('\n').slice(0,4).join('\n');
 assert.equal(await api.signature('secret-test','merchant-test','req-1',time,target),'HMACSHA256='+createHmac('sha256','secret-test').update(getCanonical).digest('base64'));
});
test('webhook rejects forged signatures, changed amount and wrong merchant',async()=>{
 const body='{"order":{"amount":10000}}',time='2026-11-06T08:00:00Z';
 const signature=await api.signature('secret-test','merchant-test','req-1',time,'/functions/v1/bbweb-doku-webhook',body);
 const headers=new Headers({'client-id':'merchant-test','request-id':'req-1','request-timestamp':time,signature});
 assert.equal(await api.verifyNotification(headers,body),true);
 assert.equal(await api.verifyNotification(headers,body.replace('10000','10001')),false);
 headers.set('client-id','other');assert.equal(await api.verifyNotification(headers,body),false);
});
const payment={id:'p-1',order_id:'o-1',merchant_order_id:'INV123',amount:10000,status:'pending'};
const success={order:{invoice_number:'INV123',amount:'10000',currency:'IDR'},transaction:{status:'SUCCESS',type:'SALE'},channel:{id:'QRIS'}};
test('invoice, exact amount and currency must match before any mutation',async()=>{
 for(const order of [{invoice_number:'other',amount:10000},{invoice_number:'INV123',amount:9999.6},{invoice_number:'INV123',amount:null},{invoice_number:'INV123',amount:10000,currency:'USD'}]){
  let writes=0;await assert.rejects(api.applyDokuResult(payment,{...success,order},()=>writes++,()=>writes++));assert.equal(writes,0);
 }
});
test('settlement uses existing idempotent RPC and never trusts a browser return',async()=>{
 const calls=[];await api.applyDokuResult(payment,success,async(path,opts)=>calls.push({path,patch:JSON.parse(opts.body)}),async(name,args)=>calls.push({name,args}));
 assert.equal(calls[0].name,'bbweb_commit_merch_order');assert.equal(calls[0].args.p_order_id,'o-1');assert.equal(calls[1].patch.status,'paid');
 assert.match(calls[1].path,/status=neq.refunded/);
});
test('stale pending/failed notifications do not downgrade paid or refunded payments',async()=>{
 for(const state of [{status:'paid',paid_at:'2026-11-06T08:00:00Z'},{status:'refunded'}]){
 let writes=0;await api.applyDokuResult({...payment,...state},{...success,transaction:{status:'FAILED'}},()=>writes++,()=>writes++);assert.equal(writes,0);
 }
});
test('failed attempts do not release inventory; authorizations are not paid',async()=>{
 let rpc=0;const writes=[];
 await api.applyDokuResult(payment,{...success,transaction:{status:'FAILED'}},async(path,opts)=>writes.push({path,patch:JSON.parse(opts.body)}),()=>rpc++);
 assert.equal(rpc,0);assert.equal(writes.length,1);assert.match(writes[0].path,/paid_at=is.null/);
 assert.equal(api.dokuStatus('SUCCESS','AUTHORIZE'),'authorized');assert.equal(api.dokuStatus('TIMEOUT'),'unknown');
});
test('redirect allowlist rejects off-domain URLs and sandbox/production mixing',()=>{
 assert.equal(api.safePaymentUrl('https://sandbox.doku.com/checkout/test','sandbox'),true);
 for(const url of ['https://sandbox.doku.com.evil.test/pay','javascript:alert(1)','https://user@sandbox.doku.com/pay','https://checkout.doku.com/pay','http://sandbox.doku.com/pay'])assert.equal(api.safePaymentUrl(url,'sandbox'),false);
});
test('status lookup does not use sandbox credentials for production or poll within 60 seconds',async()=>{
 await assert.rejects(api.dokuRequest('/orders/v1/status/INV',undefined,'production'),/Mode transaksi/);
 const fresh={...payment,created_at:new Date().toISOString()};assert.equal(await api.refreshDoku(fresh),fresh);
});
