import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';

const ROOT='bisabikinweb.site';
const targets=templateSlugOrder.map((slug,i)=>({name:'template'+(i+1)+'.'+ROOT,type:'CNAME',content:ROOT,proxied:true,ttl:1,slug}));
const apply=process.argv.includes('--apply');
if(!apply){
 console.log(JSON.stringify({mode:'dry-run',targetCount:targets.length,records:targets},null,2));
 console.log('No DNS was changed. For activation set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID then run with --apply.');
 process.exit(0);
}

const token=process.env.CLOUDFLARE_API_TOKEN;
const zone=process.env.CLOUDFLARE_ZONE_ID;
if(!token||!zone)throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required for --apply');
if(!/^[a-zA-Z0-9_-]{20,}$/.test(token)||!/^[a-f0-9]{32}$/i.test(zone))throw new Error('Invalid Cloudflare credentials format');

const base='https://api.cloudflare.com/client/v4/zones/'+zone+'/dns_records';
async function call(url,init={}){
 const response=await fetch(url,{...init,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(init.headers||{})},signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 if(!response.ok||!data.success)throw new Error('Cloudflare DNS error '+response.status+': '+JSON.stringify(data.errors||[]));
 return data;
}
let created=0,already=0;
for(const record of targets){
 const url=new URL(base);
 url.searchParams.set('name',record.name);
 url.searchParams.set('per_page','100');
 const existing=(await call(url)).result||[];
 if(existing.length){
  if(existing.length===1 && existing[0].type==='CNAME' && existing[0].content.toLowerCase().replace(/\.$/,'')===ROOT && existing[0].proxied===true) {
   already++;
   continue;
  }
  throw new Error('DNS conflict for '+record.name+'; refusing to overwrite an existing record');
 }
 const {slug,...dns}=record;
 await call(base,{method:'POST',body:JSON.stringify({...dns,comment:'BisaBikinWeb demo '+slug})});
 created++;
 console.log('Created '+record.name+' => '+slug);
}
console.log(JSON.stringify({created,already,targetCount:targets.length}));
