import {verifySnapWebhook} from '../_shared/doku-snap.ts';
function secretKey(){const m=Deno.env.get('SUPABASE_SECRET_KEYS');if(m){try{const v=JSON.parse(m)?.default;if(typeof v==='string'&&v)return v}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
async function db(path:string,options:RequestInit={}){const key=secretKey(),url=Deno.env.get('SUPABASE_URL')||'';if(!key||!url)throw Error('Server database unavailable');const h=new Headers(options.headers);h.set('apikey',key);if(!key.startsWith('sb_secret_'))h.set('Authorization','Bearer '+key);h.set('Accept','application/json');if(options.body!==undefined)h.set('Content-Type','application/json');const r=await fetch(url+'/rest/v1/'+path,{...options,headers:h});const t=await r.text();let p:any={};try{p=t?JSON.parse(t):{}}catch{}if(!r.ok)throw Error('Database error '+r.status);return p}
function result(body:any,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return result({responseCode:'4052500',responseMessage:'Method not allowed'},405);
 if(Number(req.headers.get('content-length')||0)>12000)return result({responseCode:'4132500',responseMessage:'Request too large'},413);
 const raw=await req.text();
 if(raw.length>12000)return result({responseCode:'4132500',responseMessage:'Request too large'},413);
 const signed=await verifySnapWebhook(req,raw,'/functions/v1/bbweb-snap-webhook').catch(()=>false);
 if(!signed)return result({responseCode:'4012500',responseMessage:'Invalid signature'},401);
 let data:any;try{data=JSON.parse(raw)}catch{return result({responseCode:'4002500',responseMessage:'Bad JSON'},400)}
 const invoice=String(data?.trxId||'').trim();
 const amount=Number(data?.paidAmount?.value),currency=data?.paidAmount?.currency;
 const vaNo=String(data?.virtualAccountNo||'').replace(/\s/g,'');
 const paymentId=String(data?.paymentRequestId||'').slice(0,64);
 if(!/^[A-Za-z0-9]{1,30}$/.test(invoice)||!Number.isSafeInteger(amount)||amount<1||currency!=='IDR'||!/^\d{8,28}$/.test(vaNo))
  return result({responseCode:'4002500',responseMessage:'Invalid payment data'},400);
 try{
  const rows=await db('bbweb_merch_payments?select=id,order_id,merchant_order_id,provider,amount,status,payment_type,payment_details&provider=eq.doku_snap&merchant_order_id=eq.'+encodeURIComponent(invoice)+'&limit=1');
  const p=Array.isArray(rows)?rows[0]:null;
  if(!p||p.amount!=amount||!['snap_va_bca','snap_va_bri'].includes(p.payment_type)||
      p.payment_details?.type!=='virtual_account'||String(p.payment_details.virtual_account_no)!==vaNo)
   return result({responseCode:'4042500',responseMessage:'Payment does not match'},404);
  await db('rpc/bbweb_apply_snap_payment',{method:'POST',body:JSON.stringify({
    p_payment_id:p.id,p_invoice:invoice,p_amount:amount,p_status:'paid',
    p_transaction_status:'SUCCESS',p_payment_type:p.payment_type
  })});
  return result({responseCode:'2002500',responseMessage:'Success',virtualAccountData:{
   partnerServiceId:String(data?.partnerServiceId||''),
   customerNo:String(data?.customerNo||''),
   virtualAccountNo:vaNo,trxId:invoice,paymentRequestId:paymentId
  }});
 }catch{return result({responseCode:'5002500',responseMessage:'Temporary processing error'},500)}
});
