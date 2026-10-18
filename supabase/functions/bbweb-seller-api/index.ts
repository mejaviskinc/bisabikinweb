const ALLOWED_ORIGINS=new Set(['https://bisabikinweb.site','https://www.bisabikinweb.site']);
const SUPABASE_PUBLIC_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
function cors(origin:string|null){return {'Access-Control-Allow-Origin':origin&&ALLOWED_ORIGINS.has(origin)?origin:'https://bisabikinweb.site','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};}
function reply(body:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(body),{status,headers:cors(origin)});}
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const parsed=JSON.parse(modern);const value=parsed?.default||Object.values(parsed||{})[0];if(typeof value==='string'&&value)return value;}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';}
function clean(v:unknown,max:number){return String(v??'').trim().replace(/[\u0000-\u001F\u007F]/g,' ').slice(0,max);}
function rand(bytes=4){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
function slug(v:string){return v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52)||'product';}
function mask(v:string){return '•'.repeat(Math.max(4,v.length-4))+v.slice(-4);}
function optionalHttps(v:unknown){const raw=clean(v,250);if(!raw)return '';try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname?u.toString().slice(0,250):null;}catch{return null;}}
const SELLER_CATEGORIES=['Fashion','Aksesoris','Kecantikan','Makanan & Minuman','Kerajinan','Elektronik','Produk Digital','Rumah Tangga','Lainnya'];
async function db(path:string,options:RequestInit={}){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)throw new Error('Server database credentials unavailable');const h=new Headers(options.headers||{});h.set('apikey',key);h.set('Authorization','Bearer '+key);h.set('Accept','application/json');if(options.body!==undefined)h.set('Content-Type','application/json');const r=await fetch(url+'/rest/v1/'+path,{...options,headers:h});const t=await r.text();let p:any=null;if(t){try{p=JSON.parse(t)}catch{p=t}}if(!r.ok)throw new Error(typeof p==='string'?p:(p?.message||p?.details||p?.hint||'Database request failed'));return p;}
async function rpc(name:string,body:any={}){return db('rpc/'+name,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});}
async function authenticate(req:Request){const auth=req.headers.get('authorization')||'';const token=auth.match(/^Bearer\s+(.+)$/i)?.[1];if(!token)throw Object.assign(new Error('Silakan masuk kembali.'),{status:401});const url=Deno.env.get('SUPABASE_URL')||'';const r=await fetch(url+'/auth/v1/user',{headers:{apikey:SUPABASE_PUBLIC_KEY,Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Object.assign(new Error('Sesi login tidak valid atau sudah kedaluwarsa.'),{status:401});const user=await r.json();if(!user?.id||!user?.email)throw Object.assign(new Error('Akun tidak valid.'),{status:401});return user;}
async function requireAdmin(user:any){const rows=await db('bbweb_admin_allowlist?select=email,label&email=eq.'+encodeURIComponent(String(user.email).toLowerCase())+'&limit=1');if(!Array.isArray(rows)||!rows.length)throw Object.assign(new Error('Akses admin ditolak.'),{status:403});return rows[0];}
async function profile(uid:string){const rows=await db('bbweb_sellers?select=id,application_no,email,store_name,owner_name,phone,description,business_category,city,store_address,website_url,social_url,terms_accepted_at,email_verified_at,review_note,reviewed_at,reviewed_by,status,commission_rate,storefront_slug,storefront_config,storefront_published,created_at,updated_at&id=eq.'+encodeURIComponent(uid)+'&limit=1');return Array.isArray(rows)?rows[0]||null:null;}

function validStoreHref(value:unknown){
 const raw=clean(value,500);
 if(/^#(about|links|products|articles)$/.test(raw))return raw;
 try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.toString().slice(0,500):'';}catch{return '';}
}
function safeStorefrontConfig(value:any){
 const src=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const theme=['cream','light','dark'].includes(clean(src.theme,20))?clean(src.theme,20):'cream';
 const buttonStyle=['pill','rounded','square'].includes(clean(src.button_style,20))?clean(src.button_style,20):'pill';
 const accent=clean(src.accent_color,7);
 const menuSource=Array.isArray(src.menu_items)?src.menu_items:[];
 const linkSource=Array.isArray(src.links)?src.links:[];
 if(menuSource.length>8||linkSource.length>15)throw Object.assign(new Error('Maksimal 8 menu navigasi dan 15 tautan.'),{status:400});
 const menuItems=menuSource.map((item:any)=>({label:clean(item?.label,40),href:validStoreHref(item?.href)}));
 if(menuItems.some((item:any)=>!item.label||!item.href))throw Object.assign(new Error('Setiap menu harus memiliki nama dan tujuan HTTPS atau bagian halaman yang valid.'),{status:400});
 const links=linkSource.map((item:any)=>({label:clean(item?.label,80),url:validStoreHref(item?.url),description:clean(item?.description,180)}));
 if(links.some((item:any)=>!item.label||!item.url||item.url.startsWith('#')))throw Object.assign(new Error('Setiap tautan harus memiliki judul dan URL HTTPS yang valid.'),{status:400});
 const imageUrl=(v:any)=>{const raw=clean(v,1000);if(!raw)return '';try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.toString().slice(0,1000):null;}catch{return null;}};
 const avatar=imageUrl(src.avatar_url),cover=imageUrl(src.cover_url);
 if(avatar===null||cover===null)throw Object.assign(new Error('Foto profil dan banner harus menggunakan URL HTTPS yang valid.'),{status:400});
 if(accent&&!/^#[0-9a-fA-F]{6}$/.test(accent))throw Object.assign(new Error('Warna aksen harus berupa kode HEX seperti #D7A96B.'),{status:400});
 return {
  tagline:clean(src.tagline,120),headline:clean(src.headline,140),bio:clean(src.bio,700),
  avatar_url:avatar,cover_url:cover,theme,accent_color:accent||'#d7a96b',button_style:buttonStyle,
  menu_items:menuItems,links,
  show_products:src.show_products!==false,show_articles:src.show_articles!==false,
  product_title:clean(src.product_title,80)||'Produk pilihan',
  article_title:clean(src.article_title,80)||'Artikel terbaru',
  layout:['centered','editorial'].includes(clean(src.layout,20))?clean(src.layout,20):'centered'
 };
}
async function publicStorefront(storeSlug:string){
 const rows=await db('bbweb_sellers?select=id,storefront_slug,storefront_config,storefront_published,store_name,owner_name,phone,description,business_category,city,website_url,social_url,status&storefront_slug=eq.'+encodeURIComponent(storeSlug)+'&status=eq.active&storefront_published=eq.true&limit=1');
 const store=Array.isArray(rows)?rows[0]:null;
 if(!store)return null;
 const [products,articles]=await Promise.all([
  db('bbweb_merchandise?select=id,sku,name,description,price,badge,stock,image_url,collection,sort_order&seller_id=eq.'+encodeURIComponent(store.id)+'&is_active=eq.true&seller_review_status=eq.approved&order=sort_order.asc,created_at.desc&limit=50'),
  db('bbweb_articles?select=id,title,category,read_time,summary,body,cover_image_url,published_at,updated_at&seller_id=eq.'+encodeURIComponent(store.id)+'&is_active=eq.true&status=eq.published&order=published_at.desc&limit=50')
 ]);
 return {ok:true,store:{slug:store.storefront_slug,store_name:store.store_name,owner_name:store.owner_name,phone:store.phone,description:store.description,business_category:store.business_category,city:store.city,website_url:store.website_url,social_url:store.social_url,config:safeStorefrontConfig(store.storefront_config)},products:Array.isArray(products)?products:[],articles:Array.isArray(articles)?articles:[]};
}

async function requireSeller(uid:string,active=false){const p=await profile(uid);if(!p)throw Object.assign(new Error('Lengkapi pendaftaran toko terlebih dahulu.'),{status:409,code:'SELLER_PROFILE_REQUIRED'});if(active&&p.status!=='active')throw Object.assign(new Error(p.status==='pending'?'Toko masih menunggu persetujuan admin.':'Akun seller belum aktif.'),{status:403,code:'SELLER_NOT_ACTIVE'});return p;}
function userMessage(error:any){const raw=String(error?.message||'');if(raw.includes('WITHDRAWAL_BELOW_MINIMUM'))return 'Nominal withdraw di bawah minimum yang berlaku.';if(raw.includes('INSUFFICIENT_AVAILABLE_BALANCE'))return 'Saldo tersedia tidak mencukupi.';if(raw.includes('PAYOUT_ACCOUNT_REQUIRED'))return 'Simpan rekening pencairan terlebih dahulu.';if(raw.includes('SELLER_NOT_ACTIVE'))return 'Toko harus disetujui admin sebelum melakukan aksi ini.';if(raw.includes('INVALID_WITHDRAWAL_AMOUNT'))return 'Nominal withdraw tidak valid.';if(raw.includes('PRODUCT_UNAVAILABLE')||raw.includes('PRODUCT_NOT_FOR_SALE'))return 'Produk tidak tersedia untuk dijual.';if(raw.includes('INVALID_STOCK_DELTA'))return 'Perubahan stok tidak valid.';if(raw.includes('STOCK_OUT_OF_RANGE'))return 'Stok tidak boleh kurang dari nol atau melebihi 10.000.';if(raw.includes('PRODUCT_NOT_FOUND'))return 'Produk tidak ditemukan atau bukan milik toko Anda.';if(raw.includes('duplicate key'))return 'Data tersebut sudah digunakan.';if(raw.includes('row-level security')||raw.includes('permission denied'))return 'Akses data ditolak oleh aturan keamanan.';return error?.status?raw:'Permintaan belum dapat diproses. Periksa data lalu coba lagi.';}
async function readDashboard(uid:string){
 const p=await profile(uid);const settingsRows=await db('bbweb_seller_settings?select=minimum_withdrawal&id=eq.1&limit=1');const minimum=Number(settingsRows?.[0]?.minimum_withdrawal||50000);
 if(!p)return {ok:true,profile:null,minimum_withdrawal:minimum};
 const [products,payoutRows,items,ledger,withdrawals,articles]=await Promise.all([
  db('bbweb_merchandise?select=id,sku,name,collection,type,color,print,description,price,badge,material,care,shipping,returns,stock,low_stock_threshold,is_active,sort_order,seller_review_status,seller_review_note,image_url,created_at,updated_at&seller_id=eq.'+encodeURIComponent(uid)+'&order=created_at.desc'),
  db('bbweb_seller_payout_accounts?select=seller_id,payout_method,provider_name,account_name,account_number_masked,updated_at&seller_id=eq.'+encodeURIComponent(uid)+'&limit=1'),
  db('bbweb_seller_order_items?select=id,order_id,seller_id,merchandise_id,sku,product_name,quantity,unit_price,gross_amount,commission_rate,commission_amount,seller_amount,payment_status,fulfillment_status,carrier,tracking_number,created_at,updated_at&seller_id=eq.'+encodeURIComponent(uid)+'&order=created_at.desc&limit=300'),
  db('bbweb_seller_ledger?select=id,order_id,seller_order_item_id,entry_type,amount,status,description,created_at,available_at&seller_id=eq.'+encodeURIComponent(uid)+'&order=created_at.desc&limit=500'),
  db('bbweb_seller_withdrawals?select=id,amount,status,payout_method,provider_name,account_name,account_number_masked,payout_reference,admin_note,requested_at,approved_at,paid_at,rejected_at,updated_at&seller_id=eq.'+encodeURIComponent(uid)+'&order=requested_at.desc&limit=100'),
  db('bbweb_articles?select=id,title,category,read_time,summary,body,cover_image_url,status,is_active,sort_order,published_at,created_at,updated_at,seller_id,author_store_name,author_type&seller_id=eq.'+encodeURIComponent(uid)+'&order=created_at.desc&limit=100')
 ]);
 const ids=[...new Set((Array.isArray(items)?items:[]).map((x:any)=>x.order_id).filter(Boolean))];
 let orderRows:any[]=[];
 if(ids.length)orderRows=await db('bbweb_orders?select=id,order_no,customer_name,customer_phone,shipping_address,status,payment_status,created_at,paid_at&id=in.('+ids.join(',')+')');
 const orderMap=new Map((Array.isArray(orderRows)?orderRows:[]).map((o:any)=>[o.id,o]));
 const orderItems=(Array.isArray(items)?items:[]).map((x:any)=>{const o:any=orderMap.get(x.order_id)||{};const paid=o.payment_status==='paid';return {...x,payment_status:o.payment_status||x.payment_status,order:{id:o.id,order_no:o.order_no||'—',status:o.status||'—',payment_status:o.payment_status||x.payment_status,created_at:o.created_at||x.created_at,paid_at:o.paid_at||null,customer_name:paid?o.customer_name:null,customer_phone:paid?o.customer_phone:null,shipping_address:paid?o.shipping_address:null}};});
 const ledgerRows=Array.isArray(ledger)?ledger:[],withdrawRows=Array.isArray(withdrawals)?withdrawals:[];
 const availableCredits=ledgerRows.filter((x:any)=>x.status==='available').reduce((s:number,x:any)=>s+Number(x.amount||0),0);
 const reservedWithdrawals=withdrawRows.filter((x:any)=>['pending','approved','processing','paid'].includes(x.status)).reduce((s:number,x:any)=>s+Number(x.amount||0),0);
 const pendingCredits=ledgerRows.filter((x:any)=>x.status==='pending').reduce((s:number,x:any)=>s+Number(x.amount||0),0);
 const totalEarned=ledgerRows.filter((x:any)=>x.status!=='reversed').reduce((s:number,x:any)=>s+Number(x.amount||0),0);
 const paidOrderItems=orderItems.filter((x:any)=>x.payment_status==='paid');
 const sales=paidOrderItems.reduce((s:number,x:any)=>s+Number(x.gross_amount||0),0);
 const openOrders=paidOrderItems.filter((x:any)=>!['shipped','completed','cancelled'].includes(x.fulfillment_status)).length;
 return {ok:true,profile:p,minimum_withdrawal:minimum,payout_account:Array.isArray(payoutRows)?payoutRows[0]||null:null,products:Array.isArray(products)?products:[],articles:Array.isArray(articles)?articles:[],orders:orderItems,ledger:ledgerRows,withdrawals:withdrawRows,stats:{sales_gross:sales,total_earned:totalEarned,pending_balance:pendingCredits,available_balance:Math.max(0,availableCredits-reservedWithdrawals),total_withdrawn:withdrawRows.filter((x:any)=>x.status==='paid').reduce((s:number,x:any)=>s+Number(x.amount||0),0),orders_count:paidOrderItems.length,open_orders:openOrders,products_count:Array.isArray(products)?products.length:0,active_products:(Array.isArray(products)?products:[]).filter((x:any)=>x.is_active).length}};
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});if(req.method!=='POST')return reply({error:'Method not allowed'},405,origin);if(!origin||!ALLOWED_ORIGINS.has(origin))return reply({error:'Origin not allowed'},403,origin);if(Number(req.headers.get('content-length')||0)>65536)return reply({error:'Payload terlalu besar.'},413,origin);
 try{
  let input:any;try{input=await req.json()}catch{return reply({error:'Payload JSON tidak valid.'},400,origin)}const action=clean(input?.action,60);
  if(action==='public_storefront'){
   const storeSlug=clean(input?.slug,60).toLowerCase();
   if(!/^[a-z0-9](?:[a-z0-9-]{0,50}[a-z0-9])?$/.test(storeSlug))return reply({error:'Alamat toko tidak valid.'},400,origin);
   const result=await publicStorefront(storeSlug);
   if(!result)return reply({error:'Landing page toko tidak ditemukan atau belum dipublikasikan.'},404,origin);
   return reply(result,200,origin);
  }
  const user=await authenticate(req);
  if(action==='register'){
   const storeName=clean(input?.store_name,120),ownerName=clean(input?.owner_name,120),phone=clean(input?.phone,40),description=clean(input?.description,1500),category=clean(input?.business_category,60),city=clean(input?.city,100),address=clean(input?.store_address,250),website=optionalHttps(input?.website_url),social=optionalHttps(input?.social_url);
   if(storeName.length<2||ownerName.length<2||phone.replace(/\D/g,'').length<8||city.length<2||address.length<5)return reply({error:'Nama toko, nama pemilik, WhatsApp, kota, dan alamat toko wajib dilengkapi.'},400,origin);
   if(!SELLER_CATEGORIES.includes(category))return reply({error:'Kategori usaha tidak valid.'},400,origin);
   if(website===null||social===null)return reply({error:'Website dan media sosial harus berupa URL HTTPS yang valid.'},400,origin);
   if(input?.terms_accepted!==true)return reply({error:'Persetujuan syarat seller wajib dicentang.'},400,origin);
   await db('bbweb_sellers?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({id:user.id,email:String(user.email).toLowerCase(),store_name:storeName,owner_name:ownerName,phone,description,business_category:category,city,store_address:address,website_url:website,social_url:social,storefront_slug:slug(storeName).slice(0,42)+'-'+rand(3).toLowerCase(),storefront_published:false,terms_accepted_at:new Date().toISOString(),email_verified_at:user.email_confirmed_at||user.confirmed_at||null,status:'pending',commission_rate:0})});
   return reply({ok:true,profile:await profile(user.id)},200,origin);
  }
  if(action.startsWith('admin_')){
   await requireAdmin(user);
   if(action==='admin_dashboard'){
    const [sellers,withdrawals,products,settings]=await Promise.all([
     db('bbweb_sellers?select=id,application_no,email,store_name,owner_name,phone,description,business_category,city,store_address,website_url,social_url,terms_accepted_at,email_verified_at,review_note,reviewed_at,reviewed_by,status,commission_rate,created_at,updated_at&order=created_at.desc&limit=500'),
     db('bbweb_seller_withdrawals?select=*&order=requested_at.desc&limit=500'),
     db('bbweb_merchandise?select=id,sku,name,seller_id,price,stock,is_active,seller_review_status,seller_review_note,created_at&seller_id=not.is.null&seller_review_status=eq.pending&order=created_at.asc&limit=500'),
     db('bbweb_seller_settings?select=minimum_withdrawal&id=eq.1&limit=1')
    ]);
    return reply({ok:true,sellers:Array.isArray(sellers)?sellers:[],withdrawals:Array.isArray(withdrawals)?withdrawals:[],products:Array.isArray(products)?products:[],minimum_withdrawal:Number(settings?.[0]?.minimum_withdrawal||50000)},200,origin);
   }
   if(action==='admin_update_seller'){
    const sellerId=clean(input?.seller_id,64),status=clean(input?.status,20),rate=Number(input?.commission_rate),reviewNote=clean(input?.review_note,1000);
    if(!/^[0-9a-f-]{36}$/i.test(sellerId)||!['active','suspended','rejected','pending'].includes(status)||!Number.isFinite(rate)||rate<0||rate>50)return reply({error:'Status atau komisi tidak valid.'},400,origin);
    if(status==='active'){
     const applicantRows=await db('bbweb_sellers?select=id,email_verified_at&id=eq.'+encodeURIComponent(sellerId)+'&limit=1');
     if(!applicantRows?.[0])return reply({error:'Pendaftaran seller tidak ditemukan.'},404,origin);
     if(!applicantRows[0].email_verified_at)return reply({error:'Email seller belum terverifikasi. Minta seller menyelesaikan verifikasi email sebelum aktivasi.'},409,origin);
    }
    if(['rejected','suspended'].includes(status)&&reviewNote.length<3)return reply({error:'Catatan penolakan atau penangguhan wajib diisi.'},400,origin);
    const sellerPatch:any={status,commission_rate:rate,updated_at:new Date().toISOString()};
    if(['active','suspended','rejected'].includes(status)){sellerPatch.review_note=reviewNote;sellerPatch.reviewed_at=new Date().toISOString();sellerPatch.reviewed_by=String(user.email).toLowerCase();}
    await db('bbweb_sellers?id=eq.'+encodeURIComponent(sellerId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(sellerPatch)});
    if(status==='suspended'||status==='rejected')await db('bbweb_merchandise?seller_id=eq.'+encodeURIComponent(sellerId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_active:false})});
    if(status==='active')await db('bbweb_merchandise?seller_id=eq.'+encodeURIComponent(sellerId)+'&seller_review_status=eq.approved',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_active:true})});
    return reply({ok:true},200,origin);
   }
   if(action==='admin_review_product'){
    const productId=clean(input?.product_id,120),decision=clean(input?.decision,20),note=clean(input?.note,500);
    if(!productId||!['approve','reject'].includes(decision))return reply({error:'Keputusan review tidak valid.'},400,origin);
    const rows=await db('bbweb_merchandise?select=id,seller_id&seller_id=not.is.null&id=eq.'+encodeURIComponent(productId)+'&limit=1');const product=rows?.[0];if(!product)return reply({error:'Produk seller tidak ditemukan.'},404,origin);
    if(decision==='approve'){const s=await profile(product.seller_id);if(!s||s.status!=='active')return reply({error:'Aktifkan akun seller sebelum menyetujui produknya.'},409,origin);}
    await db('bbweb_merchandise?id=eq.'+encodeURIComponent(productId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({seller_review_status:decision==='approve'?'approved':'rejected',seller_review_note:note,is_active:decision==='approve',updated_at:new Date().toISOString()})});
    return reply({ok:true},200,origin);
   }
   if(action==='admin_update_withdrawal'){
    const id=clean(input?.withdrawal_id,64),next=clean(input?.status,20),reference=clean(input?.payout_reference,160),note=clean(input?.admin_note,1000);
    if(!/^[0-9a-f-]{36}$/i.test(id)||!['approved','processing','paid','rejected'].includes(next))return reply({error:'Status pencairan tidak valid.'},400,origin);
    const rows=await db('bbweb_seller_withdrawals?select=id,status,amount,seller_id&id=eq.'+encodeURIComponent(id)+'&limit=1');
    const current=rows?.[0];if(!current)return reply({error:'Permintaan withdraw tidak ditemukan.'},404,origin);
    const allowed:Record<string,string[]>={pending:['approved','rejected'],approved:['processing','rejected'],processing:['paid','rejected'],paid:[],rejected:[]};
    if(!(allowed[current.status]||[]).includes(next))return reply({error:'Perubahan status tersebut tidak diizinkan.'},409,origin);
    if(next==='paid'&&reference.length<3)return reply({error:'Nomor referensi transfer wajib diisi sebelum menandai lunas.'},400,origin);
    if(next==='processing'){
      const [ledgerRows,otherWithdrawals]=await Promise.all([
        db('bbweb_seller_ledger?select=amount&seller_id=eq.'+encodeURIComponent(current.seller_id)+'&status=eq.available'),
        db('bbweb_seller_withdrawals?select=amount&seller_id=eq.'+encodeURIComponent(current.seller_id)+'&status=in.(pending,approved,processing,paid)&id=neq.'+encodeURIComponent(id))
      ]);
      const availableCredits=(Array.isArray(ledgerRows)?ledgerRows:[]).reduce((sum:number,row:any)=>sum+Number(row.amount||0),0);
      const reservedOther=(Array.isArray(otherWithdrawals)?otherWithdrawals:[]).reduce((sum:number,row:any)=>sum+Number(row.amount||0),0);
      if(availableCredits-reservedOther<Number(current.amount))return reply({error:'Saldo tersedia berubah atau tidak cukup. Jangan mulai transfer; tinjau ulang atau tolak permintaan ini.'},409,origin);
    }
    if(next==='rejected'&&note.length<3)return reply({error:'Catatan penolakan wajib diisi.'},400,origin);
    const patch:any={status:next,admin_note:note,updated_at:new Date().toISOString()};
    if(next==='approved')patch.approved_at=new Date().toISOString();if(next==='paid'){patch.paid_at=new Date().toISOString();patch.payout_reference=reference;}
    if(next==='rejected')patch.rejected_at=new Date().toISOString();
    await db('bbweb_seller_withdrawals?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    return reply({ok:true},200,origin);
   }
   if(action==='admin_update_settings'){
    const minimum=Number(input?.minimum_withdrawal);if(!Number.isInteger(minimum)||minimum<10000||minimum>100000000)return reply({error:'Minimum withdraw harus Rp10.000–Rp100.000.000.'},400,origin);
    await db('bbweb_seller_settings?id=eq.1',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({minimum_withdrawal:minimum,updated_at:new Date().toISOString()})});
    return reply({ok:true,minimum_withdrawal:minimum},200,origin);
   }
   return reply({error:'Aksi admin tidak dikenal.'},400,origin);
  }
  if(action==='dashboard')return reply(await readDashboard(user.id),200,origin);

  if(action==='save_storefront'){
   await requireSeller(user.id,true);
   const storeSlug=clean(input?.storefront_slug,60).toLowerCase();
   if(!/^[a-z0-9](?:[a-z0-9-]{0,50}[a-z0-9])?$/.test(storeSlug))return reply({error:'URL toko harus 1–52 karakter, huruf kecil, angka, dan tanda hubung tanpa spasi.'},400,origin);
   const collision=await db('bbweb_sellers?select=id&storefront_slug=eq.'+encodeURIComponent(storeSlug)+'&id=neq.'+encodeURIComponent(user.id)+'&limit=1');
   if(Array.isArray(collision)&&collision.length)return reply({error:'URL toko sudah digunakan seller lain. Coba nama yang berbeda.'},409,origin);
   let config:any;try{config=safeStorefrontConfig(input?.storefront_config)}catch(error:any){return reply({error:String(error?.message||'Pengaturan landing page tidak valid.')},400,origin)}
   const published=input?.storefront_published===true;
   await db('bbweb_sellers?id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({storefront_slug:storeSlug,storefront_config:config,storefront_published:published,updated_at:new Date().toISOString()})});
   return reply({ok:true,profile:await profile(user.id),public_url:published?'https://bisabikinweb.site/toko/'+storeSlug+'/':null},200,origin);
  }

  if(action==='save_article'){
   const seller=await requireSeller(user.id,true);
   const articleId=clean(input?.id,160).toLowerCase();
   const title=clean(input?.title,180);
   const category=clean(input?.category||'UMKM',80);
   const summary=clean(input?.summary,300);
   const paragraphs=Array.isArray(input?.body)?input.body.map((value:any)=>clean(value,5000)).filter(Boolean).slice(0,50):[];
   const bodyLength=paragraphs.join(' ').length;
   let cover=clean(input?.cover_image_url,1500);
   if(title.length<10||summary.length<20||bodyLength<100||bodyLength>20000||paragraphs.length===0)return reply({error:'Judul minimal 10 karakter, ringkasan minimal 20 karakter, dan isi artikel minimal 100 karakter.'},400,origin);
   if(!['UMKM','E-commerce','Bisnis','Website','Teknologi','AI','Produk Digital','Marketing','Lainnya'].includes(category))return reply({error:'Kategori artikel tidak valid.'},400,origin);
   if(cover){try{const imageUrl=new URL(cover);if(imageUrl.protocol!=='https:'||imageUrl.username||imageUrl.password)return reply({error:'Cover harus menggunakan URL HTTPS yang valid.'},400,origin);cover=imageUrl.toString();}catch{return reply({error:'URL cover tidak valid.'},400,origin)}}
   const words=(title+' '+summary+' '+paragraphs.join(' ')).trim().split(/\s+/).filter(Boolean).length;
   const readTime=Math.max(1,Math.ceil(words/200))+' menit';
   const now=new Date().toISOString();
   let finalId=articleId;
   if(finalId){
    const owned=await db('bbweb_articles?select=id,seller_id,published_at,sort_order&id=eq.'+encodeURIComponent(finalId)+'&seller_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
    const old=Array.isArray(owned)?owned[0]:null;
    if(!old)return reply({error:'Artikel tidak ditemukan atau bukan milik toko Anda.'},404,origin);
    await db('bbweb_articles?id=eq.'+encodeURIComponent(finalId)+'&seller_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({title,category,read_time:readTime,summary,body:paragraphs,cover_image_url:cover,status:'published',is_active:true,sort_order:Number(old.sort_order??100),published_at:old.published_at||now,author_store_name:seller.store_name,author_type:'seller',updated_at:now})});
   }else{
    finalId=slug(title).slice(0,75)+'-seller-'+rand(3).toLowerCase();
    await db('bbweb_articles',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:finalId,title,category,read_time:readTime,summary,body:paragraphs,cover_image_url:cover,status:'published',is_active:true,sort_order:100,published_at:now,seller_id:user.id,author_store_name:seller.store_name,author_type:'seller',created_at:now,updated_at:now})});
   }
   return reply({ok:true,article_id:finalId,message:'Artikel diterbitkan.'},201,origin);
  }
  if(action==='delete_article'){
   await requireSeller(user.id,true);
   const id=clean(input?.article_id,160).toLowerCase();
   if(!id)return reply({error:'Artikel tidak valid.'},400,origin);
   const rows=await db('bbweb_articles?select=id,seller_id&id=eq.'+encodeURIComponent(id)+'&seller_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
   if(!Array.isArray(rows)||!rows.length)return reply({error:'Artikel tidak ditemukan atau bukan milik toko Anda.'},404,origin);
   await db('bbweb_articles?id=eq.'+encodeURIComponent(id)+'&seller_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_active:false,status:'draft',updated_at:new Date().toISOString()})});
   return reply({ok:true},200,origin);
  }
  if(action==='save_profile'){
   const p=await requireSeller(user.id);const storeName=clean(input?.store_name,120),ownerName=clean(input?.owner_name,120),phone=clean(input?.phone,40),description=clean(input?.description,1500),category=clean(input?.business_category,60),city=clean(input?.city,100),address=clean(input?.store_address,250),website=optionalHttps(input?.website_url),social=optionalHttps(input?.social_url);
   if(storeName.length<2||ownerName.length<2||phone.replace(/\D/g,'').length<8||city.length<2||address.length<5)return reply({error:'Nama toko, nama pemilik, WhatsApp, kota, dan alamat toko wajib dilengkapi.'},400,origin);
   if(!SELLER_CATEGORIES.includes(category))return reply({error:'Kategori usaha tidak valid.'},400,origin);
   if(website===null||social===null)return reply({error:'Website dan media sosial harus berupa URL HTTPS yang valid.'},400,origin);
   await db('bbweb_sellers?id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({store_name:storeName,owner_name:ownerName,phone,description,business_category:category,city,store_address:address,website_url:website,social_url:social,updated_at:new Date().toISOString()})});
   return reply({ok:true,profile:await profile(user.id)},200,origin);
  }
  if(action==='save_payout_account'){
   await requireSeller(user.id);const method=clean(input?.payout_method,20),provider=clean(input?.provider_name,60),name=clean(input?.account_name,120);
   const existingRows=await db('bbweb_seller_payout_accounts?select=account_number&seller_id=eq.'+encodeURIComponent(user.id)+'&limit=1');const existing=existingRows?.[0];
   const submitted=clean(input?.account_number,80).replace(/\s+/g,'');const number=submitted||String(existing?.account_number||'');
   if(!['bank_transfer','ewallet'].includes(method)||provider.length<2||name.length<2||number.length<5||number.length>40)return reply({error:'Metode, nama penyedia, nama pemilik, atau nomor rekening tidak valid.'},400,origin);
   if(method==='bank_transfer'&&!/^[A-Za-z0-9._-]+$/.test(number))return reply({error:'Nomor rekening hanya boleh berisi huruf dan angka.'},400,origin);
   const payload={seller_id:user.id,payout_method:method,provider_name:provider,account_name:name,account_number:number,account_number_masked:mask(number),updated_at:new Date().toISOString()};
   await db('bbweb_seller_payout_accounts?on_conflict=seller_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
   return reply({ok:true,payout_account:{payout_method:method,provider_name:provider,account_name:name,account_number_masked:mask(number)}},200,origin);
  }
  if(action==='save_product'){
   const p=await requireSeller(user.id,true);const id=clean(input?.id,120),name=clean(input?.name,160),description=clean(input?.description,2500),collection=clean(input?.collection||'SELLER MARKETPLACE',100),type=clean(input?.type||'item',80),color=clean(input?.color||'',80),print=clean(input?.print||'',180),badge=clean(input?.badge||'SELLER DROP',80),material=clean(input?.material||'',300),care=clean(input?.care||'',500),shipping=clean(input?.shipping||'Pengiriman mengikuti kebijakan toko.',500),returns=clean(input?.returns||'Hubungi seller untuk kebijakan retur.',500),image=clean(input?.image_url||'',1000);
   const price=Number(input?.price),stock=Number(input?.stock),low=Number(input?.low_stock_threshold??5);
   if(name.length<3||!Number.isSafeInteger(price)||price<1000||price>100000000||!Number.isInteger(stock)||stock<0||stock>10000||!Number.isInteger(low)||low<0||low>10000)return reply({error:'Nama, harga (minimal Rp1.000), stok, atau batas stok tidak valid.'},400,origin);
   if(image){try{const u=new URL(image);if(u.protocol!=='https:'||u.username||u.password)return reply({error:'URL foto harus menggunakan HTTPS yang valid.'},400,origin);}catch{return reply({error:'URL foto tidak valid.'},400,origin)}}
   const critical={name,description,collection,type,color,print,price,image_url:image};let productId=id;
   if(productId){
    const rows=await db('bbweb_merchandise?select=id,seller_id,name,description,collection,type,color,print,price,image_url,is_active,seller_review_status&seller_id=eq.'+encodeURIComponent(user.id)+'&id=eq.'+encodeURIComponent(productId)+'&limit=1');const old=rows?.[0];if(!old)return reply({error:'Produk tidak ditemukan atau bukan milik toko Anda.'},404,origin);
    const reviewNeeded=['name','description','collection','type','color','print','price','image_url'].some(k=>String((old as any)[k]??'')!==String((critical as any)[k]??''));
    await db('bbweb_merchandise?id=eq.'+encodeURIComponent(productId)+'&seller_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({...critical,badge,material,care,shipping,returns,low_stock_threshold:low,sort_order:100,seller_review_status:reviewNeeded?'pending':old.seller_review_status,is_active:reviewNeeded?false:old.is_active,updated_at:new Date().toISOString()})});
   }else{
    productId='seller-'+slug(name)+'-'+rand(3).toLowerCase();const sku='SELLER-'+user.id.slice(0,8).toUpperCase()+'-'+rand(4);
    await db('bbweb_merchandise',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:productId,sku,name,collection,type,color,print,description,price,badge,material,care,shipping,returns,stock,low_stock_threshold:low,is_active:false,seller_id:user.id,seller_review_status:'pending',seller_review_note:'',image_url:image,sort_order:100})});
   }
   return reply({ok:true,product_id:productId,message:'Produk tersimpan. Produk baru atau perubahan detail menunggu review admin.'},200,origin);
  }
  if(action==='adjust_stock'){
   await requireSeller(user.id,true);const id=clean(input?.product_id,120),delta=Number(input?.delta);
   if(!id||!Number.isSafeInteger(delta)||delta===0||delta < -10000||delta > 10000)return reply({error:'Perubahan stok harus bilangan bulat antara -10.000 sampai 10.000 dan bukan nol.'},400,origin);
   const rows=await rpc('bbweb_adjust_seller_stock',{p_seller_id:user.id,p_product_id:id,p_delta:delta});
   const updatedStock=Array.isArray(rows)?rows[0]:rows;
   return reply({ok:true,stock:Number(updatedStock)},200,origin);
  }
  if(action==='archive_product'){
   await requireSeller(user.id,true);const id=clean(input?.product_id,120);if(!id)return reply({error:'Produk tidak valid.'},400,origin);
   await db('bbweb_merchandise?id=eq.'+encodeURIComponent(id)+'&seller_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_active:false,seller_review_status:'archived',updated_at:new Date().toISOString()})});
   return reply({ok:true},200,origin);
  }
  if(action==='update_fulfillment'){
   await requireSeller(user.id,true);const id=clean(input?.order_item_id,64),status=clean(input?.status,20),carrier=clean(input?.carrier,80),tracking=clean(input?.tracking_number,120);
   if(!/^[0-9a-f-]{36}$/i.test(id)||!['processing','packed','shipped'].includes(status))return reply({error:'Status pengiriman tidak valid.'},400,origin);
   if(status==='shipped'&&(carrier.length<2||tracking.length<4))return reply({error:'Isi nama kurir dan nomor resi sebelum menandai dikirim.'},400,origin);
   const rows=await db('bbweb_seller_order_items?select=id,payment_status,fulfillment_status&seller_id=eq.'+encodeURIComponent(user.id)+'&id=eq.'+encodeURIComponent(id)+'&limit=1');const item=rows?.[0];if(!item)return reply({error:'Item pesanan tidak ditemukan.'},404,origin);if(item.payment_status!=='paid')return reply({error:'Pesanan baru bisa diproses setelah pembayaran terverifikasi.'},409,origin);
   await db('bbweb_seller_order_items?id=eq.'+encodeURIComponent(id)+'&seller_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({fulfillment_status:status,carrier,tracking_number:tracking,updated_at:new Date().toISOString()})});
   return reply({ok:true},200,origin);
  }
  if(action==='create_withdrawal'){
   await requireSeller(user.id,true);const amount=Number(input?.amount);if(!Number.isSafeInteger(amount)||amount<1)return reply({error:'Nominal withdraw tidak valid.'},400,origin);
   const rows=await rpc('bbweb_request_seller_withdrawal',{p_seller_id:user.id,p_amount:amount});const result=Array.isArray(rows)?rows[0]:rows;
   return reply({ok:true,withdrawal_id:result?.withdrawal_id,available_balance:result?.available_balance},201,origin);
  }
  return reply({error:'Aksi tidak dikenal.'},400,origin);
 }catch(error:any){const status=Number(error?.status)||500;return reply({error:userMessage(error),code:error?.code||undefined},status>=400&&status<600?status:500,origin);}
});