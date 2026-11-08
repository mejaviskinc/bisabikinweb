import {customerGetSession} from './customer';
const URL='https://kdlrobdzlxpjlkxbvzsd.supabase.co';
const KEY='sb_publishable_Xy3TI3nbOGglkk5xy6uAsA_ytlPYhv-';
const ENDPOINT=URL+'/functions/v1/bbweb-website-store';
const headers={apikey:KEY,Accept:'application/json'};
export async function getWebsiteCatalog():Promise<{templates:any[],packages:any[]}|null>{
 try{
  const [t,p]=await Promise.all([
    fetch(URL+'/rest/v1/bbweb_website_templates?select=slug,title,category,description,features,image_url,demo_url,sort_order&is_active=eq.true&order=sort_order.asc',{headers}),
    fetch(URL+'/rest/v1/bbweb_website_packages?select=slug,name,description,base_price,features,sort_order&is_active=eq.true&order=sort_order.asc',{headers})
  ]);
  if(!t.ok||!p.ok)return null;
  const templates=await t.json(),packages=await p.json();
  return {templates:Array.isArray(templates)?templates:[],packages:Array.isArray(packages)?packages:[]};
 }catch{return null}
}
export async function websiteStoreApi(action:string,data:Record<string,unknown>={},overrideToken?:string){
 const token=overrideToken||(await customerGetSession())?.access_token;
 if(!token)throw new Error('Masuk ke akun terlebih dahulu untuk melanjutkan.');
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+token},body:JSON.stringify({action,...data}),cache:'no-store'});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(String(payload.error||payload.message||'Layanan pemesanan belum tersedia ('+response.status+').'));
 return payload;
}
