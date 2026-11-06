import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const fixture=`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE TABLE public.bbweb_orders(id uuid PRIMARY KEY,order_no text,currency text,total numeric,status text,payment_status text,inventory_state text,updated_at timestamptz);
CREATE TABLE public.bbweb_merch_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES bbweb_orders(id),merchant_order_id text UNIQUE,provider text,amount numeric,currency text,environment text,status text,transaction_status text,payment_type text,created_at timestamptz DEFAULT now(),updated_at timestamptz,paid_at timestamptz);
CREATE TABLE settlement_calls(order_id uuid PRIMARY KEY,commits integer DEFAULT 0,reserves integer DEFAULT 0);
CREATE FUNCTION public.bbweb_reserve_merch_order(p_order_id uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM bbweb_orders WHERE id=p_order_id AND order_no='NO_STOCK') THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK'; END IF;
 INSERT INTO settlement_calls(order_id,reserves) VALUES(p_order_id,1) ON CONFLICT(order_id) DO UPDATE SET reserves=settlement_calls.reserves+1;
 UPDATE bbweb_orders SET inventory_state='reserved' WHERE id=p_order_id;
END $$;
CREATE FUNCTION public.bbweb_commit_merch_order(p_order_id uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO settlement_calls(order_id,commits) VALUES(p_order_id,1) ON CONFLICT(order_id) DO UPDATE SET commits=settlement_calls.commits+1;
 UPDATE bbweb_orders SET payment_status='paid',inventory_state='committed',status='paid' WHERE id=p_order_id;
END $$;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON bbweb_orders,bbweb_merch_payments,settlement_calls TO service_role;
`;
const id='11111111-1111-4111-8111-111111111111';
async function setup(){const db=new PGlite();await db.exec(fixture);await db.exec(readFileSync('supabase/patches/doku_payment_runtime.sql','utf8'));await db.query(`INSERT INTO bbweb_orders VALUES($1,'BB1','IDR',10000,'waiting_payment','pending','reserved',now())`,[id]);return db;}
async function claim(db,invoice='BB123'){return (await db.query('SELECT bbweb_claim_doku_payment($1,$2,$3) AS result',[id,invoice,'sandbox'])).rows[0].result;}
async function apply(db,p,status='paid',amount=10000){return (await db.query('SELECT bbweb_apply_doku_payment($1,$2,$3,$4,$5,$6) AS result',[p.id,p.merchant_order_id,amount,status,status==='paid'?'SUCCESS':status.toUpperCase(),'QRIS'])).rows[0].result;}
test('claim stores exactly one payment across repeated checkout/continuation requests',async()=>{const db=await setup();try{
 const first=await claim(db),second=await claim(db,'BB456');assert.equal(first.claimed,true);assert.equal(second.claimed,false);assert.equal(second.payment.id,first.payment.id);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM bbweb_merch_payments')).rows[0].n,1);
}finally{await db.close()}});
test('duplicate success, refund and delayed notifications settle once and preserve fulfillment',async()=>{const db=await setup();try{
 const {payment}=await claim(db);await apply(db,payment);await db.query("UPDATE bbweb_orders SET status='shipped' WHERE id=$1",[id]);await apply(db,payment);
 await apply(db,payment,'pending');assert.equal((await db.query('SELECT status FROM bbweb_merch_payments')).rows[0].status,'paid');
 assert.equal((await db.query('SELECT commits FROM settlement_calls')).rows[0].commits,1);
 assert.equal((await db.query('SELECT status FROM bbweb_orders')).rows[0].status,'shipped');
 await apply(db,payment,'refunded');await apply(db,payment);assert.equal((await db.query('SELECT payment_status FROM bbweb_orders')).rows[0].payment_status,'refunded');
}finally{await db.close()}});
test('mismatched amount rolls back without any settlement or status update',async()=>{const db=await setup();try{
 const {payment}=await claim(db);await assert.rejects(apply(db,payment,'paid',9999),/DOKU_AMOUNT_MISMATCH/);
 assert.equal((await db.query('SELECT status FROM bbweb_merch_payments')).rows[0].status,'created');assert.equal((await db.query('SELECT count(*)::int AS n FROM settlement_calls')).rows[0].n,0);
}finally{await db.close()}});
test('late success re-reserves released inventory and failed re-reservation rolls back',async()=>{const db=await setup();try{
 const {payment}=await claim(db);await db.query("UPDATE bbweb_orders SET inventory_state='released' WHERE id=$1",[id]);await apply(db,payment);
 const counts=(await db.query('SELECT commits,reserves FROM settlement_calls')).rows[0];assert.equal(counts.commits,1);assert.equal(counts.reserves,1);
 await db.query("UPDATE bbweb_orders SET inventory_state='released',payment_status='pending',order_no='NO_STOCK' WHERE id=$1",[id]);await db.query("UPDATE bbweb_merch_payments SET status='pending',paid_at=null");
 await assert.rejects(apply(db,payment),/INSUFFICIENT_STOCK/);assert.equal((await db.query('SELECT status FROM bbweb_merch_payments')).rows[0].status,'pending');
}finally{await db.close()}});
test('failed attempt remains claimed and polling is throttled in database',async()=>{const db=await setup();try{
 const {payment}=await claim(db);await apply(db,payment,'failed');assert.equal((await claim(db,'BB2')).claimed,false);
 const slot=()=>db.query('SELECT bbweb_take_doku_poll_slot($1) AS allowed',[payment.id]);assert.equal((await slot()).rows[0].allowed,true);assert.equal((await slot()).rows[0].allowed,false);
}finally{await db.close()}});
test('anonymous and authenticated roles cannot claim or settle payment records',async()=>{const db=await setup();try{
 for(const role of ['anon','authenticated']){await db.exec('SET ROLE '+role);await assert.rejects(claim(db),/permission denied/);await db.exec('RESET ROLE')}
 await db.exec('SET ROLE service_role');assert.equal((await claim(db)).claimed,true);
}finally{await db.close()}});

test('a failed settlement RPC rolls back both payment and order mutations',async()=>{const db=await setup();try{
 const {payment}=await claim(db);
 await db.exec(`CREATE OR REPLACE FUNCTION public.bbweb_commit_merch_order(p_order_id uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN UPDATE bbweb_orders SET payment_status='paid' WHERE id=p_order_id; RAISE EXCEPTION 'SETTLEMENT_FAILED'; END $$;`);
 await assert.rejects(apply(db,payment),/SETTLEMENT_FAILED/);
 assert.equal((await db.query('SELECT payment_status FROM bbweb_orders')).rows[0].payment_status,'pending');
 assert.equal((await db.query('SELECT status FROM bbweb_merch_payments')).rows[0].status,'created');
}finally{await db.close()}});
