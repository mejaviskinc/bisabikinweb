// DOKU Checkout notification endpoint dedicated to BisaBikinWeb website services.
// Shared merchant credentials, independent from the merchandise webhook.
const encoder=new TextEncoder();
function answer(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
function config(){const clientId=Deno.env.get('DOKU_CLIENT_ID')||'',secret=Deno.env.get('DOKU_SECRET_KEY')||'',environment=Deno.env.get('DOKU_ENV')||'sandbox';return {clientId,secret,environment}}
function key(){
 const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
 if(modern){try{const obj=JSON.parse(modern);const item=obj?.default||Object.values(obj||{})[0];if(typeof item==='string'&&item)return item}catch{}}
 return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';
}
async function db(path:string,options:RequestInit={}){
 const base=Deno.env.get('SUPABASE_URL')||'',secret=key();
 if(!base||!secret)throw Error('SUPABASE_SERVER_NOT_CONFIGURED');
 const h=new Headers(options.headers||{});h.set('apikey',secret);if(!secret.startsWith('sb_secret_'))h.set('Authorization','Bearer '+secret);
 h.set('Accept','application/json');if(options.body!==undefined)h.set('Content-Type','application/json');
 const r=await fetch(base+'/rest/v1/'+path,{...options,headers:h});
 const raw=await r.text();let data:any;try{data=JSON.parse(raw)}catch{data=null}
 if(!r.ok)throw Error('Database error '+r.status);
 return data;
}
async function verify(req:Request,raw:string){
 const merchant=config(),headers=req.headers;
 const client=headers.get('client-id')||'',id=headers.get('request-id')||'',stamp=headers.get('request-timestamp')||'';
 const sig=headers.get('signature')||'';
 if(!merchant.clientId||!merchant.secret||client!==merchant.clientId||!id||id.length>128||sig.length>200||!/^HMACSHA256=[A-Za-z0-9+/]+={0,2}$/.test(sig))return false;
 const when=Date.parse(stamp);
 if(!Number.isFinite(when)||Math.abs(Date.now()-when)>72*3600000)return false;
 const target='/functions/v1/bbweb-website-doku-webhook';
 const digest=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(raw)))));
 const payload=['Client-Id:'+client,'Request-Id:'+id,'Request-Timestamp:'+stamp,'Request-Target:'+target,'Digest:'+digest].join('\n');
 let bytes:Uint8Array;
 try{bytes=Uint8Array.from(atob(sig.slice('HMACSHA256='.length)),c=>c.charCodeAt(0))}catch{return false}
 if(bytes.length!==32)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(merchant.secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,bytes,encoder.encode(payload));
}
async function notifyWebsiteEmail(orderId:string){
 if(!Deno.env.get('HOSTINGER_MAIL_API_TOKEN'))return;
 const root=Deno.env.get('SUPABASE_URL')||'',secret=key();
 if(!root||!secret)return;
 try{
  await fetch(root+'/functions/v1/bbweb-website-email',{method:'POST',
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},
   body:JSON.stringify({order_id:orderId}),signal:AbortSignal.timeout(9000)});
 }catch(error){console.error('Website payment email queued; worker unavailable',String(error).slice(0,80));}
}
function classify(result:any){
 const status=String(result?.transaction?.status||'').toUpperCase(),type=String(result?.transaction?.type||'').toUpperCase();
 // DOKU Checkout supports retrying FAILED channels. FAILED must not close the order.
 if(status==='FAILED'||status==='TIMEOUT'||!status)return null;
 if(status==='SUCCESS'&&type==='AUTHORIZE')return 'authorized';
 if(status==='SUCCESS')return 'paid';
 if(status==='PENDING'||status==='REDIRECT')return 'pending';
 if(status==='EXPIRED')return 'expired';
 if(status==='REFUNDED')return 'refunded';
 return null;
}
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return answer({error:'Method not allowed'},405);
 const raw=await req.text();
 if(encoder.encode(raw).length>65536)return answer({error:'Body too large'},413);
 if(!await verify(req,raw))return answer({error:'Invalid DOKU signature'},401);
 let input:any;try{input=JSON.parse(raw)}catch{return answer({error:'Invalid JSON'},400)}
 const invoice=String(input?.order?.invoice_number||'');
 if(!/^BWS[A-F0-9]{23}$/.test(invoice))return answer({error:'Invalid website invoice'},400);
 const amount=Number(input?.order?.amount);
 if(!Number.isSafeInteger(amount)||amount<1||amount>999999999999)return answer({error:'Invalid order amount'},400);
 if(input?.order?.currency&&input.order.currency!=='IDR')return answer({error:'Invalid currency'},409);
 const status=classify(input);
 if(!status)return answer({message:'Notification acknowledged (no website settlement change)'});
 try{
  const rows=await db('bbweb_website_payments?select=id,order_id,merchant_order_id,amount,environment&merchant_order_id=eq.'+encodeURIComponent(invoice)+'&limit=1');
  const payment=Array.isArray(rows)?rows[0]:null;
  if(!payment)return answer({error:'Invoice not found'},404);
  if(payment.environment!==config().environment||Number(payment.amount)!==amount)return answer({error:'Payment environment or amount mismatch'},409);
  const settled=await db('rpc/bbweb_apply_website_doku_payment',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
    p_invoice:invoice,p_amount:amount,p_environment:payment.environment,p_status:status,
    p_transaction_status:String(input?.transaction?.status||'').slice(0,50),
    p_payment_type:String(input?.channel?.id||input?.service?.id||'').slice(0,100)
  })});
  if(!settled?.id)throw Error('No settlement response');
  if(status==='paid'&&payment.order_id)await notifyWebsiteEmail(payment.order_id);
  return answer({message:'Notification received'});
 }catch(error){
  console.error('Website DOKU settlement error',String(error).slice(0,140));
  return answer({error:'Notification temporarily unavailable'},500);
 }
});
