// Website services ordering API. Does not create payments or modify merchandise checkout.
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
const categories=new Set(['umkm','company-profile','toko-online','ekspor','travel','restoran','fashion','pendidikan']);
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
    reference_url:reference,brief,base_price_snapshot:pack.base_price,status:'requested',
    domain_status:domain?'manual_review':'unchecked',payment_status:'not_invoiced',updated_at:now};
   const inserted=await db('bbweb_website_orders',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
   const order=Array.isArray(inserted)?inserted[0]:null;if(!order)fail('Permintaan belum tersimpan.',503);
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({order_id:order.id,actor_user_id:user.id,event_type:'requested',note:'Brief pesanan website diterima.'})}).catch(()=>{});
   return response({order:{id:order.id,order_no:orderNo,status:'requested',payment_status:'not_invoiced'}},200,origin);
  }
  if(action==='my_orders'){
   const orders=await db('bbweb_website_orders?select=id,order_no,package_slug,template_slug,company,requested_domain,domain_status,quoted_total,status,payment_status,created_at,updated_at&user_id=eq.'+encodeURIComponent(user.id)+'&order=created_at.desc&limit=100');
   const list=Array.isArray(orders)?orders:[];
   if(!list.length)return response({orders:[]},200,origin);
   const ids=list.map((o:any)=>o.id).filter(Boolean);
   const events=await db('bbweb_website_order_events?select=order_id,event_type,note,created_at&order_id=in.('+ids.join(',')+')&order=created_at.asc&limit=500');
   const byOrder=new Map<string,any[]>();
   if(Array.isArray(events))for(const ev of events){if(!byOrder.has(ev.order_id))byOrder.set(ev.order_id,[]);byOrder.get(ev.order_id)?.push(ev);}
   return response({orders:list.map((o:any)=>({...o,events:byOrder.get(o.id)||[]}))},200,origin);
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
  if(action==='admin_list'){
   const [orders,templates,packages]=await Promise.all([
    db('bbweb_website_orders?select=*&order=created_at.desc&limit=200'),
    db('bbweb_website_templates?select=*&order=sort_order.asc&limit=300'),
    db('bbweb_website_packages?select=*&order=sort_order.asc&limit=100')
   ]);
   return response({orders:orders||[],templates:templates||[],packages:packages||[]},200,origin);
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
   const oldRows=await db('bbweb_website_orders?select=id,status,payment_status&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const current=Array.isArray(oldRows)?oldRows[0]:null;if(!current)fail('Order tidak ditemukan.',404);
   // Payment status is never changed here; only a verified payment provider may mark a payment paid.
   const note=clean(input.note,2000);
   const payload={status:next,domain_status:domainStatus,quoted_total:total,updated_at:new Date().toISOString()};
   const rows=await db('bbweb_website_orders?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
   await db('bbweb_website_order_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({order_id:id,actor_user_id:user.id,event_type:next,note})}).catch(()=>{});
   return response({order:rows?.[0]||payload},200,origin);
  }
  return response({error:'Aksi tidak dikenali.'},400,origin);
 }catch(e:any){
  const status=Number(e?.status)||500;
  if(status>=500)console.error('Website store server error:',String(e?.message||'unknown').slice(0,200));
  return response({error:status>=500?'Layanan website belum dapat memproses permintaan.':String(e?.message||'Permintaan tidak valid.')},status,origin);
 }
});
