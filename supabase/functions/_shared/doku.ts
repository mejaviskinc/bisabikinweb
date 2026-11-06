const encoder = new TextEncoder();
function base64(value: ArrayBuffer) { return btoa(String.fromCharCode(...new Uint8Array(value))); }
export async function signature(secret: string, clientId: string, requestId: string, timestamp: string, target: string, body?: string) {
  const components = [`Client-Id:${clientId}`, `Request-Id:${requestId}`, `Request-Timestamp:${timestamp}`, `Request-Target:${target}`];
  if (body !== undefined) components.push('Digest:' + base64(await crypto.subtle.digest('SHA-256', encoder.encode(body))));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return 'HMACSHA256=' + base64(await crypto.subtle.sign('HMAC', key, encoder.encode(components.join('\n'))));
}
export function config() {
  const clientId = Deno.env.get('DOKU_CLIENT_ID') || '', secret = Deno.env.get('DOKU_SECRET_KEY') || '';
  const environment = Deno.env.get('DOKU_ENV') || 'sandbox';
  if (!['sandbox','production'].includes(environment)) throw new Error('DOKU_ENV tidak valid.');
  return {clientId, secret, environment, base:environment === 'production' ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'};
}
export async function dokuRequest(path: string, body?: any, environment?: string) {
  const cfg = config();
  if (!cfg.clientId || !cfg.secret) throw new Error('DOKU Client ID dan Secret Key belum dikonfigurasi.');
  if (environment && environment !== cfg.environment) throw new Error('Mode transaksi berbeda dari kredensial DOKU aktif.');
  const raw = body === undefined ? undefined : JSON.stringify(body);
  const id = crypto.randomUUID(), timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  return fetch(cfg.base + path, {method:raw === undefined ? 'GET' : 'POST', headers:{'Client-Id':cfg.clientId,'Request-Id':id,'Request-Timestamp':timestamp,Signature:await signature(cfg.secret,cfg.clientId,id,timestamp,path,raw),Accept:'application/json','Content-Type':'application/json'}, body:raw, signal:AbortSignal.timeout(12000)});
}
export async function verifyNotification(headers: Headers, body: string) {
  const cfg = config(), client = headers.get('client-id') || '', id = headers.get('request-id') || '', timestamp = headers.get('request-timestamp') || '';
  // Use the public notification path: Supabase's internal request URL can be rewritten.
  if (!cfg.secret || !cfg.clientId || client !== cfg.clientId || !id || id.length > 128 || !Number.isFinite(Date.parse(timestamp))) return false;
  const expected = await signature(cfg.secret,client,id,timestamp,'/functions/v1/bbweb-doku-webhook',body);
  const received = headers.get('signature') || '';
  if (received.length !== expected.length) return false;
  let difference = 0;
  for (let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return difference === 0;
}
export function dokuStatus(status: string, type = '') {
  if (status === 'SUCCESS' && type === 'AUTHORIZE') return 'authorized';
  return ({SUCCESS:'paid',PENDING:'pending',REDIRECT:'pending',FAILED:'failed',EXPIRED:'expired',REFUNDED:'refunded',TIMEOUT:'unknown'} as Record<string,string>)[status] || 'unknown';
}
export function validateResult(payment: any, result: any) {
  const amount = result?.order?.amount;
  if (result?.order?.invoice_number !== payment.merchant_order_id || amount === null || amount === undefined || String(amount).trim() === '' || !Number.isSafeInteger(Number(amount)) || Number(amount) !== Number(payment.amount)) throw new Error('Invoice atau nominal DOKU tidak cocok.');
  if (result.order.currency && result.order.currency !== 'IDR') throw new Error('Mata uang DOKU tidak cocok.');
}
export async function applyDokuResult(payment: any, result: any, db: any, rpc: any) {
  validateResult(payment,result);
  const status = dokuStatus(String(result?.transaction?.status || ''),String(result?.transaction?.type || ''));
  // SUCCESS is committed by the existing idempotent stock/seller settlement RPC.
  // Never downgrade paid or refunded records on delayed/replayed notifications.
  if (payment.status === 'refunded' || (payment.paid_at && !['paid','refunded'].includes(status))) return payment;
  const now = new Date().toISOString();
  if (status === 'paid') await rpc('bbweb_commit_merch_order',{p_order_id:payment.order_id});
  const patch: any = {status,transaction_status:String(result?.transaction?.status || '').slice(0,50),payment_type:String(result?.channel?.id || result?.service?.id || '').slice(0,100),updated_at:now};
  if (status === 'paid') patch.paid_at = payment.paid_at || now;
  // Conditional update prevents pending/failed notifications from winning a concurrent success.
  const guard = ['paid','refunded'].includes(status) ? (status === 'paid' ? '&status=neq.refunded' : '') : '&paid_at=is.null&status=not.in.(paid,refunded)';
  await db('bbweb_merch_payments?id=eq.'+encodeURIComponent(payment.id)+guard,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
  if (status === 'refunded') await db('bbweb_orders?id=eq.'+encodeURIComponent(payment.order_id),{method:'PATCH',body:JSON.stringify({payment_status:'refunded',updated_at:now})});
  // FAILED may be retried on DOKU's hosted page. Do not release stock on a failed attempt.
  return {...payment,...patch};
}
export async function refreshDoku(payment: any, db: any, rpc: any) {
  if (Date.now()-Date.parse(payment.created_at) < 60000) return payment;
  const response = await dokuRequest('/orders/v1/status/'+encodeURIComponent(payment.merchant_order_id),undefined,payment.environment);
  if (!response.ok) throw new Error('Status DOKU belum tersedia ('+response.status+').');
  return applyDokuResult(payment,await response.json(),db,rpc);
}
export function safePaymentUrl(value: unknown, environment: string) {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && url.hostname === (environment === 'production' ? 'checkout.doku.com' : 'sandbox.doku.com') && !url.username && !url.password; } catch { return false; }
}
