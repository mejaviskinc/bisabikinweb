// Only an affiliate referral code is stored, not a visitor identity.
const KEY='bbweb_affiliate_ref_v1';
const TTL=30*24*60*60*1000;
export function validAffiliateCode(value){return /^BBW[A-F0-9]{12}$/.test(String(value||'').trim().toUpperCase());}
export function captureAffiliateReferral(search){
 if(typeof window==='undefined')return '';
 const query=new URLSearchParams(search??window.location.search);
 const candidate=String(query.get('ref')||'').trim().toUpperCase();
 if(!validAffiliateCode(candidate))return getAffiliateReferral();
 try{window.localStorage.setItem(KEY,JSON.stringify({code:candidate,at:Date.now()}));}catch{}
 return candidate;
}
export function getAffiliateReferral(){
 if(typeof window==='undefined')return '';
 try{
  const record=JSON.parse(window.localStorage.getItem(KEY)||'null');
  if(!record||!validAffiliateCode(record.code)||!Number.isFinite(record.at)||Date.now()-record.at<0||Date.now()-record.at>TTL){window.localStorage.removeItem(KEY);return '';}
  return record.code;
 }catch{return '';}
}
