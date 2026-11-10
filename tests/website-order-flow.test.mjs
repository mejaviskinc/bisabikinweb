import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const storefront=read('static-source/features/WebsiteStore.tsx');
const backend=read('supabase/functions/bbweb-website-store/index.ts');
const dashboard=read('static-source/features/WebsiteSalesDashboard.tsx');
const email=read('supabase/functions/bbweb-website-email/index.ts');
const migration=read('supabase/patches/website_quote_email_20261110.sql');
const styles=read('static-source/features/website-store.css');

test('website checkout offers domain-first or design-first from the same order flow',()=>{
 for(const marker of ["?mulai=domain","startingPoint==='domain'","startingPoint==='design'","websiteDemos.map(d=>","setStep(","Domain & desain","Paket layanan","Data bisnis","Tinjau pesanan"])
  assert.ok(storefront.includes(marker),'Missing checkout marker '+marker);
 assert.match(storefront,/template_slug:templateSlug\|\|null/);
 assert.match(storefront,/domain:normalizedDomain/);
 assert.match(storefront,/Preferensi durasi layanan/);
 assert.match(storefront,/Setujui syarat layanan/);
 assert.match(styles,/\.ws-checkout-progress/);
 assert.match(styles,/@media\(max-width:560px\)/);
});
test('website checkout cannot mark payment paid before admin quote and client acceptance',()=>{
 assert.match(storefront,/websiteStoreApi\('approve_quote'/);
 assert.match(storefront,/expected_total:Number\(order\.quoted_total\)/);
 assert.match(storefront,/acceptedQuoteId!==order\.id/);
 assert.match(backend,/if\(action==='approve_quote'\)/);
 assert.match(backend,/order\.status!=='proposal'/);
 assert.match(backend,/order\.payment_status!=='not_invoiced'/);
 assert.match(backend,/Number\(order\.quoted_total\)!==expectedTotal/);
 assert.match(backend,/&user_id=eq\./);
 assert.match(backend,/&status=eq\.proposal&payment_status=eq\.not_invoiced/);
 assert.match(backend,/!Array\.isArray\(updated\)\|\|!updated\[0\]/);
 assert.match(backend,/order\.requested_domain/);
 assert.match(backend,/Hanya pelanggan yang dapat menyetujui penawaran/);
 assert.match(dashboard,/selected\.status!=='awaiting_payment'/);
 assert.match(dashboard,/Status lunas hanya berasal dari notifikasi DOKU/);
 assert.doesNotMatch(backend,/payment_status\s*:\s*['"]paid['"]/);
});
test('website email quote is recorded once per order and only sent by protected worker',()=>{
 assert.match(migration,/quote_ready/);
 assert.match(migration,/on conflict\(order_id,event_type,recipient_role\) do nothing/);
 assert.match(migration,/after insert or update of status,payment_status/);
 assert.match(email,/HOSTINGER_MAIL_API_TOKEN/);
 assert.match(email,/job\.event_type==='quote_ready'/);
 assert.match(email,/status,payment_status/);
 assert.match(email,/Tinjau & setujui penawaran/);
 assert.match(backend,/if\(next==='proposal'&&current\.status!=='proposal'\)await notifyWebsiteEmail\(id\)/);
});

test('quote approval refuses stale amounts and requires matching order ownership before changing status',async()=>{
 const {stripTypeScriptTypes}=await import('node:module');
 const oldDeno=globalThis.Deno,oldFetch=globalThis.fetch;
 const owner='11111111-1111-4111-8111-111111111111',id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'local-test-service'};
 let handler=null,patchCount=0,eventCount=0;
 globalThis.Deno={env:{get:key=>env[key]},serve:callback=>{handler=callback}};
 try{
  await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(backend)).toString('base64'));
  globalThis.fetch=async(url,options={})=>{
   const u=new URL(String(url));
   if(u.pathname==='/auth/v1/user')return Response.json({id:owner,email:'buyer@example.com',email_confirmed_at:'2026-11-01T00:00:00Z'});
   if(u.pathname==='/rest/v1/bbweb_website_orders'){
    if(options.method==='PATCH'){
     patchCount++;
     assert.match(u.search,/user_id=eq\./);
     assert.match(u.search,/status=eq\.proposal/);
     assert.match(u.search,/quoted_total=eq\.850000/);
     assert.equal(JSON.parse(options.body).status,'awaiting_payment');
     return Response.json([{id,status:'awaiting_payment',quoted_total:850000}]);
    }
    return Response.json([{id,status:'proposal',payment_status:'not_invoiced',quoted_total:850000,requested_domain:'',domain_status:'unchecked'}]);
   }
   if(u.pathname==='/rest/v1/bbweb_website_order_events'){
    eventCount++;return new Response('',{status:201});
   }
   throw Error('Unexpected remote API: '+u.pathname);
  };
  const invoke=async expected_total=>handler(new Request('https://example.supabase.co/functions/v1/bbweb-website-store',{
   method:'POST',headers:{Origin:'https://bisabikinweb.site',Authorization:'Bearer test-owner-session','Content-Type':'application/json'},
   body:JSON.stringify({action:'approve_quote',id,expected_total})
  }));
  let result=await invoke(900000);
  assert.equal(result.status,409);
  assert.equal(patchCount,0,'Stale quote must not be updated');
  result=await invoke(850000);
  assert.equal(result.status,200);
  assert.equal((await result.json()).order.status,'awaiting_payment');
  assert.equal(patchCount,1);
  assert.equal(eventCount,1);
  // No payment status is altered by approving a quote.
 }finally{
  globalThis.Deno=oldDeno;globalThis.fetch=oldFetch;
 }
});
