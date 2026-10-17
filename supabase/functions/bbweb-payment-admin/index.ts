const ALLOWED_ORIGINS = new Set(['https://bisabikinweb.site', 'https://www.bisabikinweb.site']);
function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try { const parsed = JSON.parse(modern); const value = parsed?.default || Object.values(parsed || {})[0]; if (typeof value === 'string' && value) return value; } catch {}
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
}
function publicKey() {
  return Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || secretKey();
}
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
async function db(path: string, options: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = secretKey();
  if (!url || !key) throw new Error('Supabase server credentials unavailable');
  const headers = new Headers(options.headers || {});
  headers.set('apikey', key);
  headers.set('Authorization', 'Bearer ' + key);
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
  if (!/^Bearer\s+\S+$/i.test(authorization)) throw Object.assign(new Error('Login admin diperlukan.'), { status: 401 });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const response = await fetch(url + '/auth/v1/user', { headers: { apikey: publicKey(), Authorization: authorization, Accept: 'application/json' } });
  const raw = await response.text();
  let user: any = null;
  if (raw) { try { user = JSON.parse(raw); } catch {} }
  if (!response.ok || !user?.id || !user?.email) throw Object.assign(new Error('Sesi login tidak valid. Silakan login kembali.'), { status: 401 });
  if (!(user.email_confirmed_at || user.confirmed_at)) throw Object.assign(new Error('Verifikasi email admin belum selesai.'), { status: 403 });
  const email = String(user.email).trim().toLowerCase();
  const allowed = await db('bbweb_admin_allowlist?select=email,label&email=eq.' + encodeURIComponent(email) + '&limit=1');
  if (!Array.isArray(allowed) || !allowed.length) throw Object.assign(new Error('Akun ini tidak memiliki akses Payment Gateway.'), { status: 403 });
  return user;
}
function mapStatus(transaction: string, fraud?: string) {
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
async function dashboardData() {
  const payments = await db('bbweb_merch_payments?select=id,order_id,merchant_order_id,amount,currency,provider,environment,status,transaction_status,transaction_id,payment_type,fraud_status,status_code,redirect_url,created_at,updated_at,paid_at&order=created_at.desc&limit=100');
  const rows = Array.isArray(payments) ? payments : [];
  const ids = [...new Set(rows.map((x: any) => String(x.order_id || '')).filter((x: string) => /^[0-9a-f-]{36}$/i.test(x)))];
  const orderRows = ids.length ? await db('bbweb_orders?select=id,order_no,customer_id,customer_name,customer_email,customer_phone,items,subtotal,discount,total,currency,status,payment_status,shipping_address,created_at,paid_at&id=in.(' + ids.join(',') + ')') : [];
  const orderMap = new Map<string, any>((Array.isArray(orderRows) ? orderRows : []).map((x: any) => [String(x.id), x]));
  const enriched = rows.map((payment: any) => ({ ...payment, order: orderMap.get(String(payment.order_id)) || null }));
  const paid = enriched.filter((x: any) => x.status === 'paid');
  const summary = {
    transactions: enriched.length,
    paid: paid.length,
    pending: enriched.filter((x: any) => ['created', 'pending', 'authorized', 'unknown'].includes(String(x.status))).length,
    failed: enriched.filter((x: any) => ['failed', 'cancelled', 'expired', 'payment_error'].includes(String(x.status))).length,
    refunded: enriched.filter((x: any) => ['refunded', 'partial_refund'].includes(String(x.status))).length,
    paid_amount: paid.reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0)
  };
  return {
    ok: true,
    payments: enriched,
    summary,
    midtrans: {
      environment: (Deno.env.get('MIDTRANS_ENV') || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox',
      server_key_configured: Boolean(Deno.env.get('MIDTRANS_SERVER_KEY')),
      webhook_url: (Deno.env.get('SUPABASE_URL') || '') + '/functions/v1/bbweb-midtrans-webhook'
    },
    generated_at: new Date().toISOString()
  };
}
async function refreshPayment(paymentId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) throw Object.assign(new Error('ID transaksi tidak valid.'), { status: 400 });
  const rows = await db('bbweb_merch_payments?select=id,order_id,merchant_order_id,amount,currency,environment,status,transaction_status,transaction_id,payment_type,fraud_status,status_code,created_at,paid_at&id=eq.' + encodeURIComponent(paymentId) + '&limit=1');
  const payment = Array.isArray(rows) ? rows[0] : null;
  if (!payment) throw Object.assign(new Error('Transaksi tidak ditemukan.'), { status: 404 });
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') || '';
  if (!serverKey) throw Object.assign(new Error('Midtrans Server Key belum dikonfigurasi di Supabase Edge Function Secrets.'), { status: 503 });
  const environment = String(payment.environment || Deno.env.get('MIDTRANS_ENV') || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
  const base = environment === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  let response: Response;
  try {
    response = await fetch(base + '/v2/' + encodeURIComponent(payment.merchant_order_id) + '/status', {
      headers: { Accept: 'application/json', Authorization: 'Basic ' + btoa(serverKey + ':') },
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw Object.assign(new Error('Tidak dapat menghubungi Midtrans. Coba beberapa saat lagi.'), { status: 502 });
  }
  const raw = await response.text();
  let result: any = null;
  if (raw) { try { result = JSON.parse(raw); } catch { result = { message: raw }; } }
  if (!response.ok) {
    if (response.status === 401) throw Object.assign(new Error('Midtrans menolak autentikasi. Periksa Server Key dan mode Sandbox/Production.'), { status: 502 });
    if (response.status === 404) throw Object.assign(new Error('Transaksi tidak ditemukan pada akun atau mode Midtrans ini.'), { status: 404 });
    throw Object.assign(new Error('Midtrans gagal memberikan status transaksi (' + response.status + ').'), { status: 502 });
  }
  if (String(result?.order_id || '') !== String(payment.merchant_order_id)) throw Object.assign(new Error('Order ID dari Midtrans tidak cocok. Status tidak diubah.'), { status: 409 });
  const receivedAmount = Math.round(Number(result?.gross_amount));
  if (!Number.isFinite(receivedAmount) || receivedAmount !== Number(payment.amount)) throw Object.assign(new Error('Nominal dari Midtrans tidak cocok. Status tidak diubah.'), { status: 409 });
  const mapped = mapStatus(String(result?.transaction_status || ''), result?.fraud_status);
  const now = new Date().toISOString();
  const update: any = {
    status: mapped,
    transaction_status: String(result?.transaction_status || ''),
    transaction_id: result?.transaction_id || null,
    payment_type: result?.payment_type || null,
    fraud_status: result?.fraud_status || null,
    status_code: result?.status_code || null,
    updated_at: now
  };
  if (mapped === 'paid' && !payment.paid_at) update.paid_at = now;
  await db('bbweb_merch_payments?id=eq.' + encodeURIComponent(payment.id), {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(update)
  });
  if (mapped === 'paid') {
    await rpc('bbweb_commit_merch_order', { p_order_id: payment.order_id });
  } else if (mapped === 'pending' || mapped === 'authorized') {
    await db('bbweb_orders?id=eq.' + encodeURIComponent(payment.order_id) + '&payment_status=neq.paid', {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: mapped, status: 'waiting_payment', updated_at: now })
    }).catch(() => {});
  } else if (mapped === 'refunded' || mapped === 'partial_refund') {
    await db('bbweb_orders?id=eq.' + encodeURIComponent(payment.order_id), {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: mapped, status: mapped, updated_at: now })
    }).catch(() => {});
  } else if (['failed', 'cancelled', 'expired'].includes(mapped)) {
    const others = await db('bbweb_merch_payments?select=id&order_id=eq.' + encodeURIComponent(payment.order_id) + '&id=neq.' + encodeURIComponent(payment.id) + '&status=in.(created,pending,authorized,unknown,paid)&limit=1').catch(() => []);
    if (!Array.isArray(others) || others.length === 0) {
      const orderStatus = mapped === 'expired' ? 'expired' : mapped === 'cancelled' ? 'cancelled' : 'payment_error';
      await rpc('bbweb_release_merch_order', { p_order_id: payment.order_id, p_payment_status: mapped, p_status: orderStatus }).catch(() => {});
    }
  }
  return { id: payment.id, status: mapped, transaction_status: update.transaction_status, transaction_id: update.transaction_id, payment_type: update.payment_type, environment, refreshed_at: now };
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
    if (action === 'dashboard') return reply(await dashboardData(), 200, origin);
    if (action === 'refresh') {
      const refreshed = await refreshPayment(clean(input?.payment_id, 80));
      return reply({ ok: true, refreshed, data: await dashboardData() }, 200, origin);
    }
    return reply({ error: 'Aksi Payment Gateway tidak dikenal.' }, 400, origin);
  } catch (error) {
    const status = Number((error as any)?.status || 500);
    const message = status >= 500 ? clean((error as Error)?.message || error, 220) : clean((error as Error)?.message || error, 240);
    return reply({ error: message || 'Permintaan tidak dapat diproses.' }, status, origin);
  }
});
