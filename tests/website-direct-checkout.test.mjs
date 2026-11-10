import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const backend=read('supabase/functions/bbweb-website-store/index.ts');
const client=read('static-source/features/WebsiteStore.tsx');
const page=read('static-source/features/WebsiteSalesDashboard.tsx');

test('standard website packages redirect automatically through DOKU, custom remains a quotation',()=>{
 assert.match(client,/websiteStoreApi\('create_order'/);
 assert.match(client,/checkout_mode:directCheckout\?'instant':'quote'/);
 assert.match(client,/expected_base_price:directCheckout\?Number\(current\?\.base_price\):null/);
 assert.match(client,/if\(order\.checkout_ready\)/);
 assert.match(client,/await openDokuCheckout\(order\.id\)/);
 assert.match(client,/websiteStoreApi\('create_payment',\{id:orderId\}\)/);
 assert.match(client,/window\.location\.assign\(url\)/);
 assert.match(client,/if\(busy\|\|result\)return/);
 assert.match(client,/if\(result\)return/);
 assert.match(client,/result\.checkout_ready&&<button/);
 assert.match(client,/Biaya domain, hosting, perpanjangan, dan fitur tambahan tidak termasuk/);
 assert.match(client,/Paket Custom tetap melalui penawaran manual/);
 assert.match(page,/Paket <strong>Custom<\/strong> masih melalui penawaran/);
});
test('server accepts only fixed, active, unchanged catalog prices and never client-supplied amount',()=>{
 assert.match(backend,/instantCheckoutPackages=new Set\(\['starter','business','commerce'\]\)/);
 assert.match(backend,/input\.checkout_mode==='instant'/);
 assert.match(backend,/Number\(input\.expected_base_price\)!==listedPrice/);
 assert.match(backend,/quoted_total:directCheckout\?listedPrice:null/);
 assert.match(backend,/status:directCheckout\?'awaiting_payment':'requested'/);
 assert.match(backend,/payment_status:'not_invoiced'/);
 assert.match(backend,/bbweb_claim_website_doku_payment/);
 assert.match(backend,/HMACSHA256=/);
 assert.doesNotMatch(backend,/payment_status\s*:\s*['"]paid['"]/);
});

test('backend simulates direct order, authentic DOKU checkout and no duplicate second invoice',async()=>{
 const previousDeno=globalThis.Deno,previousFetch=globalThis.fetch;
 const owner='11111111-1111-4111-8111-111111111111';
 const orderId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const paymentId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const checkoutUrl='https://sandbox.doku.com/checkout/link/TEST-ORDER';
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',
 DOKU_CLIENT_ID:'MCH-TEST',DOKU_SECRET_KEY:'secret',DOKU_ENV:'sandbox'};
 let handler=null,record=null,payment=null,created=0,dokuCalls=0,events=0,queuedEmail=false;
 globalThis.Deno={env:{get:key=>env[key]},serve:callback=>{handler=callback}};
 try{
  await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(backend)).toString('base64'));
  globalThis.fetch=async(uri,options={})=>{
   const u=new URL(String(uri)),method=options.method||'GET';
   if(u.pathname==='/auth/v1/user')return Response.json({id:owner,email:'buyer@example.com',email_confirmed_at:'2026-11-01T00:00:00Z'});
   if(u.pathname==='/rest/v1/bbweb_website_packages'){
    return Response.json([{slug:u.searchParams.get('slug')?.slice(3),base_price:u.searchParams.get('slug')==='eq.custom'?null:800000,is_active:true}]);
   }
   if(u.pathname==='/rest/v1/bbweb_website_orders'){
    if(method==='POST'){created++;record={id:orderId,...JSON.parse(options.body)};return Response.json([record],{status:201});}
    if(method==='PATCH'){
     const patch=JSON.parse(options.body);
     Object.assign(record,patch);
     return Response.json([record]);
    }
    if(u.searchParams.has('created_at')&&u.searchParams.get('select')==='id')return Response.json([]);
    if(u.searchParams.get('id')?.startsWith('eq.')&&record)return Response.json([record]);
    return Response.json([]);
   }
   if(u.pathname==='/rest/v1/bbweb_website_order_events'){events++;return new Response('',{status:201});}
   if(u.pathname==='/rest/v1/rpc/bbweb_claim_website_doku_payment'){
    const payload=JSON.parse(options.body);
    assert.equal(payload.p_order_id,orderId);
    if(!payment){
     payment={id:paymentId,amount:record.quoted_total,status:'created',redirect_url:null};
     return Response.json({claimed:true,payment});
    }
    return Response.json({claimed:false,payment});
   }
   if(u.pathname==='/rest/v1/bbweb_website_payments'&&method==='PATCH'){
    Object.assign(payment,JSON.parse(options.body));return Response.json([payment]);
   }
   if(u.pathname==='/checkout/v1/payment'){
    dokuCalls++;
    const req=JSON.parse(options.body);
    assert.equal(req.order.amount,800000);
    assert.equal(req.order.currency,'IDR');
    assert.match(options.headers.Signature,/^HMACSHA256=/);
    assert.match(req.additional_info.override_notification_url,/bbweb-website-doku-webhook$/);
    return Response.json({response:{payment:{url:checkoutUrl}}});
   }
   throw Error('Unexpected HTTP '+method+' '+u.pathname);
  };
  const invoke=async(action,payload)=>handler(new Request('https://example.supabase.co/functions/v1/bbweb-website-store',{
   method:'POST',headers:{Origin:'https://bisabikinweb.site',Authorization:'Bearer mock-owner', 'Content-Type':'application/json'},
   body:JSON.stringify({action,...payload})
  }));
  const base={checkout_mode:'instant',expected_base_price:800000,package_slug:'starter',template_slug:null,
   full_name:'Example Buyer',company:'Example Company',email:'spoof@example.org',phone:'081234567890',
   category:'umkm',domain:'example.com',brief:'Build a professional standard website for our company.',amount:1,quoted_total:1};
  let response=await invoke('create_order',{...base,expected_base_price:1});
  assert.equal(response.status,409,'Mismatched displayed price must not create an invoice');
  assert.equal(created,0);
  response=await invoke('create_order',base);
  assert.equal(response.status,200);
  const order=(await response.json()).order;
  assert.equal(order.status,'awaiting_payment');
  assert.equal(order.checkout_ready,true);
  assert.equal(order.quoted_total,800000);
  assert.equal(record.quoted_total,800000);
  assert.equal(record.email,'buyer@example.com','Email must come from signed-in session');
  assert.equal(record.domain_status,'manual_review','Domain never automatically marked available');
  assert.equal(created,1);
  assert.equal(events,1);
  response=await invoke('create_payment',{id:orderId,amount:1});
  assert.equal(response.status,200);
  let outcome=await response.json();
  assert.equal(outcome.redirect_url,checkoutUrl);
  assert.equal(outcome.amount,800000);
  assert.equal(dokuCalls,1);
  response=await invoke('create_payment',{id:orderId,amount:1});
  assert.equal(response.status,200);
  outcome=await response.json();
  assert.equal(outcome.redirect_url,checkoutUrl);
  assert.equal(dokuCalls,1,'Retry must reuse the existing payment URL');
  payment=null;record=null;
  response=await invoke('create_order',{...base,checkout_mode:'quote',package_slug:'custom',expected_base_price:null});
  assert.equal(response.status,200);
  outcome=(await response.json()).order;
  assert.equal(outcome.status,'requested');
  assert.equal(outcome.checkout_ready,false);
  assert.equal(outcome.quoted_total,null);
  response=await invoke('create_payment',{id:orderId});
  assert.equal(response.status,409,'Custom orders must not create payment without approved quotation');
 }finally{globalThis.Deno=previousDeno;globalThis.fetch=previousFetch;}
});
