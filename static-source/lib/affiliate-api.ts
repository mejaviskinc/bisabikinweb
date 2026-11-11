import {customerGetSession} from './customer';
const ROOT='https://kdlrobdzlxpjlkxbvzsd.supabase.co';
const KEY='sb_publishable_Xy3TI3nbOGglkk5xy6uAsA_ytlPYhv-';
export async function affiliateApi(action:string,payload:Record<string,unknown>={},overrideToken?:string):Promise<any>{
 const token=overrideToken||(await customerGetSession())?.access_token;
 if(!token)throw new Error('Silakan login untuk mengakses program affiliate.');
 const r=await fetch(ROOT+'/functions/v1/bbweb-affiliate',{
  method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+token},
  body:JSON.stringify({action,...payload}),cache:'no-store'
 });
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(String(data?.error||'Permintaan affiliate tidak dapat diproses ('+r.status+').'));
 return data;
}
