// BisaBikinWeb - fixed-egress Digiflazz Buyer gateway: READ-ONLY rollout.
// Run on a VPS with a public static OUTBOUND IP, behind HTTPS reverse proxy.
import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
const ORIGIN = 'https://api.digiflazz.com';
function send(res, status, data) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(data));
}
function validToken(given, expected) {
  if (typeof given !== 'string' || !expected || !given || given.length > 256) return false;
  const a=Buffer.from(given),b=Buffer.from(expected);
  return a.length===b.length && timingSafeEqual(a,b);
}
async function readJson(req) {
  if (!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) throw Object.assign(new Error('content_type_required'),{status:415});
  if (Number(req.headers['content-length']||0)>2048) throw Object.assign(new Error('payload_too_large'),{status:413});
  let size=0,body='';
  for await (const chunk of req) {size+=chunk.length;if(size>2048)throw Object.assign(new Error('payload_too_large'),{status:413});body+=chunk.toString('utf8');}
  try {return JSON.parse(body)} catch {throw Object.assign(new Error('invalid_json'),{status:400});}
}
export function createDigiflazzGateway({env=process.env,fetchImpl=fetch,logger=console}={}) {
  const token=String(env.BBWEB_EGRESS_SHARED_SECRET||'').trim(),username=String(env.DIGIFLAZZ_USERNAME||'').trim(),apiKey=String(env.DIGIFLAZZ_API_KEY||'').trim();
  const configured=token.length>=32&&username.length>0&&apiKey.length>0;
  let start=Date.now(),uses=0;
  return createServer(async(req,res)=>{
    if(req.method==='GET'&&req.url==='/health')return send(res,configured?200:503,{ready:configured});
    if(req.method!=='POST'||req.url!=='/api/price-list')return send(res,404,{error:'not_found'});
    if(!configured)return send(res,503,{error:'not_configured'});
    if(!validToken(req.headers['x-bbweb-egress-token'],token))return send(res,401,{error:'unauthorized'});
    if(Date.now()-start>=60000){start=Date.now();uses=0}
    if(++uses>12)return send(res,429,{error:'rate_limited'});
    let input;try{input=await readJson(req)}catch(e){return send(res,e.status||400,{error:e.message||'invalid_request'})}
    if(!input||typeof input!=='object'||Array.isArray(input)||!['prepaid','pasca'].includes(input.cmd)||Object.keys(input).some(k=>k!=='cmd'))return send(res,400,{error:'invalid_command'});
    const body={cmd:input.cmd,username,sign:createHash('md5').update(username+apiKey+'pricelist').digest('hex')};
    try {
      const upstream=await fetchImpl(ORIGIN+'/v1/price-list',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
      if(!upstream.ok){logger.error('Digiflazz HTTP status:',upstream.status);return send(res,502,{error:'digiflazz_unavailable'})}
      const raw=await upstream.text();if(raw.length>3000000)return send(res,502,{error:'upstream_response_too_large'});
      let parsed;try{parsed=JSON.parse(raw)}catch{return send(res,502,{error:'bad_upstream_response'})}
      return send(res,200,parsed);
    }catch(e){logger.error('Digiflazz request failed:',e.name==='TimeoutError'?'timeout':'network_error');return send(res,502,{error:'digiflazz_unavailable'})}
  });
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href) {
  createDigiflazzGateway().listen(Number(process.env.PORT||8787),'127.0.0.1',()=>console.log('Digiflazz gateway: localhost only'));
}
