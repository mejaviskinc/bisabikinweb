const SUPABASE_URL='https://iyhwephcrxeqwiemhppw.supabase.co';
const SUPABASE_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
const SESSION_KEY='bbweb_admin_session_v1';

export type AdminSession={
  access_token:string;
  refresh_token:string;
  expires_at:number;
  user:any;
};

type RequestOptions={
  method?:string;
  body?:any;
  token?:string;
  prefer?:string;
};

async function request(path:string,{method='GET',body,token,prefer}:RequestOptions={}){
  const headers:Record<string,string>={apikey:SUPABASE_KEY,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(token)headers.Authorization='Bearer '+token;
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(SUPABASE_URL+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();
  let payload:any=null;
  if(text){try{payload=JSON.parse(text)}catch{payload=text}}
  if(!response.ok){
    const message=payload?.msg||payload?.message||payload?.error_description||payload?.error||`Request gagal (${response.status})`;
    throw new Error(String(message));
  }
  return payload;
}

function saveSession(payload:any):AdminSession{
  const session:AdminSession={
    access_token:payload.access_token,
    refresh_token:payload.refresh_token,
    expires_at:Math.floor(Date.now()/1000)+Number(payload.expires_in||3600),
    user:payload.user
  };
  localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  return session;
}

export async function signIn(email:string,password:string){
  const payload=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim().toLowerCase(),password}});
  return saveSession(payload);
}

export async function signUp(email:string,password:string){
  return request('/auth/v1/signup',{method:'POST',body:{email:email.trim().toLowerCase(),password}});
}

export async function signOut(session?:AdminSession|null){
  try{if(session?.access_token)await request('/auth/v1/logout',{method:'POST',token:session.access_token})}catch{}
  localStorage.removeItem(SESSION_KEY);
}

export async function getSession():Promise<AdminSession|null>{
  if(typeof window==='undefined')return null;
  const raw=localStorage.getItem(SESSION_KEY);
  if(!raw)return null;
  let session:AdminSession;
  try{session=JSON.parse(raw)}catch{localStorage.removeItem(SESSION_KEY);return null}
  if(!session?.access_token||!session?.refresh_token){localStorage.removeItem(SESSION_KEY);return null}
  if(session.expires_at>Date.now()/1000+90)return session;
  try{
    const payload=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
    return saveSession(payload);
  }catch{
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function assertAdmin(session:AdminSession){
  const email=String(session.user?.email||'').trim().toLowerCase();
  if(!email)throw new Error('Sesi admin tidak memiliki email.');
  const rows=await request('/rest/v1/bbweb_admin_allowlist?select=email,label&email=eq.'+encodeURIComponent(email)+'&limit=1',{token:session.access_token});
  if(!Array.isArray(rows)||!rows.length)throw new Error('Akun ini tidak memiliki akses admin Bisabikinweb.');
  return rows[0];
}

export async function loadPublicContent(){
  try{
    const [settingsRows,portfolioRows]=await Promise.all([
      request('/rest/v1/bbweb_site_settings?select=whatsapp,email,instagram,tiktok,threads,linkedin,announcement,hero_label,headline,description&id=eq.1&limit=1'),
      request('/rest/v1/bbweb_portfolio?select=id,name,domain,category,tag,description,live,theme,technology,features,sort_order,is_active&is_active=eq.true&order=sort_order.asc')
    ]);
    const row=Array.isArray(settingsRows)?settingsRows[0]:null;
    const settings=row?{
      whatsapp:row.whatsapp||'',email:row.email||'',instagram:row.instagram||'',tiktok:row.tiktok||'',threads:row.threads||'',linkedin:row.linkedin||'',announcement:row.announcement||'',heroLabel:row.hero_label||'',headline:row.headline||'',description:row.description||''
    }:null;
    const portfolio=Array.isArray(portfolioRows)?portfolioRows.map((p:any)=>({
      id:p.id,name:p.name,domain:p.domain||'',category:p.category||'Company Profile',year:'—',tag:p.tag||'BUSINESS / WEBSITE',description:p.description||'',theme:p.theme||'trade',technology:p.technology||'Website',problem:'Informasi bisnis membutuhkan tempat yang mudah diakses secara online.',goal:'Memudahkan pengunjung mengenal brand dan menemukan informasi bisnis.',solution:p.description||'',features:Array.isArray(p.features)?p.features:[],result:'Kunjungi website resmi untuk melihat tampilan dan informasi terkini.',live:p.live||''
    })):null;
    return {settings,portfolio};
  }catch{return {settings:null,portfolio:null}}
}

export async function submitLead(input:any){
  const payload={
    name:String(input.name||'').trim().slice(0,100),
    company:String(input.company||'').trim().slice(0,150),
    phone:String(input.phone||'').trim().slice(0,30),
    email:String(input.email||'').trim().slice(0,254),
    website_type:String(input.type||'').trim().slice(0,100),
    budget:String(input.budget||'').trim().slice(0,100),
    domain_status:String(input.domain||'').trim().slice(0,100),
    deadline:input.deadline?String(input.deadline):null,
    features:String(input.features||'').trim().slice(0,1000),
    reference_url:String(input.reference||'').trim().slice(0,500),
    message:String(input.message||'').trim().slice(0,3000),
    status:'new',source:'website'
  };
  const rows=await request('/rest/v1/bbweb_leads',{method:'POST',body:payload,prefer:'return=representation'});
  return Array.isArray(rows)?rows[0]:rows;
}

async function adminRequest(session:AdminSession,path:string,options:RequestOptions={}){
  const live=await getSession()||session;
  return request('/rest/v1/'+path,{...options,token:live.access_token});
}

export function adminListLeads(session:AdminSession){
  return adminRequest(session,'bbweb_leads?select=*&order=created_at.desc&limit=250');
}

export function adminUpdateLead(session:AdminSession,id:string,status:string){
  return adminRequest(session,'bbweb_leads?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status},prefer:'return=representation'});
}

export function adminDeleteLead(session:AdminSession,id:string){
  return adminRequest(session,'bbweb_leads?id=eq.'+encodeURIComponent(id),{method:'DELETE',prefer:'return=representation'});
}

export function adminListPortfolio(session:AdminSession){
  return adminRequest(session,'bbweb_portfolio?select=*&order=sort_order.asc');
}

export function adminSavePortfolio(session:AdminSession,item:any){
  const payload={
    id:String(item.id||'').trim().toLowerCase(),name:String(item.name||'').trim(),domain:String(item.domain||'').trim(),category:String(item.category||'Company Profile').trim(),tag:String(item.tag||'BUSINESS / WEBSITE').trim(),description:String(item.description||'').trim(),live:String(item.live||'').trim(),theme:String(item.theme||'trade').trim(),technology:String(item.technology||'Website').trim(),features:Array.isArray(item.features)?item.features:[],sort_order:Number(item.sort_order||100),is_active:Boolean(item.is_active),updated_at:new Date().toISOString()
  };
  return adminRequest(session,'bbweb_portfolio?on_conflict=id',{method:'POST',body:payload,prefer:'resolution=merge-duplicates,return=representation'});
}

export function adminDeletePortfolio(session:AdminSession,id:string){
  return adminRequest(session,'bbweb_portfolio?id=eq.'+encodeURIComponent(id),{method:'DELETE',prefer:'return=representation'});
}

export async function adminGetSettings(session:AdminSession){
  const rows=await adminRequest(session,'bbweb_site_settings?select=*&id=eq.1&limit=1');
  return Array.isArray(rows)?rows[0]:null;
}

export function adminSaveSettings(session:AdminSession,settings:any){
  const payload={
    whatsapp:String(settings.whatsapp||'').trim(),email:String(settings.email||'').trim(),instagram:String(settings.instagram||'').trim(),tiktok:String(settings.tiktok||'').trim(),threads:String(settings.threads||'').trim(),linkedin:String(settings.linkedin||'').trim(),announcement:String(settings.announcement||'').trim(),hero_label:String(settings.hero_label||'').trim(),headline:String(settings.headline||'').trim(),description:String(settings.description||'').trim(),updated_at:new Date().toISOString()
  };
  return adminRequest(session,'bbweb_site_settings?id=eq.1',{method:'PATCH',body:payload,prefer:'return=representation'});
}
