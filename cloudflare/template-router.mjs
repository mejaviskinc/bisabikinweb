import {templateDemoForHostname} from '../static-source/lib/template-subdomains.mjs';

const PRIMARY='https://bisabikinweb.site';
const ASSETS=/^\/(?:assets|brand|portfolio|images|media|fonts|icons|videos)\/[\w./%-]+$/i;
const STATIC_FILES=/^\/(?:favicon(?:-\d+)?\.(?:ico|png|svg)|apple-touch-icon\.png|site\.webmanifest|manifest\.webmanifest|robots\.txt)$/i;

/**
 * Read-only reverse proxy for the 60 public, fictional demo websites.
 * Routes must be exact template1..template60 hostnames so app/shop/media
 * remain completely outside this Worker.
 */
export async function handleTemplateRequest(request,fetchOrigin=fetch){
 const url=new URL(request.url);
 const demo=templateDemoForHostname(url.hostname);
 if(!demo)return new Response('Unknown template hostname',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow'}});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const path=url.pathname;
 if(path==='/demo/'+demo.slug||path==='/demo/'+demo.slug+'/') {
   const target=new URL('/',url);
   return Response.redirect(target.toString(),308);
 }
 // Authentication and payment stay on the main site, where sessions are valid.
 if(/^\/(?:pesan-website|beli-website|account|admin|client|desain|harga-website|kontak|portfolio|jasa|seller|checkout|payment)(?:\/|$)/i.test(path)){
   return Response.redirect(new URL(path+url.search,PRIMARY).toString(),302);
 }
 let upstream;
 if(path==='/'||path==='/index.html'){
   upstream=new URL('/demo/'+demo.slug+'/',PRIMARY);
   upstream.search=url.search;
 }else if((ASSETS.test(path)||STATIC_FILES.test(path))&&!path.includes('..')){
   upstream=new URL(path+url.search,PRIMARY);
 }else{
   return Response.redirect(new URL(path+url.search,PRIMARY).toString(),302);
 }
 try{
   const origin=await fetchOrigin(upstream.toString(),{
     method:request.method,
     redirect:'manual',
     headers:{Accept:request.headers.get('Accept')||'*/*'}
   });
   if(origin.status>=300&&origin.status<400) {
     // Never permit an origin redirect to an untrusted host.
     return new Response('Unexpected upstream redirect',{status:502,headers:{'X-Robots-Tag':'noindex, nofollow'}});
   }
   const headers=new Headers(origin.headers);
   headers.delete('set-cookie');
   headers.delete('content-length');
   headers.set('X-Robots-Tag','noindex, nofollow');
   headers.set('X-Content-Type-Options','nosniff');
   // Do not set frame/security policy here; pass through audited main-site CSP.
   return new Response(origin.body,{status:origin.status,statusText:origin.statusText,headers});
 }catch{
   return new Response('Template temporarily unavailable',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
 }
}
export default {fetch(request){return handleTemplateRequest(request);}};
