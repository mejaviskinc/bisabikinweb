import {config, refreshDoku, dokuRequest, safePaymentUrl, claimDokuPayment} from '../_shared/doku.ts';
const ALLOWED_ORIGINS = new Set(['https://bisabikinweb.site', 'https://www.bisabikinweb.site', 'https://shop.bisabikinweb.site']);
function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://bisabikinweb.site',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  };
}
function reply(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}
function clean(value: unknown, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}
function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      const value = parsed?.default || Object.values(parsed || {})[0];
      if (typeof value === 'string' && value) return value;
    } catch {}
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
}
function publicKey() {
  return Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || secretKey();
}
async function db(path: string, options: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = secretKey();
  if (!url || !key) throw new Error('Supabase server credentials unavailable');
  const headers = new Headers(options.headers || {});
  headers.set('apikey', key);
  if (!key.startsWith('sb_secret_')) headers.set('Authorization', 'Bearer ' + key);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(url + '/rest/v1/' + path, { ...options, headers });
  const raw = await response.text();
  let payload: any = null;
  if (raw) { try { payload = JSON.parse(raw); } catch { payload = raw; } }
  if (!response.ok) throw new Error(typeof payload === 'string' ? payload : (payload?.message || payload?.details || payload?.hint || 'Database request failed (' + response.status + ')'));
  return payload;
}
async function rpc(name: string, body: any = {}) {
  return db('rpc/' + name, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) });
}
async function authenticate(req: Request) {
  const authorization = req.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) throw Object.assign(new Error('Silakan login terlebih dahulu.'), { status: 401 });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const response = await fetch(url + '/auth/v1/user', { headers: { apikey: publicKey(), Authorization: authorization, Accept: 'application/json' } });
  const raw = await response.text();
  let user: any = null;
  if (raw) { try { user = JSON.parse(raw); } catch {} }
  if (!response.ok || !user?.id || !user?.email) throw Object.assign(new Error('Sesi login tidak valid. Silakan login kembali.'), { status: 401 });
  if (!(user.email_confirmed_at || user.confirmed_at)) throw Object.assign(new Error('Verifikasi email terlebih dahulu untuk membuka dashboard pembeli.'), { status: 403 });
  return user;
}
function normalizePhone(value: unknown) {
  const digits = clean(value, 40).replace(/\D/g, '');
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits;
}
function randomHex(length = 12) {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('').slice(0, length);
}
function mapMidtransStatus(transaction: string, fraud?: string) {
  const status = String(transaction || '').toLowerCase();
  const fraudStatus = String(fraud || '').toLowerCase();
  if (status === 'settlement') return 'paid';
  if (status === 'capture') return fraudStatus && fraudStatus !== 'accept' ? 'pending' : 'paid';
  if (status === 'authorize') return 'authorized';
  if (status === 'pending' || status === 'challenge') return 'pending';
  if (status === 'expire') return 'expired';
  if (status === 'cancel') return 'cancelled';
  if (status === 'refund') return 'refunded';
  if (status === 'partial_refund') return 'partial_refund';
  if (status === 'deny' || status === 'failure') return 'failed';
  return 'pending';
}
async function findOrLinkCustomer(user: any) {
  let rows = await db('bbweb_customers?select=id,name,email,phone,company,auth_user_id,last_shipping_address&auth_user_id=eq.' + encodeURIComponent(user.id) + '&limit=1');
  if (Array.isArray(rows) && rows[0]) return rows[0];
  rows = await db('bbweb_customers?select=id,name,email,phone,company,auth_user_id,last_shipping_address&email=eq.' + encodeURIComponent(String(user.email).trim().toLowerCase()) + '&order=updated_at.desc&limit=1');
  const customer = Array.isArray(rows) ? rows[0] : null;
  if (!customer || (customer.auth_user_id && customer.auth_user_id !== user.id)) return null;
  if (!customer.auth_user_id) {
    await db('bbweb_customers?id=eq.' + encodeURIComponent(customer.id) + '&auth_user_id=is.null', {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ auth_user_id: user.id, updated_at: new Date().toISOString() })
    });
    const linked = await db('bbweb_customers?select=id,name,email,phone,company,auth_user_id,last_shipping_address&auth_user_id=eq.' + encodeURIComponent(user.id) + '&limit=1');
    return Array.isArray(linked) ? linked[0] || null : null;
  }
  return customer;
}
async function ensureProfile(user: any, customer: any) {
  const existing = await db('bbweb_customer_profiles?select=user_id,full_name,phone,company,default_shipping_address,created_at,updated_at&user_id=eq.' + encodeURIComponent(user.id) + '&limit=1');
  if (Array.isArray(existing) && existing[0]) return existing[0];
  const metadata = user.user_metadata || {};
  const rows = await db('bbweb_customer_profiles?on_conflict=user_id', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      user_id: user.id,
      full_name: clean(metadata.full_name || customer?.name || '', 120),
      phone: clean(metadata.phone || customer?.phone || '', 40),
      company: clean(metadata.company || customer?.company || '', 160),
      default_shipping_address: customer?.last_shipping_address && typeof customer.last_shipping_address === 'object' ? customer.last_shipping_address : {},
      updated_at: new Date().toISOString()
    })
  });
  return Array.isArray(rows) ? rows[0] : null;
}
async function refreshPayment(payment: any) {
  if(payment?.provider==='doku'){try{return await refreshDoku(payment,db,rpc)}catch{return payment}}

  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') || '';
  if (!serverKey || !payment?.merchant_order_id || !['created', 'pending', 'authorized', 'unknown'].includes(String(payment.status || ''))) return payment;
  const environment = String(payment.environment || Deno.env.get('MIDTRANS_ENV') || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
  const base = environment === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  try {
    const response = await fetch(base + '/v2/' + encodeURIComponent(payment.merchant_order_id) + '/status', {
      headers: { Accept: 'application/json', Authorization: 'Basic ' + btoa(serverKey + ':') },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return payment;
    const payload: any = await response.json();
    if (payload?.order_id !== payment.merchant_order_id) return payment;
    const received = Math.round(Number(payload?.gross_amount));
    if (!Number.isFinite(received) || received !== Number(payment.amount)) return payment;
    const mapped = mapMidtransStatus(String(payload?.transaction_status || ''), payload?.fraud_status);
    const updated: any = {
      status: mapped, transaction_status: String(payload?.transaction_status || ''),
      transaction_id: payload?.transaction_id || null, payment_type: payload?.payment_type || null,
      fraud_status: payload?.fraud_status || null, status_code: payload?.status_code || null,
      raw_notification: { status_recheck: payload }, updated_at: new Date().toISOString()
    };
    if (mapped === 'paid' && !payment.paid_at) updated.paid_at = new Date().toISOString();
    await db('bbweb_merch_payments?id=eq.' + encodeURIComponent(payment.id), {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(updated)
    });
    if (mapped === 'paid') {
      await rpc('bbweb_commit_merch_order', { p_order_id: payment.order_id });
    } else if (mapped === 'pending' || mapped === 'authorized') {
      await db('bbweb_orders?id=eq.' + encodeURIComponent(payment.order_id) + '&payment_status=neq.paid', {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ payment_status: mapped, status: 'waiting_payment', updated_at: new Date().toISOString() })
      }).catch(() => {});
    } else if (['refunded', 'partial_refund'].includes(mapped)) {
      await db('bbweb_orders?id=eq.' + encodeURIComponent(payment.order_id), {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ payment_status: mapped, status: mapped, updated_at: new Date().toISOString() })
      }).catch(() => {});
    } else if (['failed', 'cancelled', 'expired'].includes(mapped)) {
      const other = await db('bbweb_merch_payments?select=id&order_id=eq.' + encodeURIComponent(payment.order_id) + '&id=neq.' + encodeURIComponent(payment.id) + '&status=in.(created,pending,authorized,unknown,paid)&limit=1').catch(() => []);
      if (!Array.isArray(other) || other.length === 0) {
        const status = mapped === 'expired' ? 'expired' : mapped === 'cancelled' ? 'cancelled' : 'payment_error';
        await rpc('bbweb_release_merch_order', { p_order_id: payment.order_id, p_payment_status: mapped, p_status: status }).catch(() => {});
      }
    }
    return { ...payment, ...updated, redirect_url: mapped === 'paid' || ['failed', 'cancelled', 'expired'].includes(mapped) ? null : payment.redirect_url };
  } catch {
    return payment;
  }
}
async function loadOrders(customerId: string) {
  const orders = await db('bbweb_orders?select=id,order_no,customer_id,items,subtotal,discount,total,shipping_amount,currency,status,payment_status,inventory_state,reserved_until,shipping_address,created_at,updated_at,paid_at&customer_id=eq.' + encodeURIComponent(customerId) + '&order=created_at.desc&limit=50');
  const list = Array.isArray(orders) ? orders : [];
  const ids = list.map((order: any) => String(order.id)).filter(Boolean);
  if (!ids.length) return [];
  const payments = await db('bbweb_merch_payments?select=id,order_id,merchant_order_id,provider,amount,environment,status,transaction_status,payment_type,redirect_url,created_at,updated_at,paid_at&order_id=in.(' + ids.join(',') + ')&order=created_at.desc');
  const latest = new Map<string, any>();
  if (Array.isArray(payments)) for (const payment of payments) if (!latest.has(payment.order_id)) latest.set(payment.order_id, payment);
  for (const payment of latest.values()) await refreshPayment(payment);
  const refreshedOrders = await db('bbweb_orders?select=id,order_no,customer_id,items,subtotal,discount,total,shipping_amount,currency,status,payment_status,inventory_state,reserved_until,shipping_address,created_at,updated_at,paid_at&customer_id=eq.' + encodeURIComponent(customerId) + '&order=created_at.desc&limit=50');
  const refreshed = Array.isArray(refreshedOrders) ? refreshedOrders : [];
  const refreshedIds = refreshed.map((order: any) => String(order.id)).filter(Boolean);
  const refreshedPayments = refreshedIds.length ? await db('bbweb_merch_payments?select=id,order_id,merchant_order_id,provider,amount,environment,status,transaction_status,payment_type,redirect_url,created_at,updated_at,paid_at&order_id=in.(' + refreshedIds.join(',') + ')&order=created_at.desc') : [];
  const latestRefreshed = new Map<string, any>();
  if (Array.isArray(refreshedPayments)) for (const payment of refreshedPayments) if (!latestRefreshed.has(payment.order_id)) latestRefreshed.set(payment.order_id, payment);
  return refreshed.map((order: any) => ({ ...order, payment: latestRefreshed.get(order.id) || null }));
}
async function getDashboard(user: any) {
  const customer = await findOrLinkCustomer(user);
  const profile = await ensureProfile(user, customer);
  const orders = customer?.id ? await loadOrders(customer.id) : [];
  return { ok: true, email: user.email, email_verified: true, profile, orders };
}
async function retryPayment(user: any, orderNo: string) {
  const dashboard = await getDashboard(user);
  const order = (dashboard.orders || []).find((item: any) => item.order_no === orderNo);
  if (!order) throw Object.assign(new Error('Pesanan tidak ditemukan pada akun ini.'), { status: 404 });
  if (order.payment_status === 'paid' || order.status === 'completed') return { ok: true, paid: true };
  if (['refunded', 'partial_refund'].includes(String(order.payment_status || ''))) throw Object.assign(new Error('Pesanan yang sudah direfund tidak dapat dibayar ulang.'), { status: 409 });
  const activePayment = order.payment && order.payment.redirect_url && ['created', 'pending', 'authorized', 'unknown', 'failed'].includes(String(order.payment.status || ''));
  if (activePayment) return { ok: true, redirect_url: order.payment.redirect_url, reused: true };
  const cfg=config();
  if(!cfg.clientId||!cfg.secret)throw Object.assign(new Error('DOKU belum dikonfigurasi.'),{status:503});
  const rows=await db('bbweb_orders?select=id,order_no,total,currency,items,customer_name,customer_email,customer_phone,shipping_address,inventory_state&customer_id=eq.'+encodeURIComponent(order.customer_id)+'&order_no=eq.'+encodeURIComponent(orderNo)+'&limit=1');
  const current=rows?.[0];if(!current)throw Object.assign(new Error('Pesanan tidak ditemukan.'),{status:404});
  const total=Number(current.total),environment=cfg.environment,invoice=('BB'+current.id.replaceAll('-','').slice(0,16)+randomHex(6)).slice(0,30);
  if(!Number.isSafeInteger(total)||total<1||current.currency!=='IDR')throw Object.assign(new Error('Total pesanan tidak valid.'),{status:409});
  const claim=await claimDokuPayment(current.id,invoice,rpc);
  if(!claim.claimed){
    const previous=claim.payment;
    if(previous.provider==='doku'&&previous.environment===environment&&safePaymentUrl(previous.redirect_url,environment)&&['created','pending','authorized','failed'].includes(previous.status))return {ok:true,redirect_url:previous.redirect_url,reused:true};
    throw Object.assign(new Error('Pembayaran sebelumnya perlu diperiksa admin.'),{status:409});
  }
  const address=current.shipping_address||{};
  const body={order:{amount:total,invoice_number:invoice,currency:'IDR',callback_url:'https://bisabikinweb.site/account/?order='+encodeURIComponent(orderNo),line_items:current.items.map((x:any)=>({name:String(x.name).slice(0,255),price:Number(x.price),quantity:Number(x.quantity)}))},payment:{payment_due_date:30,type:'SALE'},customer:{name:current.customer_name,email:current.customer_email,phone:current.customer_phone,address:String(address.address||'').slice(0,400),city:address.city,state:address.province,postcode:address.postcode,country:'ID'},additional_info:{override_notification_url:(Deno.env.get('SUPABASE_URL')||'')+'/functions/v1/bbweb-doku-webhook'}};
  let response:Response;
  try{response=await dokuRequest('/checkout/v1/payment',body)}catch{
    await db('bbweb_merch_payments?merchant_order_id=eq.'+invoice,{method:'PATCH',body:JSON.stringify({status:'unknown'})});
    throw Object.assign(new Error('Respons DOKU belum pasti. Periksa status sebelum mencoba lagi.'),{status:502});
  }
  const result=await response.json().catch(()=>null),url=result?.response?.payment?.url;
  if(!response.ok||!safePaymentUrl(url,environment)){
    await db('bbweb_merch_payments?merchant_order_id=eq.'+invoice,{method:'PATCH',body:JSON.stringify({status:response.status>=400&&response.status<500?'failed':'unknown',status_code:String(response.status)})});
    throw Object.assign(new Error('Halaman pembayaran DOKU belum tersedia. Hubungi admin.'),{status:502});
  }
  await db('bbweb_merch_payments?merchant_order_id=eq.'+invoice+'&status=eq.created',{method:'PATCH',body:JSON.stringify({status:'pending',redirect_url:url,transaction_status:'PENDING'})});
  return {ok:true,redirect_url:url,reused:false};
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply({ error: 'Origin not allowed' }, 403, origin);
  if (Number(req.headers.get('content-length') || 0) > 32768) return reply({ error: 'Payload terlalu besar.' }, 413, origin);
  let user: any;
  try { user = await authenticate(req); }
  catch (error) { return reply({ error: clean((error as Error)?.message || error, 240) || 'Autentikasi gagal.' }, Number((error as any)?.status || 401), origin); }
  let input: any;
  try { input = await req.json(); } catch { return reply({ error: 'Payload JSON tidak valid.' }, 400, origin); }
  const action = clean(input?.action, 40);
  try {
    if (action === 'dashboard') return reply(await getDashboard(user), 200, origin);
    if (action === 'save_profile') {
      const p = input?.profile || {};
      const fullName = clean(p.full_name, 120);
      const phone = normalizePhone(p.phone);
      const company = clean(p.company, 160);
      const a = p.default_shipping_address && typeof p.default_shipping_address === 'object' ? p.default_shipping_address : {};
      const address = { address: clean(a.address, 700), district: clean(a.district, 120), city: clean(a.city, 120), province: clean(a.province, 120), postcode: clean(a.postcode, 6) };
      if (fullName.length < 2) return reply({ error: 'Nama lengkap minimal 2 karakter.' }, 400, origin);
      if (phone.replace(/\D/g, '').length < 8) return reply({ error: 'Nomor WhatsApp belum valid.' }, 400, origin);
      const hasAddress = Object.values(address).some(value => Boolean(value));
      if (hasAddress && (address.address.length < 10 || !address.city || !address.province || !/^[0-9]{5,6}$/.test(address.postcode))) {
        return reply({ error: 'Alamat pengiriman harus berisi alamat lengkap, kota, provinsi, dan kode pos 5–6 digit.' }, 400, origin);
      }
      const rows = await db('bbweb_customer_profiles?on_conflict=user_id', {
        method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ user_id: user.id, full_name: fullName, phone, company, default_shipping_address: address, updated_at: new Date().toISOString() })
      });
      const customer = await findOrLinkCustomer(user);
      if (customer?.id) await db('bbweb_customers?id=eq.' + encodeURIComponent(customer.id), {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ name: fullName, phone, company, last_shipping_address: address, updated_at: new Date().toISOString() })
      });
      const dashboard = await getDashboard(user);
      return reply({ ok: true, profile: Array.isArray(rows) ? rows[0] : dashboard.profile, orders: dashboard.orders }, 200, origin);
    }
    if (action === 'retry_payment') {
      const orderNo = clean(input?.order_no, 80);
      if (!orderNo) return reply({ error: 'Nomor pesanan wajib diisi.' }, 400, origin);
      return reply(await retryPayment(user, orderNo), 200, origin);
    }
    return reply({ error: 'Aksi dashboard tidak dikenal.' }, 400, origin);
  } catch (error) {
    const status = Number((error as any)?.status || 500);
    const message = status >= 500 ? 'Permintaan belum dapat diproses. Coba refresh; jika berulang, hubungi admin.' : clean((error as Error)?.message || error, 240);
    return reply({ error: message }, status, origin);
  }
});
