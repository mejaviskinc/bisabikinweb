import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const studio=read('static-source/features/Studio.tsx');
const build=read('build-pages.mjs');
const api=read('supabase/functions/bbweb-website-store/index.ts');
const sql=read('supabase/patches/website_store_20261108.sql');
const storefront=read('static-source/features/WebsiteStore.tsx');
const app=read('static-source/main.tsx');

test('Website Store routes are connected without replacing existing merch, buyer and checkout',()=>{
 for(const route of ['/beli-website','/harga-website','/pesan-website','/client/dashboard','/desain/']){
  assert.ok(studio.includes(route),route+' must be included in studio');
 }
 for(const oldRoute of ["/merch","/checkout","/payment","/track-order","/account"])assert.ok(studio.includes(oldRoute));
 assert.ok(app.includes("WebsiteStoreAdmin"));
 assert.ok(app.includes("path==='/admin/website-store'"));
});
test('website catalog routes are SEO prerendered and private pages are noindex',()=>{
 for(const route of ["/beli-website","/harga-website","/desain/","/pesan-website","/client/dashboard"])assert.ok(build.includes(route));
 assert.match(build,/path==='\/pesan-website'\|\|path==='\/client\/dashboard'/);
 assert.match(build,/excludedRoutes/);
});
test('service ordering cannot claim to have accepted payment from a client',()=>{
 assert.ok(api.includes("authenticate(req)"));
 assert.ok(api.includes("if(action==='create_order')"));
 assert.ok(api.includes("if(action==='my_orders')"));
 assert.ok(api.includes("if(action==='request_revision')"));
 assert.ok(api.includes("requireAdmin(admin)"));
 assert.match(api,/payment_status:'not_invoiced'/);
 assert.doesNotMatch(api,/payment_status\s*:\s*['"]paid['"]/);
 assert.doesNotMatch(api,/['"]MIDTRANS_SERVER_KEY['"]/);
 assert.match(api,/Deno\.env\.get\('DOKU_SECRET_KEY'\)/);
 assert.match(api,/if\(action==='create_payment'\)/);
 assert.match(api,/bbweb_claim_website_doku_payment/);
 assert.doesNotMatch(api,/payment_status\s*:\s*['"]paid['"]/);
});
test('new Supabase tables have RLS, ownership checks, and no existing merch mutations',()=>{
 for(const table of ['bbweb_website_templates','bbweb_website_packages','bbweb_website_orders','bbweb_website_order_events']){
  assert.ok(sql.includes('create table if not exists public.'+table));
  assert.ok(sql.includes('alter table public.'+table+' enable row level security'));
 }
 assert.match(sql,/auth\.uid\(\)\)=user_id/);
 assert.match(sql,/revoke all on/);
 assert.doesNotMatch(sql,/\b(drop table|truncate|delete from|alter table public\.bbweb_orders)\b/i);
});
test('catalog illustrations and manual domain status are labeled honestly',()=>{
 assert.match(storefront,/Ilustrasi konsep/);
 assert.match(storefront,/perlu verifikasi manual/);
 assert.match(storefront,/bukan pembayaran otomatis/);
 assert.match(storefront,/harga mulai|Harga mulai|Estimasi harga mulai/);
});
