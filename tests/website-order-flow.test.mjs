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
