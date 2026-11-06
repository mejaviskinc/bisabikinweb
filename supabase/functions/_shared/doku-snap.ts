
/**
 * DOKU BI-SNAP direct-payment primitives.
 * The merchant's RSA private key and SNAP client secret stay on Supabase only.
 * Endpoint/signature formats: developers.doku.com/get-started-with-doku-api/signature-component/snap
 */
const te=new TextEncoder();
function b64(bytes:ArrayBuffer){return btoa(String.fromCharCode(...new Uint8Array(bytes)))}
function amount(value:number){if(!Number.isSafeInteger(value)||value<1)return '';return value.toFixed(2)}
function timestamp(){return new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}
function numericRequestId(){const a=crypto.getRandomValues(new Uint8Array(16));return Array.from(a,x=>String(x%10)).join('')}
function pemBytes(input:string){
 const pem=input.replace(/\\n/g,'\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 if(!/^[A-Za-z0-9+/=]+$/.test(pem))throw new Error('DOKU_SNAP_PRIVATE_KEY harus PKCS8 PEM.');
 return Uint8Array.from(atob(pem),x=>x.charCodeAt(0)).buffer;
}
async function sha256hex(value:string){
 const a=new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(value)));
 return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
}
async function asymmetric(privateKey:string,toSign:string){
 const key=await crypto.subtle.importKey('pkcs8',pemBytes(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 return b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,te.encode(toSign)));
}
async function symmetric(secret:string,toSign:string){
 const key=await crypto.subtle.importKey('raw',te.encode(secret),{name:'HMAC',hash:'SHA-512'},false,['sign']);
 return b64(await crypto.subtle.sign('HMAC',key,te.encode(toSign)));
}
export type SnapMethod='snap_qris'|'snap_va_bca'|'snap_va_bri';
export function snapConfig(method?:SnapMethod){
 const enabled=Deno.env.get('DOKU_SNAP_ENABLED')==='true';
 const environment=Deno.env.get('DOKU_SNAP_ENV')||'sandbox';
 if(!['sandbox','production'].includes(environment))throw new Error('SNAP_CONFIG_INVALID_ENV');
 const configured=Boolean(enabled&&(environment==='sandbox'||Deno.env.get('DOKU_SNAP_PRODUCTION_CONFIRMED')==='true')&&
  Deno.env.get('DOKU_SNAP_CLIENT_ID')&&Deno.env.get('DOKU_SNAP_CLIENT_SECRET')&&Deno.env.get('DOKU_SNAP_PRIVATE_KEY'));
 const qr=Boolean(configured&&Deno.env.get('DOKU_SNAP_QRIS_MERCHANT_ID')&&Deno.env.get('DOKU_SNAP_QRIS_TERMINAL_ID')&&Deno.env.get('DOKU_SNAP_QRIS_POSTAL_CODE'));
 const bca=Boolean(configured&&/^\d{1,8}$/.test(Deno.env.get('DOKU_SNAP_VA_BCA_PARTNER_SERVICE_ID')||''));
 const bri=Boolean(configured&&/^\d{1,8}$/.test(Deno.env.get('DOKU_SNAP_VA_BRI_PARTNER_SERVICE_ID')||''));
 const ready=method==='snap_qris'?qr:method==='snap_va_bca'?bca:method==='snap_va_bri'?bri:configured;
 return {configured,ready,qr,bca,bri,environment,base:environment==='production'?'https://api.doku.com':'https://api-sandbox.doku.com',
  clientId:Deno.env.get('DOKU_SNAP_CLIENT_ID')||'',secret:Deno.env.get('DOKU_SNAP_CLIENT_SECRET')||'',
  privateKey:Deno.env.get('DOKU_SNAP_PRIVATE_KEY')||''};
}
let cached:{token:string,until:number}|null=null;
let inflight:Promise<string>|null=null;
export async function snapToken(){
 const c=snapConfig();if(!c.configured)throw new Error('SNAP_NOT_CONFIGURED');
 if(cached&&cached.until>Date.now()+90000)return cached.token;
 if(inflight)return inflight;
 inflight=(async()=>{
  const ts=timestamp();
  const sig=await asymmetric(c.privateKey,c.clientId+'|'+ts);
  const res=await fetch(c.base+'/authorization/v1/access-token/b2b',{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','X-CLIENT-KEY':c.clientId,'X-TIMESTAMP':ts,'X-SIGNATURE':sig},
   body:JSON.stringify({grantType:'client_credentials'}),signal:AbortSignal.timeout(10000)
  });
  const body=await res.json().catch(()=>null);
  if(!res.ok||body?.responseCode!=='2007300'||!body?.accessToken)throw new Error('SNAP_TOKEN_FAILED');
  const duration=Math.max(120,Math.min(900,Number(body.expiresIn)||900));
  cached={token:String(body.accessToken),until:Date.now()+duration*1000};
  return cached.token;
 })();
 try{return await inflight}finally{inflight=null}
}
export async function snapPost(path:string,body:Record<string,unknown>){
 const c=snapConfig();if(!c.configured)throw new Error('SNAP_NOT_CONFIGURED');
 const allowed=new Set([
  '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate',
  '/snap-adapter/b2b/v1.0/qr/qr-mpm-query',
  '/virtual-accounts/bi-snap-va/v1.1/transfer-va/create-va'
 ]);
 if(!allowed.has(path))throw new Error('SNAP_PATH_NOT_ALLOWED');
 const accessToken=await snapToken(),ts=timestamp(),raw=JSON.stringify(body);
 const sig=await symmetric(c.secret,'POST:'+path+':'+accessToken+':'+await sha256hex(raw)+':'+ts);
 const res=await fetch(c.base+path,{method:'POST',headers:{
  'X-PARTNER-ID':c.clientId,'X-EXTERNAL-ID':numericRequestId(),'X-TIMESTAMP':ts,'X-SIGNATURE':sig,
  'Authorization':'Bearer '+accessToken,'CHANNEL-ID':'H2H','Content-Type':'application/json',Accept:'application/json'},
  body:raw,signal:AbortSignal.timeout(12000)});
 const result=await res.json().catch(()=>null);
 if(!res.ok||!result||typeof result!=='object')throw new Error('SNAP_GATEWAY_'+res.status);
 return result;
}
export async function createSnap(method:SnapMethod, invoice:string, total:number, customer:any){
 const c=snapConfig(method);if(!c.ready)throw new Error('SNAP_NOT_CONFIGURED');
 if(!/^[A-Za-z0-9]{1,30}$/.test(invoice)||!amount(total))throw new Error('SNAP_INVALID_ORDER');
 if(method==='snap_qris'){
  const body={
   partnerReferenceNo:invoice,amount:{value:amount(total),currency:'IDR'},
   merchantId:Deno.env.get('DOKU_SNAP_QRIS_MERCHANT_ID')!,
   terminalId:Deno.env.get('DOKU_SNAP_QRIS_TERMINAL_ID')!,
   validityPeriod:new Date(Date.now()+30*60*1000).toISOString().replace('Z','+00:00'),
   additionalInfo:{postalCode:Deno.env.get('DOKU_SNAP_QRIS_POSTAL_CODE'),feeType:'1'}
  };
  const result=await snapPost('/snap-adapter/b2b/v1.0/qr/qr-mpm-generate',body);
  if(result.responseCode!=='2004700'||result.partnerReferenceNo!==invoice||
     typeof result.qrContent!=='string'||result.qrContent.length<80||result.qrContent.length>1024)
    throw new Error('SNAP_QRIS_INVALID_RESPONSE');
  return {type:'qris',qr_content:result.qrContent,reference_no:String(result.referenceNo||invoice),
   expires_at:String(result?.additionalInfo?.validityPeriod||body.validityPeriod)};
 }
 const bank=method==='snap_va_bca'?'BCA':'BRI',partner=(Deno.env.get('DOKU_SNAP_VA_'+bank+'_PARTNER_SERVICE_ID')||'').padStart(8,' ');
 // Order invoices are unique; the VA customer number is deterministic for checkout retries.
 const digits=Array.from(invoice).reduce((n,c)=>n+String(c.charCodeAt(0)).padStart(3,'0'),'').slice(-20).padStart(20,'0');
 const virtualAccountNo=partner+digits;
 const body={
  partnerServiceId:partner,customerNo:digits,virtualAccountNo,
  virtualAccountName:String(customer.name||'Pelanggan').slice(0,120),
  virtualAccountEmail:String(customer.email||'').slice(0,254),
  virtualAccountPhone:String(customer.phone||'').slice(0,30),
  trxId:invoice,totalAmount:{value:amount(total),currency:'IDR'},
  virtualAccountTrxType:'C',
  expiredDate:new Date(Date.now()+30*60*1000).toISOString().replace('Z','+00:00'),
  additionalInfo:{channel:'VIRTUAL_ACCOUNT_'+bank}
 };
 const result=await snapPost('/virtual-accounts/bi-snap-va/v1.1/transfer-va/create-va',body);
 const va=result?.virtualAccountData;
 const amountOk=va?.totalAmount?.value==null||(Number(va.totalAmount.value)===total&&va.totalAmount.currency==='IDR');
 if(result?.responseCode!=='2002700'||!va||va.trxId!==invoice||!amountOk||
  typeof va.virtualAccountNo!=='string'||!/^[\d ]{8,28}$/.test(va.virtualAccountNo)||
  va.virtualAccountNo.replace(/\s/g,'')!==virtualAccountNo.replace(/\s/g,''))
  throw new Error('SNAP_VA_INVALID_RESPONSE');
 return {type:'virtual_account',bank,virtual_account_no:va.virtualAccountNo.replace(/\s/g,''),
  expires_at:String(va.expiredDate||body.expiredDate)};
}
export async function querySnapQris(invoice:string,reference:string){
 const c=snapConfig('snap_qris');if(!c.ready)throw new Error('SNAP_NOT_CONFIGURED');
 const result=await snapPost('/snap-adapter/b2b/v1.0/qr/qr-mpm-query',{
  originalReferenceNo:reference,originalPartnerReferenceNo:invoice,
  serviceCode:'47',merchantId:Deno.env.get('DOKU_SNAP_QRIS_MERCHANT_ID')!
 });
 if(result.responseCode!=='2005100'||result.originalPartnerReferenceNo!==invoice)return {status:'unknown' as const};
 if(result.latestTransactionStatus==='00' && result.amount?.currency==='IDR'&&Number(result.amount.value)>0)
  return {status:'paid' as const,amount:Number(result.amount.value),referenceNo:String(result.originalReferenceNo||reference)};
 return {status:'pending' as const};
}
/** Verify a DOKU SNAP webhook's exact raw body + registered endpoint path before parsing. */
export async function verifySnapWebhook(req:Request,raw:string,canonicalPath:string){
 const c=snapConfig();if(!c.configured)return false;
 const partner=req.headers.get('x-partner-id')||'';
 const received=req.headers.get('x-signature')||'';
 const stamp=req.headers.get('x-timestamp')||'';
 if(partner!==c.clientId||!received||!stamp||Math.abs(Date.now()-Date.parse(stamp))>300000)return false;
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'')||'';
 // SNAP webhook integrations can use a DOKU-generated access token. Never assume a
 // static incoming token; validate against the merchant-configured notification token.
 const verifiedToken=Deno.env.get('DOKU_SNAP_NOTIFICATION_TOKEN')||'';
 if(!verifiedToken||token!==verifiedToken)return false;
 const expected=await symmetric(c.secret,'POST:'+canonicalPath+':'+token+':'+await sha256hex(raw)+':'+stamp);
 if(expected.length!==received.length)return false;
 let diff=0;for(let i=0;i<received.length;i++)diff|=received.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
