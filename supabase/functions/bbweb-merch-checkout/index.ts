import {config, dokuRequest, safePaymentUrl, claimDokuPayment} from '../_shared/doku.ts';
const ALLOWED_ORIGINS=new Set(['https://bisabikinweb.site', 'https://www.bisabikinweb.site', 'https://shop.bisabikinweb.site']);
function cors(origin:string|null){return {'Access-Control-Allow-Origin':origin&&ALLOWED_ORIGINS.has(origin)?origin:'https://bisabikinweb.site','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};}
function reply(body:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(body),{status,headers:cors(origin)});}
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const parsed=JSON.parse(modern);const value=parsed?.default||Object.values(parsed||{})[0];if(typeof value==='string'&&value)return value;}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';}
function clean(v:unknown,max:number){return String(v??'').trim().replace(/[\u0000-\u001F\u007F]/g,' ').slice(0,max);}
function hex(b:ArrayBuffer){return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256(v:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));}
function randomHex(bytes=6){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
async function db(path:string,options:RequestInit={}){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)throw new Error('Supabase server credentials unavailable');const h=new Headers(options.headers||{});h.set('apikey',key);h.set('Authorization',`Bearer ${key}`);h.set('Accept','application/json');if(options.body!==undefined)h.set('Content-Type','application/json');const r=await fetch(url+'/rest/v1/'+path,{...options,headers:h});const t=await r.text();let p:any=null;if(t){try{p=JSON.parse(t)}catch{p=t}}if(!r.ok)throw new Error(typeof p==='string'?p:(p?.message||p?.details||p?.hint||`Database error ${r.status}`));return p;}
async function rpc(name:string,body:any={}){return db('rpc/'+name,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});}
function normalizePhone(value:string){const d=value.replace(/\D/g,'');return d.startsWith('0')?'62'+d.slice(1):d;}
function dbErrorMessage(error:unknown){const s=String((error as Error)?.message||error);if(s.includes('INSUFFICIENT_STOCK'))return 'Stok salah satu produk tidak mencukupi.';if(s.includes('PRODUCT_NOT_FOR_SALE'))return 'Salah satu produk belum dapat dibeli.';if(s.includes('PRODUCT_UNAVAILABLE'))return 'Salah satu produk sudah tidak tersedia.';if(s.includes('CHECKOUT_KEY_REUSED'))return 'Data checkout berubah. Muat ulang halaman checkout lalu coba lagi.';if(s.includes('ORDER_EXPIRED'))return 'Order sebelumnya sudah kedaluwarsa. Silakan buat checkout baru.';return 'Checkout gagal diproses. Silakan periksa data lalu coba lagi.';}

function normalizeLocation(value:string){return clean(value,160).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
function locationMatch(a:string,b:string){const x=normalizeLocation(a),y=normalizeLocation(b);return !!x&&!!y&&(x===y||x.includes(y)||y.includes(x));}
async function searchDomesticDestination(apiKey:string,term:string){
  const url='https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search='+encodeURIComponent(term)+'&limit=100&offset=0';
  const response=await fetch(url,{headers:{key:apiKey,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  const raw=await response.text();let payload:any={};try{payload=raw?JSON.parse(raw):{}}catch{payload={}};
  if(!response.ok)return [];
  return Array.isArray(payload?.data)?payload.data:[];
}
async function resolveShippingDestination(apiKey:string,shipping:any){
  const postcode=clean(shipping?.postcode,12),district=clean(shipping?.district,120),city=clean(shipping?.city,120),province=clean(shipping?.province,120);
  let matches=await searchDomesticDestination(apiKey,postcode);
  const byZip=matches.filter((x:any)=>String(x.zip_code||'').trim()===postcode);
  const rank=(list:any[])=>list.find((x:any)=>locationMatch(x.district_name||'',district)&&locationMatch(x.city_name||'',city)&&locationMatch(x.province_name||'',province))
    ||list.find((x:any)=>locationMatch(x.district_name||'',district)&&locationMatch(x.city_name||'',city))
    ||list.find((x:any)=>locationMatch(x.city_name||'',city)&&locationMatch(x.province_name||'',province))
    ||null;
  let found=rank(byZip);
  if(found)return found;
  matches=await searchDomesticDestination(apiKey,district);
  found=rank(matches);
  if(found)return found;
  matches=await searchDomesticDestination(apiKey,city);
  found=rank(matches);
  if(found)return found;
  throw Object.assign(new Error('Lokasi tujuan tidak cocok dengan kecamatan, kota, provinsi, dan kode pos. Periksa kembali alamat pengiriman.'),{code:'SHIPPING_DESTINATION_NOT_FOUND'});
}
async function calculateShipping(input:any){
  const apiKey=Deno.env.get('RAJAONGKIR_API_KEY')||'';
  const originId=Deno.env.get('RAJAONGKIR_ORIGIN_ID')||'';
  if(!apiKey||!/^[0-9]+$/.test(originId))throw Object.assign(new Error('Kalkulator ongkir belum diaktifkan. Admin perlu mengatur RAJAONGKIR_API_KEY dan RAJAONGKIR_ORIGIN_ID di Supabase.'),{code:'SHIPPING_NOT_CONFIGURED'});
  const shipping=input?.shipping||{};
  if(!/^[0-9]{5,6}$/.test(clean(shipping.postcode,12))||!clean(shipping.district,120)||!clean(shipping.city,120)||!clean(shipping.province,120))
    throw Object.assign(new Error('Isi kecamatan, kota/kabupaten, provinsi, dan kode pos sebelum menghitung ongkir.'),{code:'SHIPPING_ADDRESS_INCOMPLETE'});
  if(!Array.isArray(input?.items)||input.items.length<1||input.items.length>20)throw Object.assign(new Error('Keranjang tidak valid untuk menghitung ongkir.'),{code:'INVALID_CART'});
  const merged=new Map();
  for(const raw of input.items){
    const id=clean(raw?.productId,120),qty=Number(raw?.quantity);
    if(!/^[A-Za-z0-9._-]{1,120}$/.test(id)||!Number.isInteger(qty)||qty<1||qty>20)throw Object.assign(new Error('Item keranjang tidak valid.'),{code:'INVALID_CART_ITEM'});
    merged.set(id,(merged.get(id)||0)+qty);
  }
  const items=[...merged.entries()].map(([productId,quantity])=>({productId,quantity}));
  if(items.some((x)=>x.quantity>20))throw Object.assign(new Error('Jumlah produk melebihi batas checkout.'),{code:'INVALID_CART_ITEM'});
  const ids=[...new Set(items.map((x)=>x.productId))];
  const filter=new URLSearchParams();
  filter.set('select','id,weight_grams');
  filter.set('is_active','eq.true');
  filter.set('id','in.('+ids.map((id)=>'"'+id.replace(/"/g,'\\"')+'"').join(',')+')');
  const products=await db('bbweb_merchandise?'+filter.toString());
  const byId=new Map((Array.isArray(products)?products:[]).map((p)=>[String(p.id),p]));
  if(ids.some((id)=>!byId.has(id)))throw Object.assign(new Error('Ada produk yang sudah tidak tersedia. Muat ulang keranjang.'),{code:'PRODUCT_UNAVAILABLE'});
  let weight=0;
  for(const item of items){const product=byId.get(item.productId);weight+=Math.max(1,Math.round(Number(product?.weight_grams)||500))*item.quantity;}
  weight=Math.max(1,Math.min(100000,Math.ceil(weight)));
  const destination=await resolveShippingDestination(apiKey,shipping);
  const form=new URLSearchParams();
  form.set('origin',originId);form.set('destination',String(destination.id));form.set('weight',String(weight));
  form.set('courier','jne:jnt:sicepat:pos:tiki:anteraja:ninja');form.set('price','lowest');
  const response=await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost',{
    method:'POST',headers:{key:apiKey,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},
    body:form.toString(),signal:AbortSignal.timeout(15000)
  });
  const raw=await response.text();let payload:any={};try{payload=raw?JSON.parse(raw):{}}catch{payload={}};
  if(!response.ok||!Array.isArray(payload?.data))throw Object.assign(new Error('Tarif kurir belum tersedia untuk rute ini. Coba periksa kode pos atau pilih alamat lain.'),{code:'SHIPPING_RATE_FAILED'});
  const rates=payload.data.map((x:any)=>({
    code:clean(x?.code,30).toLowerCase(),name:clean(x?.name,80),service:clean(x?.service,100),
    description:clean(x?.description,180),cost:Math.round(Number(typeof x?.cost==='object'?(x.cost?.value??x.cost?.[0]?.value):x?.cost)),
    etd:clean(x?.etd,80)
  })).filter((x:any)=>x.code&&x.service&&Number.isSafeInteger(x.cost)&&x.cost>=0);
  if(!rates.length)throw Object.assign(new Error('Belum ada layanan kurir untuk alamat tujuan ini.'),{code:'NO_SHIPPING_RATES'});
  return {rates,weight_grams:weight,destination:{label:clean(destination.label,250),zip_code:clean(destination.zip_code,12)}};
}

Deno.serve(async(req:Request)=>{const origin=req.headers.get('origin');if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});if(req.method!=='POST')return reply({error:'Method not allowed'},405,origin);if(!origin||!ALLOWED_ORIGINS.has(origin))return reply({error:'Origin not allowed'},403,origin);const len=Number(req.headers.get('content-length')||0);if(len>32768)return reply({error:'Payload terlalu besar.'},413,origin);
  const ip=clean((req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',')[0],100);const ua=clean(req.headers.get('user-agent')||'',180);try{const rateKey=await sha256('checkout-rate:'+ip+':'+ua);const allowed=await rpc('bbweb_take_checkout_slot',{p_key_hash:rateKey});const ok=Array.isArray(allowed)?allowed[0]:allowed;if(ok===false)return reply({error:'Terlalu banyak percobaan checkout. Coba lagi beberapa menit lagi.'},429,origin);}catch{}
  let input:any;try{input=await req.json();}catch{return reply({error:'Payload JSON tidak valid.'},400,origin)}
  if(input?.action==='shipping_rates'){try{const quote=await calculateShipping(input);return reply({ok:true,...quote},200,origin)}catch(error){const code=(error as any)?.code||'SHIPPING_RATE_FAILED';const status=code==='SHIPPING_NOT_CONFIGURED'?503:code==='SHIPPING_RATE_FAILED'?502:422;return reply({error:String((error as Error)?.message||'Ongkir belum dapat dihitung.'),code},status,origin)}}
  if(input?.accepted_terms!==true)return reply({error:'Persetujuan syarat dan kebijakan privasi wajib dicentang.'},400,origin);
  const token=clean(input?.checkout_token,80).toLowerCase();if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'Token checkout tidak valid.'},400,origin);
  const customer={name:clean(input?.customer?.name,120),email:clean(input?.customer?.email,254).toLowerCase(),phone:normalizePhone(clean(input?.customer?.phone,40))};
  const shipping={address:clean(input?.shipping?.address,700),district:clean(input?.shipping?.district,120),city:clean(input?.shipping?.city,120),province:clean(input?.shipping?.province,120),postcode:clean(input?.shipping?.postcode,12)};
  const note=clean(input?.note,1000);
  if(customer.name.length<2||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)||customer.phone.length<8)return reply({error:'Nama, email, atau nomor WhatsApp belum valid.'},400,origin);
  if(shipping.address.length<10||!shipping.city||!shipping.province||!/^[0-9]{5,6}$/.test(shipping.postcode))return reply({error:'Alamat pengiriman belum lengkap atau kode pos tidak valid.'},400,origin);
  if(!Array.isArray(input?.items)||input.items.length<1||input.items.length>20)return reply({error:'Keranjang tidak valid.'},400,origin);
  const merged=new Map<string,number>();for(const raw of input.items){const id=clean(raw?.productId,120);const qty=Number(raw?.quantity);if(!id||!Number.isInteger(qty)||qty<1||qty>20)return reply({error:'Item keranjang tidak valid.'},400,origin);merged.set(id,(merged.get(id)||0)+qty);}const items=[...merged.entries()].map(([productId,quantity])=>({productId,quantity})).sort((a,b)=>a.productId.localeCompare(b.productId));if(items.some(x=>x.quantity>20))return reply({error:'Jumlah produk melebihi batas checkout.'},400,origin);
  const paymentMethod=clean(input?.payment_method||'all',40).toLowerCase();
  const paymentChannels:Record<string,string[]>={all:[],qris:['QRIS'],bank_transfer:['VIRTUAL_ACCOUNT_BCA','VIRTUAL_ACCOUNT_BANK_MANDIRI','VIRTUAL_ACCOUNT_BRI','VIRTUAL_ACCOUNT_BNI','VIRTUAL_ACCOUNT_DOKU'],ewallet:['EMONEY_OVO','EMONEY_SHOPEEPAY'],credit_card:['CREDIT_CARD'],cstore:['ONLINE_TO_OFFLINE_ALFA']};
  if(!Object.prototype.hasOwnProperty.call(paymentChannels,paymentMethod))return reply({error:'Pilihan metode pembayaran tidak valid.'},400,origin);
  // Product checkout intentionally does not depend on the shipping API yet.
  // The buyer pays for products first; courier and shipping fee are confirmed separately after order creation.
  const validatedShipping={...shipping,courier_code:'manual',courier_name:'Dikonfirmasi setelah pembayaran',service:'Ongkir dikonfirmasi kemudian',shipping_cost:0,shipping_etd:'',weight_grams:0,destination_label:''};
  const accessHash=await sha256('access:'+token),checkoutHash=await sha256('checkout:'+token),requestHash=await sha256(JSON.stringify({customer,shipping:validatedShipping,items,note,payment_method:paymentMethod}));
  await rpc('bbweb_release_expired_merch_reservations',{}).catch(()=>{});
  let created:any;try{const rows=await rpc('bbweb_create_merch_order',{p_customer:customer,p_shipping:validatedShipping,p_items:items,p_access_token_hash:accessHash,p_checkout_key_hash:checkoutHash,p_request_hash:requestHash,p_note:note});created=Array.isArray(rows)?rows[0]:rows;if(!created?.order_id)throw new Error('ORDER_CREATE_FAILED');}catch(error){return reply({error:dbErrorMessage(error)},409,origin)}
  let orderRows:any;try{orderRows=await db('bbweb_orders?select=id,order_no,customer_name,customer_email,customer_phone,items,subtotal,discount,total,shipping_amount,currency,status,payment_status,inventory_state,created_at&id=eq.'+encodeURIComponent(created.order_id)+'&limit=1');}catch{return reply({error:'Order sudah tersimpan tetapi gagal dibaca kembali. Gunakan halaman lacak pesanan.',order_saved:true,order_no:created.order_no,token},503,origin)}
  const order=Array.isArray(orderRows)?orderRows[0]:null;if(!order)return reply({error:'Order tidak ditemukan setelah dibuat.'},500,origin);
  if(order.payment_status==='paid')return reply({ok:true,order_saved:true,order_no:order.order_no,token,status:'paid',amount:Number(order.total),currency:order.currency},200,origin);
  const cfg=config();
  if(!cfg.clientId||!cfg.secret){return reply({error:'DOKU belum diaktifkan. Hubungi admin untuk melanjutkan pembayaran.',code:'PAYMENT_NOT_CONFIGURED',order_saved:true,order_no:order.order_no,token},503,origin)}
  const environment=cfg.environment, merchantOrderId=('BB'+order.id.replaceAll('-','').slice(0,16)+randomHex(6)).slice(0,30),total=Number(order.total);
  if(!Number.isSafeInteger(total)||total<1)return reply({error:'Total order tidak valid.'},409,origin);
  let claim:any;
  try{claim=await claimDokuPayment(order.id,merchantOrderId,rpc)}catch{return reply({error:'Pembayaran belum dapat disiapkan. Hubungi admin.',order_saved:true,order_no:order.order_no,token},503,origin)}
  if(!claim.claimed){
    const previous=claim.payment;
    if(previous.redirect_url&&previous.provider==='doku'&&previous.environment===environment&&safePaymentUrl(previous.redirect_url,environment)&&['created','pending','authorized','failed'].includes(previous.status))return reply({ok:true,order_saved:true,order_no:order.order_no,token,status:previous.status,amount:total,currency:'IDR',redirect_url:previous.redirect_url},200,origin);
    return reply({error:'Pembayaran sebelumnya perlu diperiksa admin sebelum mencoba lagi.',order_saved:true,order_no:order.order_no,token},409,origin);
  }
  const finish='https://bisabikinweb.site/track-order?id='+encodeURIComponent(order.order_no);
  const body:any={order:{amount:total,invoice_number:merchantOrderId,currency:'IDR',callback_url:finish,callback_url_cancel:finish,auto_redirect:true,line_items:order.items.map((x:any)=>({name:String(x.name).slice(0,255),price:Number(x.price),quantity:Number(x.quantity)}))},payment:{payment_due_date:30,type:'SALE'},customer:{name:order.customer_name,email:order.customer_email,phone:order.customer_phone,address:shipping.address.slice(0,400),postcode:shipping.postcode,state:shipping.province,city:shipping.city,country:'ID'},additional_info:{override_notification_url:(Deno.env.get('SUPABASE_URL')||'')+'/functions/v1/bbweb-doku-webhook'}};
  if(paymentMethod!=='all')body.payment.payment_method_types=paymentChannels[paymentMethod];
  let response:Response;
  try{response=await dokuRequest('/checkout/v1/payment',body);}catch{
    await db('bbweb_merch_payments?merchant_order_id=eq.'+merchantOrderId,{method:'PATCH',body:JSON.stringify({status:'unknown'})});
    return reply({error:'Status pembuatan pembayaran belum pasti. Periksa pesanan sebelum mencoba lagi.',order_saved:true,order_no:order.order_no,token},502,origin);
  }
  const result=await response.json().catch(()=>null),url=result?.response?.payment?.url;
  if(!response.ok||!safePaymentUrl(url,environment)){
    await db('bbweb_merch_payments?merchant_order_id=eq.'+merchantOrderId,{method:'PATCH',body:JSON.stringify({status:response.status>=400&&response.status<500?'failed':'unknown',status_code:String(response.status)})});
    return reply({error:'DOKU belum memberikan halaman pembayaran. Hubungi admin dengan nomor pesanan.',order_saved:true,order_no:order.order_no,token},502,origin);
  }
  await db('bbweb_merch_payments?merchant_order_id=eq.'+merchantOrderId+'&status=eq.created',{method:'PATCH',body:JSON.stringify({status:'pending',redirect_url:url,transaction_status:'PENDING'})});
  return reply({ok:true,order_saved:true,order_no:order.order_no,token,status:'pending',amount:total,currency:'IDR',environment,redirect_url:url},201,origin);
});
