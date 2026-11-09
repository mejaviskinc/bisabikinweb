import dns from 'node:dns/promises';
import {writeFile,mkdir} from 'node:fs/promises';
import {templateSlugOrder} from '../static-source/lib/template-subdomains.mjs';

const zone='bisabikinweb.site';
const samples=Array.from({length:60},(_,i)=>i+1);
const httpsSamples=new Set([1,9,17,60]);
const report={checkedAt:new Date().toISOString(),zone,templateCount:templateSlugOrder.length,nameservers:[],nameserverError:null,checks:[]};
try{report.nameservers=await dns.resolveNs(zone)}catch(error){report.nameserverError=String(error.code||error.message)}
for(const number of samples){
 const hostname='template'+number+'.'+zone;
 const result={hostname,expectedBrandSlug:templateSlugOrder[number-1],ipv4:[],ipv6:[],cname:[],dnsErrors:[],https:null};
 for(const [name,fn] of [['ipv4',()=>dns.resolve4(hostname)],['ipv6',()=>dns.resolve6(hostname)],['cname',()=>dns.resolveCname(hostname)]]){
  try{result[name]=await fn()}catch(error){result.dnsErrors.push(name+': '+String(error.code||error.message))}
 }
 if(httpsSamples.has(number))try{
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
report.invalidExampleIp=report.checks.filter(x=>x.ipv4.some(ip=>ip.startsWith('192.0.2.')||ip.startsWith('198.51.100.')||ip.startsWith('203.0.113.'))).length;
report.dnsPresent=report.checks.filter(x=>x.ipv4.length||x.ipv6.length||x.cname.length).length;
report.cnameToGithubPages=report.checks.filter(x=>x.cname.some(v=>v.endsWith('.github.io'))).length;
await mkdir('dns-readiness-report',{recursive:true});
await writeFile('dns-readiness-report/status.json',JSON.stringify(report,null,2));
console.log('NAMESERVERS',report.nameservers.join(', ')||report.nameserverError);
console.log('DNS PROVIDER',report.provider);
console.log('DNS CONFIGURED',report.dnsPresent+'/'+samples.length);
console.log('INVALID EXAMPLE IPS',report.invalidExampleIp+'/'+samples.length);
console.log('CNAME TO GITHUB PAGES',report.cnameToGithubPages+'/'+samples.length);
const target='mejaviskinc.github.io';
report.cnameCorrect=report.checks.filter(x=>x.cname.some(v=>v.replace(/\\.$/,'').toLowerCase()===target)).length;
report.dnsMisconfigured=report.checks.filter(x=>x.cname.length===0&&x.ipv4.length>0).length;
console.log('CNAME CORRECT TARGET',report.cnameCorrect+'/'+samples.length,'('+target+')');
console.log('A RECORD WITHOUT CNAME',report.dnsMisconfigured+'/'+samples.length);
for(const number of [1,9,17,60]){
 const x=report.checks[number-1];
 console.log('DNS SAMPLE',x.hostname,'CNAME='+(x.cname.join(',')||'none'),'A='+(x.ipv4.join(',')||'none'));
}
console.log('HTTPS READY',report.readySamples+'/'+httpsSamples.size+' samples');
if(report.readySamples!==httpsSamples.size){
 console.log('Not activating catalog links. DNS, Worker and TLS must be verified before switching readiness flag.');
}
