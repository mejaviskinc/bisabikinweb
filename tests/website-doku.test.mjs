import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('supabase/functions/bbweb-website-store/index.ts');
const hook=read('supabase/functions/bbweb-website-doku-webhook/index.ts');
const sql=read('supabase/patches/website_doku_20261108.sql');
const client=read('static-source/features/WebsiteStore.tsx');
const admin=read('static-source/features/WebsiteSalesDashboard.tsx');

test('DOKU customer-facing methods do not advertise PayPal or unavailable local method selectors',()=>{
 const footer=read('static-source/components/FooterPaymentMethods.tsx');
 const channels=read('static-source/components/DokuPaymentChannels.tsx');
 const merch=read('static-source/features/Commerce.tsx');
 for(const category of ['QRIS','Virtual Account','E-wallet','Kartu debit / kredit','Gerai ritel']){
  assert.ok(channels.includes(category),'Missing DOKU category: '+category);
 }
 assert.match(channels,/akun merchant/);
 assert.match(footer,/Metode Pembayaran via DOKU/);
 assert.doesNotMatch(footer,/PayPal/);
 assert.doesNotMatch(merch,/name="payment_method"/);
 assert.match(merch,/payment_method:'all'/);
 assert.match(merch,/DokuPaymentChannels/);
 assert.match(client,/DokuPaymentChannels/);
 assert.match(api,/payment:\{payment_due_date:60,type:'SALE'\}/);
});


test('Website orders pay only against server-side admin-approved price, not browser-submitted amount',()=>{
 assert.match(api,/if\(action==='create_payment'\)/);
 assert.match(api,/order\.status!=='awaiting_payment'/);
 assert.match(api,/Number\(order\.quoted_total\)/);
 assert.match(api,/bbweb_claim_website_doku_payment/);
 assert.match(api,/dokuResponse/);
 assert.match(api,/HMACSHA256=/);
 assert.match(api,/override_notification_url:notification/);
 assert.match(api,/bbweb-website-doku-webhook/);
 assert.match(api,/payment_due_date:60/);
 assert.doesNotMatch(api,/input\.amount.*requestDokuCheckout/);
});
test('Database locks quote and atomically records DOKU settlement without exposing buyer-side writes',()=>{
 assert.match(sql,/create table if not exists public\.bbweb_website_payments/);
 assert.match(sql,/unique references public\.bbweb_website_orders/);
 assert.match(sql,/alter table public\.bbweb_website_payments enable row level security/);
 assert.match(sql,/grant select on public\.bbweb_website_payments to authenticated/);
 assert.match(sql,/grant execute on function public\.bbweb_claim_website_doku_payment\(uuid,text,text\) to service_role/);
 assert.match(sql,/grant execute on function public\.bbweb_apply_website_doku_payment\(text,numeric,text,text,text,text\) to service_role/);
 assert.match(sql,/FOR UPDATE/gi);
 assert.match(sql,/QUOTE_LOCKED_BY_DOKU_PAYMENT/);
 assert.match(sql,/SIGNED_AMOUNT_OR_ENVIRONMENT_MISMATCH/);
 assert.match(sql,/if p\.status='paid'/);
 assert.doesNotMatch(sql,/grant (insert|update|all) on public\.bbweb_website_payments to authenticated/i);
});
test('Customer and admin pages show real DOKU payment state without manual paid override',()=>{
 assert.match(client,/Bayar dengan DOKU/);
 assert.match(client,/create_payment/);
 assert.match(client,/o\.payment_status==='paid'/);
 assert.match(client,/safeDokuUrl/);
 assert.match(admin,/DOKU Invoice/);
 assert.match(admin,/DOKU Checkout/);
 assert.match(admin,/admin_doku_config/);
 assert.match(admin,/Status lunas hanya berasal dari notifikasi DOKU/);
});
test('Verified website payment automatically opens WhatsApp with client identity and order number',()=>{
 const studio=read('static-source/features/Studio.tsx');
 assert.match(api,/callback='https:\/\/bisabikinweb\.site\/client\/dashboard\/\?consult='/);
 assert.match(api,/select=id,order_no,full_name,email,phone,company,category,package_slug,template_slug/);
 assert.match(client,/order\.id===consultOrderId&&order\.payment_status==='paid'/);
 assert.match(client,/window\.location\.assign\(whatsapp\(whatsappNumber,websitePaidConsultationMessage\(paidOrder\)\)\)/);
 assert.match(client,/sessionStorage\.removeItem\(pendingConsultationKey\)/);
 assert.match(client,/Nomor pesanan/);
 assert.match(client,/Nama klien/);
 assert.match(client,/Nama bisnis/);
 assert.match(client,/WhatsApp klien/);
 assert.match(studio,/WebsiteClientProjects whatsappNumber=\{data\.settings\.whatsapp\|\|''\}/);
});
const oldDeno=globalThis.Deno,oldFetch=globalThis.fetch;
const env={DOKU_CLIENT_ID:'MCH-TEST-0001',DOKU_SECRET_KEY:'webhook-test-secret',DOKU_ENV:'sandbox',
 SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'service-test'};
let handler=null;
globalThis.Deno={env:{get:key=>env[key]},serve:callback=>{handler=callback}};
await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(hook)).toString('base64'));

function signedRequest(body,override={}){
 const timestamp=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 const id='notify-'+Date.now();
 const digest=createHash('sha256').update(body).digest('base64');
 const message=['Client-Id:'+env.DOKU_CLIENT_ID,'Request-Id:'+id,'Request-Timestamp:'+timestamp,
 'Request-Target:/functions/v1/bbweb-website-doku-webhook','Digest:'+digest].join('\n');
 const sig='HMACSHA256='+createHmac('sha256',env.DOKU_SECRET_KEY).update(message).digest('base64');
 return new Request('https://example.supabase.co/functions/v1/bbweb-website-doku-webhook',{method:'POST',
 headers:{'Client-Id':env.DOKU_CLIENT_ID,'Request-Id':id,'Request-Timestamp':timestamp,Signature:sig,...override},
 body});
}
const invoice='BWS'+'A'.repeat(23);
const good={order:{invoice_number:invoice,amount:800000,currency:'IDR'},transaction:{status:'SUCCESS',type:'SALE'},channel:{id:'QRIS'}};

test('DOKU webhook validates HMAC, invoice, currency and amount before calling the settlement RPC',async()=>{
 let dbCalls=0,rpcCalls=0;globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('bbweb_website_payments')){dbCalls++;return Response.json([{id:'payment-1',merchant_order_id:invoice,amount:800000,environment:'sandbox'}]);}
  if(path.includes('rpc/bbweb_apply_website_doku_payment')){rpcCalls++;const params=JSON.parse(options.body);assert.equal(params.p_status,'paid');assert.equal(params.p_invoice,invoice);assert.equal(params.p_amount,800000);return Response.json({id:'payment-1',status:'paid'});}
  throw Error('Unexpected request '+path);
 };
 try{
  let response=await handler(signedRequest(JSON.stringify(good)));
  assert.equal(response.status,200);assert.equal(rpcCalls,1);
  response=await handler(signedRequest(JSON.stringify(good),{Signature:'HMACSHA256='+'a'.repeat(44)}));
  assert.equal(response.status,401);assert.equal(rpcCalls,1);
  response=await handler(signedRequest(JSON.stringify({...good,order:{...good.order,amount:900000}})));
  assert.equal(response.status,409);assert.equal(rpcCalls,1);
  response=await handler(signedRequest(JSON.stringify({...good,transaction:{status:'FAILED',type:'SALE'}})));
  assert.equal(response.status,200);assert.equal(rpcCalls,1);
  assert.equal(dbCalls,2);
 }finally{globalThis.fetch=oldFetch;}
});
test.after(()=>{globalThis.Deno=oldDeno;globalThis.fetch=oldFetch;});
