// Website services ordering, DOKU Checkout initialization, and admin API. Merchandise checkout remains isolated.
const ALLOWED_ORIGINS=new Set(['https://bisabikinweb.site','https://www.bisabikinweb.site']);
function cors(origin:string|null){
 return {'Access-Control-Allow-Origin':origin&&ALLOWED_ORIGINS.has(origin)?origin:'https://bisabikinweb.site',
 'Access-Control-Allow-Headers':'content-type,apikey,authorization',
 'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin',
 'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
}
function response(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:cors(origin)})}
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status})}
function clean(v:unknown,max=400){return String(v??'').replace(/[\x00-\x1F\x7F]/g,'').trim().slice(0,max)}
function slug(v:unknown,max=80){const s=clean(v,max);if(!/^[a-z0-9][a-z0-9-]{1,80}$/.test(s))fail('Slug tidak valid.');return s}
function url(v:unknown,max=600){const raw=clean(v,max);if(!raw)return '';try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)throw Error('invalid');return u.href}catch{return fail('URL harus menggunakan HTTPS yang valid.')}}
function features(v:unknown){return Array.isArray(v)?v.slice(0,20).map(x=>clean(x,160)).filter(Boolean):[]}
function secretKey(){
 const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
 if(modern){try{const parsed=JSON.parse(modern);const key=parsed?.default||Object.values(parsed||{})[0];if(typeof key==='string'&&key)return key}catch{}}
 return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';
}
function publicKey(){return Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||secretKey()}
async function db(path:string,options:RequestInit={}){
 const base=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!base||!key)fail('Konfigurasi backend belum tersedia.',503);
 const headers=new Headers(options.headers||{});headers.set('apikey',key);if(!key.startsWith('sb_secret_'))headers.set('Authorization','Bearer '+key);
 headers.set('Accept','application/json');if(options.body!==undefined)headers.set('Content-Type','application/json');
 const r=await fetch(base+'/rest/v1/'+path,{...options,headers});const raw=await r.text();
 let data:any;try{data=raw?JSON.parse(raw):null}catch{data=null}
 if(!r.ok){console.error('Website store database HTTP',r.status,path.split('?')[0]);fail('Data website belum bisa diproses.',503)}
 return data;
}
// Read counts using PostgREST HEAD. Never infer totals from a truncated list.
async function countWebsiteOrders(filter=''){
 const base=Deno.env.get('SUPABASE_URL')||'', key=secretKey();if(!base||!key)fail('Konfigurasi backend belum tersedia.',503);
 const headers=new Headers({apikey:key,Prefer:'count=exact',Accept:'application/json'});
 if(!key.startsWith('sb_secret_'))headers.set('Authorization','Bearer '+key);
 const response=await fetch(base+'/rest/v1/bbweb_website_orders?select=id&limit=1'+filter,{method:'HEAD',headers});
 if(!response.ok)fail('Statistik pesanan tidak tersedia.',503);
 const raw=response.headers.get('content-range')||'';
 const count=/\/(\d+)$/.exec(raw);
 if(!count)fail('Total pesanan tidak tersedia.',503);
 return Number(count[1]);
}
function dokuSettings(){
 const clientId=Deno.env.get('DOKU_CLIENT_ID')||'',secret=Deno.env.get('DOKU_SECRET_KEY')||'';
 const environment=Deno.env.get('DOKU_ENV')||'sandbox';
 if(environment!=='sandbox'&&environment!=='production')fail('Konfigurasi lingkungan DOKU tidak valid.',503);
 return {clientId,secret,environment,base:environment==='production'?'https://api.doku.com':'https://api-sandbox.doku.com'};
}
function dokuPaymentUrl(value:unknown,environment:string){
 try{const u=new URL(String(value||''));const hosts=environment==='production'?['checkout.doku.com','jokul.doku.com']:['sandbox.doku.com'];
 return u.protocol==='https:'&&hosts.includes(u.hostname)&&!u.username&&!u.password?u.href:''}catch{return ''}
}
async function requestDokuCheckout(data:unknown){
 const settings=dokuSettings();
 if(!settings.clientId||!settings.secret)fail('DOKU belum dikonfigurasi pada server. Hubungi admin.',503);
 const path='/checkout/v1/payment',body=JSON.stringify(data),requestId=crypto.randomUUID(),timestamp=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 const encoder=new TextEncoder(),digest=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(body)))));
 const textToSign=['Client-Id:'+settings.clientId,'Request-Id:'+requestId,'Request-Timestamp:'+timestamp,'Request-Target:'+path,'Digest:'+digest].join('\n');
 const key=await crypto.subtle.importKey('raw',encoder.encode(settings.secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature='HMACSHA256='+btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(textToSign)))));
 return fetch(settings.base+path,{method:'POST',headers:{'Client-Id':settings.clientId,'Request-Id':requestId,'Request-Timestamp':timestamp,'Signature':signature,'Accept':'application/json','Content-Type':'application/json'},body,signal:AbortSignal.timeout(12000)});
}
async function rpc(name:string,payload:unknown){return db('rpc/'+name,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)})}
function phoneForDoku(raw:string){const d=raw.replace(/\D/g,'');return d.startsWith('0')?'62'+d.slice(1):d}
async function authenticate(req:Request){
 const bearer=req.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/i.test(bearer))fail('Silakan login terlebih dahulu.',401);
 const base=Deno.env.get('SUPABASE_URL')||'';
 const r=await fetch(base+'/auth/v1/user',{headers:{apikey:publicKey(),Authorization:bearer,Accept:'application/json'}});
 const user:any=await r.json().catch(()=>null);
 if(!r.ok||!user?.id||!user?.email)fail('Sesi akun tidak valid.',401);
 if(!(user.email_confirmed_at||user.confirmed_at))fail('Konfirmasi email akun terlebih dahulu.',403);
 return user;
}
async function isAdmin(user:any){
 const email=String(user.email||'').trim().toLowerCase();
 const rows=await db('bbweb_admin_allowlist?select=email&email=eq.'+encodeURIComponent(email)+'&limit=1');
 return Array.isArray(rows)&&rows[0]?.email===email;
}
const allowedStatuses=new Set(['requested','reviewing','proposal','awaiting_payment','in_progress','client_review','revision','completed','cancelled']);
const allowedDomainStatuses=new Set(['unchecked','manual_review','available','unavailable','registered']);
const builtInConcepts=new Set(['studio-umkm','corporate-grid','shop-essentials','global-trade','tour-story','cafe-menu','atelier','campus-info']);
const instantCheckoutPackages=new Set(['starter','business','commerce']);
const categories=new Set(['umkm','company-profile','toko-online','ekspor','travel','restoran','fashion','pendidikan']);
async function notifyWebsiteEmail(orderId:string){
 // No consumer data or email credentials enter the browser.
 if(!Deno.env.get('HOSTINGER_MAIL_API_TOKEN'))return;
 const root=Deno.env.get('SUPABASE_URL')||'',secret=secretKey();
 if(!root||!secret)return;
 try{
  await fetch(root+'/functions/v1/bbweb-website-email',{method:'POST',
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},
   body:JSON.stringify({order_id:orderId}),signal:AbortSignal.timeout(9000)});
 }catch(error){console.error('Website order email queued; worker unavailable',String(error).slice(0,80));}
}
function requireAdmin(admin:boolean){if(!admin)fail('Akses admin diperlukan.',403)}
function shortHex(bytes=6){return Array.from(crypto.getRandomValues(new Uint8Array(bytes))).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function bodyObject(x:any){return x&&typeof x==='object'&&!Array.isArray(x)?x:fail('Body tidak valid.')}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='POST')return response({error:'Method tidak diizinkan.'},405,origin);
 if(origin&&!ALLOWED_ORIGINS.has(origin))return response({error:'Origin tidak diizinkan.'},403,origin);
 try{
  const input:any=bodyObject(await req.json().catch(()=>null));
  const action=clean(input.action,50);
  const user=await authenticate(req);
  if(action==='create_order'){
   const packageSlug=slug(input.package_slug),templateSlug=input.template_slug?slug(input.template_slug):null;
   const found=await db('bbweb_website_packages?select=slug,base_price,is_active&slug=eq.'+encodeURIComponent(packageSlug)+'&is_active=eq.true&limit=1');
   const pack=Array.isArray(found)?found[0]:null;
   if(!pack)fail('Paket website belum tersedia.');
   // Only predefined standard packages can skip quotation. Server catalog price is the sole payment amount.
   const listedPrice=pack.base_price==null?null:Number(pack.base_price);
   const directCheckout=input.checkout_mode==='instant';
   if(directCheckout){
    if(!instantCheckoutPackages.has(packageSlug)||!Number.isSafeInteger(listedPrice)||listedPrice===null||listedPrice<1||listedPrice>999999999999)
     fail('Paket ini membutuhkan penawaran manual sebelum pembayaran.',409);
    if(Number(input.expected_base_price)!==listedPrice)
     fail('Harga paket berubah. Muat ulang halaman dan periksa nominal sebelum pembayaran.',409);
   }
   if(templateSlug&&!builtInConcepts.has(templateSlug)){
    const rows=await db('bbweb_website_templates?select=slug&slug=eq.'+encodeURIComponent(templateSlug)+'&is_active=eq.true&limit=1');
    if(!Array.isArray(rows)||!rows[0])fail('Desain yang dipilih belum tersedia.');
   }
   const name=clean(input.full_name,120),phone=clean(input.phone,32),company=clean(input.company,160);
   const brief=clean(input.brief,3500),domain=clean(input.domain,253).toLowerCase(),category=clean(input.category,80);
   const reference=input.reference_url?url(input.reference_url,500):'';
   if(name.length<2||company.length<2||!/^\+?[0-9()\s.-]{7,32}$/.test(phone)||brief.length<20)fail('Lengkapi nama, nomor kontak, bisnis, dan brief minimal 20 karakter.');
   if(!categories.has(category))fail('Kategori bisnis tidak valid.');
   if(domain&&!/^(?=.{4,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain))fail('Format domain yang diminta belum valid.');
   const since=new Date(Date.now()-60*60*1000).toISOString();
   const existing=await db('bbweb_website_orders?select=id&user_id=eq.'+encodeURIComponent(user.id)+'&created_at=gte.'+encodeURIComponent(since)+'&limit=4');
   if(Array.isArray(existing)&&existing.length>=3)fail('Maksimal tiga permintaan website per jam. Coba lagi nanti.',429);
   const now=new Date().toISOString();
   const orderNo='BW-'+shortHex();
   const payload={order_no:orderNo,user_id:user.id,package_slug:packageSlug,template_slug:templateSlug,
    category,full_name:name,email:String(user.email).toLowerCase(),phone,company,requested_domain:domain,
    reference_url:reference,brief,base_price_snapshot:pack.base_price,
    quoted_total:directCheckout?listedPrice:null,status:directCheckout?'awaiting_payment':'requested',
    domain_status:domain?'manual_review':'unchecked',payment_status:'not_invoiced',updated_at:now};
   const inserted=await db('bbweb_website_orders',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
   const order=Array.isArray(inserted)?inserted[0]:null;if(!order)fail('Permintaan belum tersimpan.',503);
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({order_id:order.id,actor_user_id:user.id,event_type:'requested',
    note:directCheckout?'Paket standar siap dibayar. Biaya domain/hosting dan add-on belum termasuk; domain masih perlu pemeriksaan.':'Brief custom diterima untuk penawaran.'})}).catch(()=>{});
   await notifyWebsiteEmail(order.id);
   return response({order:{id:order.id,order_no:orderNo,status:payload.status,payment_status:'not_invoiced',
    quoted_total:payload.quoted_total,checkout_ready:directCheckout}},200,origin);
  }
  if(action==='my_orders'){
   const orders=await db('bbweb_website_orders?select=id,order_no,full_name,email,phone,company,category,package_slug,template_slug,requested_domain,domain_status,quoted_total,status,payment_status,created_at,updated_at&user_id=eq.'+encodeURIComponent(user.id)+'&order=created_at.desc&limit=100');
   const list=Array.isArray(orders)?orders:[];
   if(!list.length)return response({orders:[]},200,origin);
   const ids=list.map((o:any)=>o.id).filter(Boolean);
   const [events,payments]=await Promise.all([
    db('bbweb_website_order_events?select=order_id,event_type,note,created_at&order_id=in.('+ids.join(',')+')&order=created_at.asc&limit=500'),
    db('bbweb_website_payments?select=order_id,merchant_order_id,amount,environment,status,redirect_url,paid_at&order_id=in.('+ids.join(',')+')')
   ]);
   const byOrder=new Map<string,any[]>(),byPayment=new Map<string,any>();
   if(Array.isArray(events))for(const ev of events){if(!byOrder.has(ev.order_id))byOrder.set(ev.order_id,[]);byOrder.get(ev.order_id)?.push(ev);}
   if(Array.isArray(payments))for(const payment of payments)byPayment.set(payment.order_id,payment);
   return response({orders:list.map((o:any)=>({...o,events:byOrder.get(o.id)||[],payment:byPayment.get(o.id)||null}))},200,origin);
  }
  if(action==='approve_quote'){
   const id=clean(input.id,40),expectedTotal=Number(input.expected_total);
   if(!/^[a-f0-9-]{36}$/i.test(id))fail('Nomor pesanan tidak valid.');
   if(!Number.isSafeInteger(expectedTotal)||expectedTotal<1||expectedTotal>999999999999)fail('Harga penawaran tidak valid.');
   // Match the owner's current quoted amount, not an amount submitted by the browser.
   const rows=await db('bbweb_website_orders?select=id,status,payment_status,quoted_total,domain_status,requested_domain&user_id=eq.'+encodeURIComponent(user.id)+'&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const order=Array.isArray(rows)?rows[0]:null;
   if(!order)fail('Pesanan tidak ditemukan.',404);
   if(order.status!=='proposal'||order.payment_status!=='not_invoiced')fail('Penawaran sudah berubah atau belum tersedia.',409);
   if(Number(order.quoted_total)!==expectedTotal)fail('Nominal penawaran diperbarui. Muat ulang untuk meninjau harga terbaru.',409);
   if(order.requested_domain&&!['available','registered'].includes(order.domain_status))fail('Domain belum disetujui admin. Tunggu pemeriksaan domain.',409);
   const updated=await db('bbweb_website_orders?id=eq.'+encodeURIComponent(id)+
    '&user_id=eq.'+encodeURIComponent(user.id)+'&status=eq.proposal&payment_status=eq.not_invoiced&quoted_total=eq.'+expectedTotal,
    {method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'awaiting_payment',updated_at:new Date().toISOString()})});
   if(!Array.isArray(updated)||!updated[0])fail('Penawaran berubah. Perbarui halaman dan periksa kembali.',409);
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},
    body:JSON.stringify({order_id:id,actor_user_id:user.id,event_type:'quote_approved',note:'Klien menyetujui harga final '+expectedTotal+' IDR dan melanjutkan ke pembayaran.'})}).catch(()=>{});
   return response({order:{id,status:'awaiting_payment',quoted_total:expectedTotal}},200,origin);
  }
  if(action==='create_payment'){
   const id=clean(input.id,40);
   if(!/^[a-f0-9-]{36}$/i.test(id))fail('ID pesanan tidak valid.');
   const settings=dokuSettings();
   if(!settings.clientId||!settings.secret)fail('Pembayaran DOKU belum aktif di server. Hubungi admin.',503);
   const rows=await db('bbweb_website_orders?select=id,order_no,user_id,full_name,email,phone,company,package_slug,quoted_total,status,payment_status&id=eq.'+encodeURIComponent(id)+'&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
   const order=Array.isArray(rows)?rows[0]:null;
   if(!order)fail('Pesanan tidak ditemukan atau bukan milik akun ini.',404);
   if(order.status!=='awaiting_payment'||order.payment_status==='paid'||!Number.isSafeInteger(Number(order.quoted_total))||Number(order.quoted_total)<1)fail('Pesanan belum siap dibayar atau sudah lunas.',409);
   const invoice='BWS'+String(order.id).replaceAll('-','').slice(0,23).toUpperCase();
   const claim=await rpc('bbweb_claim_website_doku_payment',{p_order_id:order.id,p_invoice:invoice,p_environment:settings.environment});
   const payment=claim?.payment;
   if(!payment?.id||!Number.isSafeInteger(Number(payment.amount)))fail('Invoice website belum bisa dibuat.',503);
   if(claim.claimed!==true){
    const priorUrl=dokuPaymentUrl(payment.redirect_url,settings.environment);
    if(priorUrl&&payment.status==='pending')return response({redirect_url:priorUrl,invoice,amount:payment.amount,environment:settings.environment,status:'pending'},200,origin);
    fail('Invoice sebelumnya masih perlu pemeriksaan admin. Jangan membuat pembayaran ganda.',409);
   }
   const callback='https://bisabikinweb.site/client/dashboard/?consult='+encodeURIComponent(order.id);
   const notification=(Deno.env.get('SUPABASE_URL')||'')+'/functions/v1/bbweb-website-doku-webhook';
   const body={
    order:{invoice_number:invoice,amount:Number(payment.amount),currency:'IDR',callback_url:callback,callback_url_cancel:callback,callback_url_result:callback,auto_redirect:true,disable_retry_payment:true,
      line_items:[{name:'Jasa website - '+clean(order.package_slug,70),price:Number(payment.amount),quantity:1}]},
    payment:{payment_due_date:60,type:'SALE'},
    customer:{name:clean(order.full_name,120),email:clean(order.email,254),phone:phoneForDoku(clean(order.phone,40))},
    additional_info:{override_notification_url:notification}
   };
   let dokuResponse:Response;
   try{dokuResponse=await requestDokuCheckout(body)}catch(e){console.error('Website DOKU checkout transport failure',String(e).slice(0,100));
     await db('bbweb_website_payments?id=eq.'+payment.id+'&status=eq.created',{method:'PATCH',body:JSON.stringify({status:'unknown',updated_at:new Date().toISOString()})}).catch(()=>{});
     fail('Koneksi DOKU tidak pasti. Invoice sudah dicadangkan; hubungi admin sebelum mencoba ulang.',502);
   }
   const answer=await dokuResponse.json().catch(()=>null);
   const redirect=dokuPaymentUrl(answer?.response?.payment?.url,settings.environment);
   if(!dokuResponse.ok||!redirect){
    await db('bbweb_website_payments?id=eq.'+payment.id+'&status=eq.created',{method:'PATCH',body:JSON.stringify({status:'unknown',updated_at:new Date().toISOString()})}).catch(()=>{});
    fail('DOKU belum memberikan tautan pembayaran yang valid. Hubungi admin.',502);
   }
   await db('bbweb_website_payments?id=eq.'+payment.id+'&status=eq.created',{method:'PATCH',body:JSON.stringify({status:'pending',redirect_url:redirect,transaction_status:'PENDING',updated_at:new Date().toISOString()})});
   await db('bbweb_website_orders?id=eq.'+order.id+'&payment_status=eq.not_invoiced',{method:'PATCH',body:JSON.stringify({payment_status:'pending',updated_at:new Date().toISOString()})});
   return response({redirect_url:redirect,invoice,amount:payment.amount,environment:settings.environment,status:'pending'},200,origin);
  }
  if(action==='request_revision'){
   const id=clean(input.id,40);
   if(!/^[a-f0-9-]{36}$/i.test(id))fail('Nomor permintaan tidak valid.');
   const note=clean(input.note,1200);
   if(note.length<10)fail('Jelaskan revisi minimal 10 karakter.');
   const rows=await db('bbweb_website_orders?select=id,status&user_id=eq.'+encodeURIComponent(user.id)+'&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const existing=Array.isArray(rows)?rows[0]:null;
   if(!existing)fail('Proyek tidak ditemukan.',404);
   if(existing.status!=='client_review')fail('Revisi hanya dapat diajukan saat status Review Klien.');
   const since=new Date(Date.now()-24*60*60*1000).toISOString();
   const recent=await db('bbweb_website_order_events?select=id&order_id=eq.'+encodeURIComponent(id)+'&event_type=eq.revision&created_at=gte.'+encodeURIComponent(since)+'&limit=8');
   if(Array.isArray(recent)&&recent.length>=5)fail('Batas permintaan revisi harian tercapai.',429);
   const updated=await db('bbweb_website_orders?id=eq.'+encodeURIComponent(id)+'&status=eq.client_review',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'revision',updated_at:new Date().toISOString()})});
   if(!Array.isArray(updated)||!updated[0])fail('Status proyek berubah. Perbarui halaman untuk mencoba lagi.',409);
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({order_id:id,actor_user_id:user.id,event_type:'revision',note})});
   return response({ok:true},200,origin);
  }
  const admin=await isAdmin(user);
  requireAdmin(admin);
  if(action==='admin_doku_config'){
   const settings=dokuSettings();
   return response({configured:Boolean(settings.clientId&&settings.secret),environment:settings.environment,webhook_url:(Deno.env.get('SUPABASE_URL')||'')+'/functions/v1/bbweb-website-doku-webhook'},200,origin);
  }
  if(action==='admin_summary'){
   const [total,pending,custom]=await Promise.all([
    countWebsiteOrders(),
    countWebsiteOrders('&status=in.(requested,reviewing,proposal)'),
    countWebsiteOrders('&package_slug=eq.custom')
   ]);
   return response({total,pending,custom},200,origin);
  }
  if(action==='admin_list'){
   const offset=Number(input.offset??0);
   if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)fail('Offset tidak valid.');
   const pageSize=100;
   const [orders,templates,packages,total]=await Promise.all([
    db('bbweb_website_orders?select=*&order=created_at.desc&limit='+pageSize+'&offset='+offset),
    offset===0?db('bbweb_website_templates?select=*&order=sort_order.asc&limit=500'):Promise.resolve([]),
    offset===0?db('bbweb_website_packages?select=*&order=sort_order.asc&limit=100'):Promise.resolve([]),
    countWebsiteOrders()
   ]);
   const rows=Array.isArray(orders)?orders:[];
   const ids=rows.map((o:any)=>o.id).filter(Boolean);
   const payments=ids.length?await db('bbweb_website_payments?select=order_id,merchant_order_id,amount,status,environment,transaction_status,payment_type,paid_at,created_at&order_id=in.('+ids.join(',')+')'): [];
   const paymentByOrder=new Map<string,any>();
   if(Array.isArray(payments))for(const payment of payments)paymentByOrder.set(payment.order_id,payment);
   return response({orders:rows.map((o:any)=>({...o,payment:paymentByOrder.get(o.id)||null})),templates:templates||[],packages:packages||[],total_orders:total,
    next_offset:offset+rows.length<total?offset+rows.length:null},200,origin);
  }
  if(action==='admin_save_template'){
   const item=bodyObject(input.item);
   const s=slug(item.slug),title=clean(item.title,180),category=clean(item.category,80);
   if(title.length<3||!categories.has(category))fail('Nama desain atau kategori tidak valid.');
   const payload={slug:s,title,category,description:clean(item.description,2000),features:features(item.features),
    image_url:url(item.image_url),demo_url:url(item.demo_url),sort_order:Number.isInteger(Number(item.sort_order))?Number(item.sort_order):100,
    is_active:item.is_active===true,updated_at:new Date().toISOString()};
   const rows=await db('bbweb_website_templates?on_conflict=slug',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
   return response({template:rows?.[0]||payload},200,origin);
  }
  if(action==='admin_save_package'){
   const item=bodyObject(input.item),s=slug(item.slug),name=clean(item.name,160);
   if(name.length<2)fail('Nama paket wajib diisi.');
   const price=item.base_price==null||item.base_price===''?null:Number(item.base_price);
   if(price!==null&&(!Number.isSafeInteger(price)||price<0||price>100000000000))fail('Harga paket tidak valid.');
   const payload={slug:s,name,description:clean(item.description,2000),features:features(item.features),
    base_price:price,sort_order:Number.isInteger(Number(item.sort_order))?Number(item.sort_order):100,
    is_active:item.is_active===true,updated_at:new Date().toISOString()};
   const rows=await db('bbweb_website_packages?on_conflict=slug',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
   return response({package:rows?.[0]||payload},200,origin);
  }
  if(action==='admin_update_order'){
   const id=clean(input.id,40);if(!/^[a-f0-9-]{36}$/i.test(id))fail('ID order tidak valid.');
   const next=clean(input.status,40),domainStatus=clean(input.domain_status,40);
   if(!allowedStatuses.has(next)||!allowedDomainStatuses.has(domainStatus))fail('Status tidak valid.');
   const total=input.quoted_total==null||input.quoted_total===''?null:Number(input.quoted_total);
   if(total!==null&&(!Number.isSafeInteger(total)||total<0||total>100000000000))fail('Nilai penawaran tidak valid.');
   const oldRows=await db('bbweb_website_orders?select=id,status,payment_status,quoted_total&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const current=Array.isArray(oldRows)?oldRows[0]:null;if(!current)fail('Order tidak ditemukan.',404);
   if(next==='proposal'&&(!Number.isSafeInteger(total)||total===null||total<1))fail('Penawaran harus mencantumkan nominal final sebelum dikirim.');
   if(['awaiting_payment','in_progress','client_review','revision','completed'].includes(current.status)&&total!==Number(current.quoted_total))fail('Harga yang sudah disetujui klien tidak dapat diubah. Buat penawaran baru melalui proses resmi.',409);
   if(next==='awaiting_payment'&&current.status!=='awaiting_payment')fail('Hanya pelanggan yang dapat menyetujui penawaran sebelum pembayaran.',409);
   if(current.status==='awaiting_payment'&&current.payment_status!=='paid'&&next!=='awaiting_payment')fail('Status pesanan yang menunggu pembayaran tidak dapat diubah sebelum konfirmasi DOKU.',409);
   // Payment status is never changed here; only a verified payment provider may mark a payment paid.
   const note=clean(input.note,2000);
   const payload={status:next,domain_status:domainStatus,quoted_total:total,updated_at:new Date().toISOString()};
   const rows=await db('bbweb_website_orders?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({order_id:id,actor_user_id:user.id,event_type:next,note})}).catch(()=>{});
   if(next==='proposal'&&current.status!=='proposal')await notifyWebsiteEmail(id);
   return response({order:rows?.[0]||payload},200,origin);
  }
  return response({error:'Aksi tidak dikenali.'},400,origin);
 }catch(e:any){
  const status=Number(e?.status)||500;
  if(status>=500)console.error('Website store server error:',String(e?.message||'unknown').slice(0,200));
  return response({error:status>=500?'Layanan website belum dapat memproses permintaan.':String(e?.message||'Permintaan tidak valid.')},status,origin);
 }
});
