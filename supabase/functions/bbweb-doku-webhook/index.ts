import {verifyNotification, applyDokuResult, config} from '../_shared/doku.ts';
function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try { const parsed = JSON.parse(modern); const value = parsed?.default || Object.values(parsed || {})[0]; if (typeof value === 'string' && value) return value; } catch {}
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
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

Deno.serve(async(req:Request)=>{
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const raw=await req.text();
  if(new TextEncoder().encode(raw).length>65536)return reply({error:'Payload too large'},413);
  if(!await verifyNotification(req.headers,raw))return reply({error:'Invalid signature'},401);
  let input:any;try{input=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
  const invoice=String(input?.order?.invoice_number||'');
  if(!/^[A-Za-z0-9-]{1,64}$/.test(invoice))return reply({error:'Invalid invoice'},400);
  try{
    const rows=await db('bbweb_merch_payments?select=*&provider=eq.doku&merchant_order_id=eq.'+encodeURIComponent(invoice)+'&limit=1');
    const payment=rows?.[0];if(!payment)return reply({error:'Invoice not found'},404);
    if(payment.environment!==config().environment)return reply({error:'Payment environment mismatch'},409);
    await applyDokuResult(payment,input,db,rpc);
    return reply({message:'Notification received'});
  }catch{return reply({error:'Notification could not be processed'},500)}
});
