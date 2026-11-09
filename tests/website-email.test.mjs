import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const migration=read('supabase/patches/website_email_notifications_20261110.sql');
const worker=read('supabase/functions/bbweb-website-email/index.ts');
const store=read('supabase/functions/bbweb-website-store/index.ts');
const webhook=read('supabase/functions/bbweb-website-doku-webhook/index.ts');

test('Customer and admin notification jobs are queued once after order insert and verified paid transition',()=>{
 assert.match(migration,/after insert or update of payment_status/);
 assert.match(migration,/old.payment_status is distinct from 'paid'/);
 assert.match(migration,/unique\(order_id,event_type,recipient_role\)/);
 assert.match(migration,/on conflict\(order_id,event_type,recipient_role\) do nothing/);
 assert.match(migration,/event_name:='order_received'/);
 assert.match(migration,/event_name:='payment_paid'/);
 assert.match(migration,/bussines@bisabikinweb.site/);
});

test('Email outbox remains private and has atomic claim with retry',()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public.bbweb_website_email_outbox from public,anon,authenticated/);
 assert.match(migration,/revoke all on function public.bbweb_claim_website_email_jobs/);
 assert.match(migration,/for update skip locked/);
 assert.match(migration,/next_attempt_at/);
 assert.match(worker,/status:'sending'/);
 assert.match(worker,/status:'sent'/);
 assert.match(worker,/status:'pending'/);
});

test('Only verified DOKU payment can trigger payment email dispatch',()=>{
 assert.match(webhook,/if\(status==='paid'&&payment.order_id\)await notifyWebsiteEmail\(payment.order_id\)/);
 assert.match(store,/await notifyWebsiteEmail\(order.id\)/);
 assert.match(worker,/job.event_type==='payment_paid'&&order.payment_status!=='paid'/);
 assert.match(worker,/payment.status!=='paid'/);
 assert.match(worker,/payment.environment!=='production'/);
});

test('Mail delivery is secret-guarded, official, and branded',()=>{
 assert.match(worker,/HOSTINGER_MAIL_API_TOKEN/);
 assert.match(worker,/authorization!=='Bearer '\+secret/);
 assert.match(worker,/https:\/\/api.mail.hostinger.com\/api\/v1\/mailboxes\//);
 assert.match(worker,/response.status!==204/);
 assert.match(worker,/MAILBOX_ID='AC5774d7c90567091132114c549377'/);
 for(const str of ['#080a09','#c3f85c','PT GHAZALI DIGITAL INDONESIA',
  'Nomor pesanan','Nama klien','Nama bisnis','Domain diinginkan','Lihat detail proyek']){
  assert.ok(worker.includes(str),'Missing '+str);
 }
});
