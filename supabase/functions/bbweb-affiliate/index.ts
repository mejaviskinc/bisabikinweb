// BisaBikinWeb Affiliate Partner API
// All reads/writes use a service credential server-side. End users must authenticate.
const origins=new Set(['https://bisabikinweb.site','https://www.bisabikinweb.site']);
function cors(origin:string|null){return {'Access-Control-Allow-Origin':origin&&origins.has(origin)?origin:'https://bisabikinweb.site','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type,apikey,authorization','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};}
function output(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:cors(origin)});}
function err(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
function clean(value:unknown,max:number){return String(value??'').replace(/[\x00-\x1F\x7F]/g,'').trim().slice(0,max);}
function uuid(v:unknown){const s=clean(v,50);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s))err('ID tidak valid.');return s;}
function secret(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const keys=JSON.parse(modern);const s=keys.default||Object.values(keys)[0];if(typeof s==='string'&&s)return s;}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';}
function publishable(){return Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||Deno.env.get('SUPABASE_ANON_KEY')||secret();}
async function db(path:string,opts:RequestInit={}){
 const base=Deno.env.get('SUPABASE_URL')||'',key=secret();if(!base||!key)err('Konfigurasi backend belum siap.',503);
 const headers=new Headers(opts.headers);headers.set('apikey',key);if(!key.startsWith('sb_secret_'))headers.set('Authorization','Bearer '+key);headers.set('Accept','application/json');
 if(opts.body!==undefined)headers.set('Content-Type','application/json');
 const r=await fetch(base+'/rest/v1/'+path,{...opts,headers});
 const body=await r.text();let data:any;try{data=body?JSON.parse(body):null;}catch{data=null;}
 if(!r.ok){console.error('Affiliate DB request failed',r.status,path.split('?')[0]);err('Penyimpanan data belum tersedia.',503);}
 return data;
}
async function authenticate(req:Request){
 const auth=req.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/i.test(auth))err('Masuk ke akun BisaBikinWeb terlebih dahulu.',401);
 const root=Deno.env.get('SUPABASE_URL')||'';
 const r=await fetch(root+'/auth/v1/user',{headers:{apikey:publishable(),Authorization:auth,Accept:'application/json'}});
 const user:any=await r.json().catch(()=>null);
 if(!r.ok||!user?.id||!user?.email)err('Sesi login sudah tidak valid.',401);
 if(!(user.email_confirmed_at||user.confirmed_at))err('Verifikasi email akun terlebih dahulu.',403);
 return user;
}
async function requireAdmin(user:any){
 const email=String(user.email||'').trim().toLowerCase();
 const rows=await db('bbweb_admin_allowlist?select=email&email=eq.'+encodeURIComponent(email)+'&limit=1');
 if(!Array.isArray(rows)||!rows[0])err('Hanya admin resmi yang memiliki akses.',403);
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='POST')return output({error:'Metode tidak didukung.'},405,origin);
 if(origin&&!origins.has(origin))return output({error:'Origin tidak diizinkan.'},403,origin);
 try{
  const body:any=await req.json();if(!body||typeof body!=='object'||Array.isArray(body))err('Data tidak valid.');
  const action=clean(body.action,40),user=await authenticate(req);
  if(action==='apply'){
    const display_name=clean(body.display_name,120),whatsapp=clean(body.whatsapp,32),promotion_channel=clean(body.promotion_channel,120);
    if(display_name.length<2||!/^\+?[0-9() .-]{7,32}$/.test(whatsapp)||promotion_channel.length<2)err('Lengkapi nama, WhatsApp, dan media promosi dengan benar.');
    if(body.accepted_terms!==true)err('Setujui ketentuan program terlebih dahulu.');
    const prior=await db('bbweb_affiliates?select=id,status&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
    if(prior?.length)return output({ok:true,status:prior[0].status,existing:true},200,origin);
    const inserted=await db('bbweb_affiliates',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:user.id,display_name,whatsapp,promotion_channel})});
    if(!inserted?.[0])err('Pendaftaran belum berhasil.',503);
    return output({ok:true,status:'pending'},200,origin);
  }
  if(action==='me'){
    const list=await db('bbweb_affiliates?select=id,display_name,promotion_channel,referral_code,status,created_at&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
    const own=list?.[0]||null;
    if(!own)return output({affiliate:null,commissions:[]},200,origin);
    const commissions=await db('bbweb_affiliate_commissions?select=id,gross_amount,commission_base,rate_percent,commission_amount,status,eligible_at,created_at,paid_at&affiliate_id=eq.'+encodeURIComponent(own.id)+'&order=created_at.desc&limit=100');
    // Do not disclose a usable code until approval.
    return output({affiliate:{...own,referral_code:own.status==='active'?own.referral_code:null},commissions},200,origin);
  }
  await requireAdmin(user);
  if(action==='admin_list'){
    const [affiliates,commissions]=await Promise.all([
      db('bbweb_affiliates?select=id,display_name,whatsapp,promotion_channel,referral_code,status,created_at,reviewed_at&order=created_at.desc&limit=200'),
      db('bbweb_affiliate_commissions?select=id,affiliate_id,order_id,gross_amount,commission_base,rate_percent,commission_amount,status,eligible_at,created_at,paid_at,transfer_reference&order=created_at.desc&limit=500')
    ]);
    return output({affiliates,commissions},200,origin);
  }
  if(action==='admin_review'){
    const id=uuid(body.id),status=clean(body.status,20);
    if(!['active','rejected','suspended'].includes(status))err('Status tinjauan tidak tersedia.');
    const updated=await db('bbweb_affiliates?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status,reviewed_at:new Date().toISOString()})});
    if(!updated?.[0])err('Mitra tidak ditemukan.',404);
    return output({ok:true,status:updated[0].status},200,origin);
  }
  if(action==='admin_approve_commission'){
    const id=uuid(body.id);
    const rows=await db('bbweb_affiliate_commissions?select=id,gross_amount,status,eligible_at&status=eq.pending&id=eq.'+encodeURIComponent(id)+'&limit=1');
    const row=rows?.[0];if(!row)err('Komisi tidak ditemukan atau sudah ditinjau.',404);
    if(new Date(row.eligible_at).getTime()>Date.now())err('Masa validasi 14 hari belum berakhir.',409);
    const base=Number(body.commission_base);
    if(!Number.isSafeInteger(base)||base<0||base>Number(row.gross_amount))err('Nilai jasa bersih tidak valid.');
    const amount=Math.floor(base*.10);
    const updated=await db('bbweb_affiliate_commissions?id=eq.'+encodeURIComponent(id)+'&status=eq.pending',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({commission_base:base,commission_amount:amount,status:'approved',reviewed_at:new Date().toISOString()})});
    if(!updated?.[0])err('Komisi telah berubah. Muat ulang halaman.',409);
    return output({ok:true,amount},200,origin);
  }
  if(action==='admin_reverse_commission'){
    const id=uuid(body.id);
    const updated=await db('bbweb_affiliate_commissions?id=eq.'+encodeURIComponent(id)+'&status=in.(pending,approved)',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'reversed',reviewed_at:new Date().toISOString()})});
    if(!updated?.[0])err('Komisi sudah dibayar atau tidak tersedia.',409);
    return output({ok:true},200,origin);
  }
  if(action==='admin_mark_paid'){
    const affiliateId=uuid(body.affiliate_id),reference=clean(body.transfer_reference,100);
    if(reference.length<5)err('Masukkan referensi bukti transfer yang sah.');
    const rows=await db('bbweb_affiliate_commissions?select=id,commission_amount&affiliate_id=eq.'+encodeURIComponent(affiliateId)+'&status=eq.approved&limit=500');
    const amount=(rows||[]).reduce((sum:number,r:any)=>sum+Number(r.commission_amount||0),0);
    if(!rows?.length||!Number.isSafeInteger(amount)||amount<100000)err('Saldo yang disetujui harus minimal Rp100.000.',409);
    // A single conditional PATCH covers the approved batch; actual money transfer is manual.
    const paid=await db('bbweb_affiliate_commissions?affiliate_id=eq.'+encodeURIComponent(affiliateId)+'&status=eq.approved',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'paid',paid_at:new Date().toISOString(),transfer_reference:reference})});
    return output({ok:true,amount,count:paid?.length||0},200,origin);
  }
  err('Aksi tidak ditemukan.',404);
 }catch(e:any){return output({error:e?.message||'Layanan tidak tersedia.'},Number(e?.status)||500,origin);}
});
