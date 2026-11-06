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
  // DOKU Checkout lets buyers retry a failed payment method on the same checkout page.
  // Per DOKU's Checkout notification guidance, FAILED must not close the order.
  return ({SUCCESS:'paid',PENDING:'pending',REDIRECT:'pending',FAILED:'pending',EXPIRED:'expired',REFUNDED:'refunded',TIMEOUT:'unknown'} as Record<string,string>)[status] || 'unknown';
}
export function validateResult(payment: any, result: any) {
  const amount = result?.order?.amount;
  if (result?.order?.invoice_number !== payment.merchant_order_id || amount === null || amount === undefined || String(amount).trim() === '' || !Number.isSafeInteger(Number(amount)) || Number(amount) !== Number(payment.amount)) throw new Error('Invoice atau nominal DOKU tidak cocok.');
  if (result.order.currency && result.order.currency !== 'IDR') throw new Error('Mata uang DOKU tidak cocok.');
}
export async function applyDokuResult(payment: any, result: any, db: any, rpc: any) {
  validateResult(payment,result);
  const status = dokuStatus(String(result?.transaction?.status || ''),String(result?.transaction?.type || ''));
  const updated=await rpc('bbweb_apply_doku_payment',{
    p_payment_id:payment.id,p_invoice:payment.merchant_order_id,p_amount:Number(payment.amount),
    p_status:status,p_transaction_status:String(result?.transaction?.status||'').slice(0,50),
    p_payment_type:String(result?.channel?.id||result?.service?.id||'').slice(0,100)
  });
  if(!updated?.id)throw new Error('DOKU settlement runtime belum tersedia.');
  return updated;
}

export async function refreshDoku(payment: any, db: any, rpc: any) {
  if (Date.now()-Date.parse(payment.created_at) < 60000) return payment;
  const allowed=await rpc('bbweb_take_doku_poll_slot',{p_payment_id:payment.id});
  if(allowed!==true)return payment;
  const response = await dokuRequest('/orders/v1/status/'+encodeURIComponent(payment.merchant_order_id),undefined,payment.environment);
  if (!response.ok) throw new Error('Status DOKU belum tersedia ('+response.status+').');
  return applyDokuResult(payment,await response.json(),db,rpc);
}
export function safePaymentUrl(value: unknown, environment: string) {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && url.hostname === (environment === 'production' ? 'checkout.doku.com' : 'sandbox.doku.com') && !url.username && !url.password; } catch { return false; }
}

export async function claimDokuPayment(orderId: string, invoice: string, rpc: any) {
  const claim=await rpc('bbweb_claim_doku_payment',{p_order_id:orderId,p_invoice:invoice,p_environment:config().environment});
  if(typeof claim?.claimed!=='boolean'||!claim?.payment?.id)throw new Error('DOKU checkout runtime belum tersedia.');
  return claim;
}
