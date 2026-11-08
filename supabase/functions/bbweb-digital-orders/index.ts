// BisaBikinWeb Digital Services: request intake and read-only order lists.
// No payment initiation or supplier fulfillment is performed here.
const ALLOWED_ORIGINS=new Set(['https://bisabikinweb.site','https://www.bisabikinweb.site']);
function headers(origin:string|null){return {'Access-Control-Allow-Origin':origin&&ALLOWED_ORIGINS.has(origin)?origin:'https://bisabikinweb.site','Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}}
function reply(value:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(value),{status,headers:headers(origin)})}
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status})}
function clean(value:unknown,max=180){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max)}
function secretKey(){const v=Deno.env.get('SUPABASE_SECRET_KEYS');if(v){try{const obj=JSON.parse(v);const key=obj?.default||Object.values(obj||{})[0];if(typeof key==='string'&&key)return key}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function publicKey(){return Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||secretKey()}
async function db(path:string,opts:RequestInit={}){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)fail('Konfigurasi sistem belum siap.',503);const h=new Headers(opts.headers||{});h.set('apikey',key);if(!key.startsWith('sb_secret_'))h.set('Authorization','Bearer '+key);h.set('Accept','application/json');if(opts.body!==undefined)h.set('Content-Type','application/json');const r=await fetch(url+'/rest/v1/'+path,{...opts,headers:h});const raw=await r.text();let data:any=null;try{data=raw?JSON.parse(raw):null}catch{}if(!r.ok){console.error('Digital services DB failed',r.status,path.split('?')[0]);fail('Permintaan belum dapat diproses.',503)}return data}
async function authorize(req:Request){const bearer=req.headers.get('authorization')||'';if(!/^Bearer\s+\S+$/i.test(bearer))fail('Silakan login terlebih dahulu.',401);const base=Deno.env.get('SUPABASE_URL')||'',r=await fetch(base+'/auth/v1/user',{headers:{apikey:publicKey(),Authorization:bearer,Accept:'application/json'}});const u:any=await r.json().catch(()=>null);if(!r.ok||!u?.id||!u?.email)fail('Sesi tidak valid. Silakan login kembali.',401);if(!(u.email_confirmed_at||u.confirmed_at))fail('Verifikasi email akun lebih dahulu.',403);return u}
async function isAdmin(user:any){const email=String(user.email||'').toLowerCase();const rows=await db('bbweb_admin_allowlist?select=email&email=eq.'+encodeURIComponent(email)+'&limit=1');return Array.isArray(rows)&&rows[0]?.email===email}
const services=new Set(['game','pulsa','data','pln','voucher']);
function randomOrderNo(){const bytes=crypto.getRandomValues(new Uint8Array(8));return 'BD-'+Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
Deno.serve(async(req:Request)=>{const origin=req.headers.get('origin');if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});if(req.method!=='POST')return reply({error:'Method tidak diizinkan.'},405,origin);if(origin&&!ALLOWED_ORIGINS.has(origin))return reply({error:'Origin tidak diizinkan.'},403,origin);if(Number(req.headers.get('content-length')||0)>8192)return reply({error:'Form terlalu besar.'},413,origin);
 try{
  const input:any=await req.json().catch(()=>null);if(!input||typeof input!=='object'||Array.isArray(input))fail('Data form tidak valid.');
  const action=clean(input.action,32),user=await authorize(req);
  if(action==='create_order'){
    if(input.accepted_terms!==true)fail('Setujui syarat dan kebijakan privasi terlebih dahulu.');
    const service=clean(input.service,20),product=clean(input.product_name,180),target=clean(input.target_primary,100),extra=clean(input.target_secondary,100),name=clean(input.buyer_name,120),phone=clean(input.buyer_phone,32),note=clean(input.note,500);
    const key=clean(input.idempotency_key,50);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))fail('Token form tidak valid. Muat ulang dan coba lagi.');
    if(!services.has(service)||product.length<2||target.length<4||name.length<2||!/^(?:\+62|62|0)[0-9]{8,13}$/.test(phone.replace(/[\s-]/g,'')))fail('Lengkapi formulir dengan data yang valid.');
    if(['pulsa','data'].includes(service)&&!/^(?:\+62|62|0)[0-9]{8,13}$/.test(target))fail('Nomor tujuan pulsa/data tidak valid.');
    if(service==='pln'&&!/^[0-9]{10,13}$/.test(target))fail('Nomor meter atau ID pelanggan PLN harus 10–13 digit.');
    if(service==='game'&&!/^[a-zA-Z0-9._-]{4,60}$/.test(target))fail('User ID game tidak valid.');
    if(service==='voucher'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)&&!/^(?:\+62|62|0)[0-9]{8,13}$/.test(target))fail('Masukkan email atau nomor tujuan voucher yang valid.');
    const existing=await db('bbweb_digital_orders?select=id,order_no,status&user_id=eq.'+encodeURIComponent(user.id)+'&idempotency_key=eq.'+key+'&limit=1');
    if(Array.isArray(existing)&&existing[0])return reply({order:existing[0],duplicate:true},200,origin);
    const from=new Date(Date.now()-60*60*1000).toISOString();
    const recent=await db('bbweb_digital_orders?select=id&user_id=eq.'+encodeURIComponent(user.id)+'&created_at=gte.'+encodeURIComponent(from)+'&limit=4');
    if(Array.isArray(recent)&&recent.length>=3)fail('Maksimal 3 permintaan dalam satu jam. Coba lagi nanti.',429);
    const payload={order_no:randomOrderNo(),idempotency_key:key,user_id:user.id,service,product_name:product,target_primary:target,target_secondary:extra,buyer_name:name,buyer_email:String(user.email).toLowerCase(),buyer_phone:phone.replace(/[\s-]/g,''),note,status:'requested',payment_status:'not_invoiced'};
    const inserted=await db('bbweb_digital_orders',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!Array.isArray(inserted)||!inserted[0])fail('Permintaan gagal disimpan.',503);
    return reply({order:{id:inserted[0].id,order_no:inserted[0].order_no,status:'requested',payment_status:'not_invoiced'}},200,origin)
  }
  if(action==='my_orders'){const list=await db('bbweb_digital_orders?select=order_no,service,product_name,status,payment_status,created_at&user_id=eq.'+encodeURIComponent(user.id)+'&order=created_at.desc&limit=50');return reply({orders:Array.isArray(list)?list:[]},200,origin)}
  if(action==='admin_list'){if(!await isAdmin(user))fail('Hanya admin yang dapat melihat pesanan.',403);const list=await db('bbweb_digital_orders?select=id,order_no,service,product_name,target_primary,target_secondary,buyer_name,buyer_email,buyer_phone,note,status,payment_status,created_at&order=created_at.desc&limit=200');return reply({orders:Array.isArray(list)?list:[]},200,origin)}
  fail('Perintah tidak ditemukan.',404);
 }catch(error){const status=Number((error as any)?.status)||500;return reply({error:status===500?'Server belum dapat memproses permintaan.':String((error as Error).message)},status,origin)}
});
