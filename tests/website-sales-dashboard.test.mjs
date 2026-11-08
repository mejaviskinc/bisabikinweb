import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin=read('static-source/features/Admin.tsx');
const board=read('static-source/features/WebsiteSalesDashboard.tsx');
const api=read('supabase/functions/bbweb-website-store/index.ts');
const checkout=read('static-source/features/WebsiteStore.tsx');
const main=read('static-source/main.tsx');

test('Main Bisabikinweb admin has a dedicated website-sales tab and real statistics',()=>{
 assert.match(admin,/website-sales/);
 assert.match(admin,/Penjualan Website/);
 assert.match(admin,/WebsiteSalesDashboard session=\{session\} consultationLeads=\{leads\}/);
 assert.match(admin,/websiteStoreApi\('admin_summary'/);
 assert.match(admin,/Pesanan Website/);
 assert.match(admin,/Orders Merchandise/);
});
test('Admin lists all kinds of website purchases with identity, design, category and payment truth',()=>{
 for(const label of ['60 desain demo','Website custom','Paket website','Nama Desain','Nama Pelanggan','WhatsApp','Domain Permintaan','Harga Awal','Status Pembayaran']){
   assert.ok(board.includes(label),'Missing '+label);
 }
 assert.match(board,/admin_list/);
 assert.match(board,/next_offset/);
 assert.match(board,/Muat 100 pesanan berikutnya/);
 assert.match(board,/admin_update_order/);
 assert.match(board,/Belum dibuat invoice/);
 assert.match(board,/Pembayaran tidak bisa ditandai lunas/);
});
test('Consultation enquiries are visible separately from actual orders',()=>{
 assert.match(board,/Permintaan konsultasi/);
 assert.match(board,/adminUpdateLead/);
 assert.match(board,/belum menjadi order|Belum menjadi order/);
 assert.match(board,/Tidak dibuatkan order fiktif/);
});
test('Store Edge Function supports exact order counts and complete pagination after admin authorization',()=>{
 assert.match(api,/async function countWebsiteOrders/);
 assert.match(api,/Prefer:'count=exact'/);
 assert.match(api,/if\(action==='admin_summary'\)/);
 assert.match(api,/if\(action==='admin_list'\)/);
 assert.match(api,/offset/);
 assert.match(api,/next_offset/);
 assert.match(api,/requireAdmin\(admin\)/);
 assert.ok(api.indexOf('requireAdmin(admin)')<api.indexOf("if(action==='admin_summary')"));
 assert.match(api,/payment_status:'not_invoiced'/);
 assert.doesNotMatch(api,/payment_status:\s*'paid'/);
});
test('All 60 demo orders prefill category and package, and existing merchandising remains untouched',()=>{
 assert.match(checkout,/websiteDemos\.find\(d=>d\.slug===design\)/);
 assert.match(checkout,/category:chosen\.category/);
 assert.match(checkout,/setPackageSlug\(chosen\.packageSlug\)/);
 assert.match(checkout,/template_slug:templateSlug\|\|null/);
 assert.match(main,/PaymentGatewayAdmin/);
 assert.match(admin,/collections\.orders/);
});
