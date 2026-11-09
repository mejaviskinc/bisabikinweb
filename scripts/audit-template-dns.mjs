import dns from 'node:dns/promises';
import {writeFile,mkdir} from 'node:fs/promises';
import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';

const zone='bisabikinweb.site';
const samples=[1,9,17,60];
const report={checkedAt:new Date().toISOString(),zone,templateCount:templateSlugOrder.length,nameservers:[],nameserverError:null,checks:[]};
try{report.nameservers=await dns.resolveNs(zone)}catch(error){report.nameserverError=String(error.code||error.message)}
for(const number of samples){
 const hostname='template'+number+'.'+zone;
 const result={hostname,expectedBrandSlug:templateSlugOrder[number-1],ipv4:[],ipv6:[],cname:[],dnsErrors:[],https:null};
 for(const [name,fn] of [['ipv4',()=>dns.resolve4(hostname)],['ipv6',()=>dns.resolve6(hostname)],['cname',()=>dns.resolveCname(hostname)]]){
  try{result[name]=await fn()}catch(error){result.dnsErrors.push(name+': '+String(error.code||error.message))}
 }
 try{
  const response=await fetch('https://'+hostname+'/',{method:'GET',redirect:'manual',signal:AbortSignal.timeout(9000),headers:{Accept:'text/html'}});
  const contentType=response.headers.get('content-type')||'';
  const body=contentType.includes('text/html')?await response.text():'';
  result.https={status:response.status,location:response.headers.get('location'),contentType,containsExpectedBrand:body.toLowerCase().includes(result.expectedBrandSlug.replaceAll('-',' '))||body.includes('DEMO INTERAKTIF'),robots:response.headers.get('x-robots-tag')};
 }catch(error){result.https={error:String(error.cause?.code||error.message)}}
 report.checks.push(result);
 console.log(JSON.stringify({hostname,hasDns:!!(result.ipv4.length||result.ipv6.length||result.cname.length),https:result.https,expectedSlug:result.expectedBrandSlug}));
}
const cloudflareNs=report.nameservers.length>0&&report.nameservers.every(ns=>ns.endsWith('.ns.cloudflare.com'));
report.provider=cloudflareNs?'Cloudflare':report.nameservers.length?'Other / verify authority':'Unknown (NS query failed)';
report.readySamples=report.checks.filter(x=>x.https?.status===200&&x.https?.containsExpectedBrand===true).length;
await mkdir('dns-readiness-report',{recursive:true});
await writeFile('dns-readiness-report/status.json',JSON.stringify(report,null,2));
console.log('NAMESERVERS',report.nameservers.join(', ')||report.nameserverError);
console.log('DNS PROVIDER',report.provider);
console.log('HTTPS READY',report.readySamples+'/'+samples.length+' samples');
if(report.readySamples!==samples.length){
 console.log('Not activating catalog links. DNS, Worker and TLS must be verified before switching readiness flag.');
}
