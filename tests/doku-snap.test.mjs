import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {createHash,createHmac,createVerify,generateKeyPairSync} from 'node:crypto';

const source=await readFile(new URL('../supabase/functions/_shared/doku-snap.ts',import.meta.url),'utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const values={
 DOKU_SNAP_ENABLED:'true',DOKU_SNAP_ENV:'sandbox',
 DOKU_SNAP_CLIENT_ID:'BRN-TEST-SNAP',DOKU_SNAP_CLIENT_SECRET:'test-snap-merchant-secret',
 DOKU_SNAP_PRIVATE_KEY:privateKey,DOKU_SNAP_QRIS_MERCHANT_ID:'12345',
 DOKU_SNAP_QRIS_TERMINAL_ID:'A01',DOKU_SNAP_QRIS_POSTAL_CODE:'55123',
 DOKU_SNAP_VA_BCA_PARTNER_SERVICE_ID:'19008',DOKU_SNAP_VA_BRI_PARTNER_SERVICE_ID:'12362'
};
const saved=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));
globalThis.Deno={env:{get:key=>process.env[key]}};
for(const [k,v] of Object.entries(values))process.env[k]=v;
const originalFetch=globalThis.fetch;
function withResponse(kind){
 let calls=[];
 globalThis.fetch=async(url,opt={})=>{
  calls.push({url:String(url),opt});
  const headers=opt.headers||{};
  if(String(url).endsWith('/authorization/v1/access-token/b2b')){
   const verifier=createVerify('RSA-SHA256');
   verifier.update(values.DOKU_SNAP_CLIENT_ID+'|'+headers['X-TIMESTAMP']);
   assert.ok(verifier.verify(publicKey,headers['X-SIGNATURE'],'base64'),'SNAP token request must use RSA-SHA256');
   assert.equal(headers['X-CLIENT-KEY'],values.DOKU_SNAP_CLIENT_ID);
   return Response.json({responseCode:'2007300',accessToken:'TOKEN_FOR_TESTS',expiresIn:900});
  }
  const path=new URL(url).pathname,body=JSON.parse(opt.body);
  const hash=createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const signed='POST:'+path+':TOKEN_FOR_TESTS:'+hash+':'+headers['X-TIMESTAMP'];
  const expected=createHmac('sha512',values.DOKU_SNAP_CLIENT_SECRET).update(signed).digest('base64');
  assert.equal(headers['X-SIGNATURE'],expected,'SNAP transaction request must use HMAC-SHA512');
  assert.equal(headers.Authorization,'Bearer TOKEN_FOR_TESTS');
  assert.equal(headers['CHANNEL-ID'],'H2H');
  if(kind==='qris'){
   assert.equal(path,'/snap-adapter/b2b/v1.0/qr/qr-mpm-generate');
   assert.equal(body.amount.value,'11000.00');
   return Response.json({responseCode:'2004700',partnerReferenceNo:body.partnerReferenceNo,referenceNo:body.partnerReferenceNo,qrContent:'0'.repeat(190)});
  }
  if(kind==='va'){
   assert.equal(path,'/virtual-accounts/bi-snap-va/v1.1/transfer-va/create-va');
   assert.equal(body.totalAmount.currency,'IDR');
   assert.equal(body.virtualAccountTrxType,'C');
   return Response.json({responseCode:'2002700',virtualAccountData:{virtualAccountNo:body.virtualAccountNo,trxId:body.trxId,totalAmount:body.totalAmount}});
  }
  return Response.json({responseCode:'5000000'},{status:500});
 };
 return calls;
}

test('SNAP QRIS uses signed B2B token, signed direct QR request and merchant-sourced amount',async()=>{
 const calls=withResponse('qris');
 try{
  const result=await api.createSnap('snap_qris','TESTINVOICE01',11000,{name:'Test Buyer'});
  assert.equal(result.type,'qris');assert.equal(result.reference_no,'TESTINVOICE01');assert.ok(result.qr_content.length>80);
  assert.ok(calls.length>=1);
 }finally{globalThis.fetch=originalFetch}
});
test('SNAP VA uses server-assigned bank code and validates returned bank account details',async()=>{
 withResponse('va');
 try{
  const result=await api.createSnap('snap_va_bca','TESTINVOICE02',11000,{name:'Test Buyer',email:'buyer@example.invalid',phone:'628123456789'});
  assert.equal(result.bank,'BCA');assert.ok(/^\d{8,28}$/.test(result.virtual_account_no));
 }finally{globalThis.fetch=originalFetch}
});
test('SNAP direct methods fail closed when capability flag is disabled',async()=>{
 process.env.DOKU_SNAP_ENABLED='false';
 try{
  assert.equal(api.snapConfig('snap_qris').ready,false);
  await assert.rejects(()=>api.createSnap('snap_qris','TESTINVOICE03',11000,{}),/SNAP_NOT_CONFIGURED/);
 }finally{process.env.DOKU_SNAP_ENABLED='true'}
});
test('SNAP webhook validates HMAC, merchant ID, timestamp and body integrity',async()=>{
 const body=JSON.stringify({trxId:'TESTINVOICE01',paidAmount:{value:'11000.00',currency:'IDR'}});
 const stamp=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 const token='SIGNED_TOKEN';
 const path='/functions/v1/bbweb-snap-webhook';
 const hashed=createHash('sha256').update(body).digest('hex');
 const signature=createHmac('sha512',values.DOKU_SNAP_CLIENT_SECRET).update('POST:'+path+':'+token+':'+hashed+':'+stamp).digest('base64');
 const headers={'x-partner-id':values.DOKU_SNAP_CLIENT_ID,'x-signature':signature,'x-timestamp':stamp,authorization:'Bearer '+token};
 assert.equal(await api.verifySnapWebhook(new Request('https://example.invalid'+path,{method:'POST',headers}),body,path),true);
 assert.equal(await api.verifySnapWebhook(new Request('https://example.invalid'+path,{method:'POST',headers}),body+' ',path),false);
 assert.equal(await api.verifySnapWebhook(new Request('https://example.invalid'+path,{method:'POST',headers:{...headers,'x-timestamp':'not-a-date'}}),body,path),false);
});
process.on('exit',()=>{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v}globalThis.fetch=originalFetch});
