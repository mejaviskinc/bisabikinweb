// Hostinger domain buying destination. Set VITE_HOSTINGER_PARTNER_URL at build time
// to the exact approved partnership/affiliate URL; do not invent tracking identifiers.
const official = 'https://www.hostinger.com/id/domain';
const configured = String(import.meta.env.VITE_HOSTINGER_PARTNER_URL || '').trim();
export const hostingerDomainUrl = (()=>{
 if(!configured)return official;
 try{
  const u=new URL(configured);
  if(u.protocol!=='https:'||u.username||u.password)return official;
  return u.href;
 }catch{return official}
})();
