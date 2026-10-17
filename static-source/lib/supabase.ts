const SUPABASE_URL='https://iyhwephcrxeqwiemhppw.supabase.co';
const SUPABASE_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
const SESSION_KEY='bbweb_admin_session_v1';
const ARTICLE_BUCKET='bbweb-article-images';

export type AdminSession={access_token:string;refresh_token:string;expires_at:number;user:any};
export type AdminCollection='orders'|'merchandise'|'services'|'pricing'|'articles'|'testimonials'|'coupons'|'customers';
type RequestOptions={method?:string;body?:any;token?:string;prefer?:string};

async function request(path:string,{method='GET',body,token,prefer}:RequestOptions={}){
  const headers:Record<string,string>={apikey:SUPABASE_KEY,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(token)headers.Authorization='Bearer '+token;
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(SUPABASE_URL+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();
  let payload:any=null;
  if(text){try{payload=JSON.parse(text)}catch{payload=text}}
  if(!response.ok){const message=payload?.msg||payload?.message||payload?.error_description||payload?.error||`Request gagal (${response.status})`;throw new Error(String(message))}
  return payload;
}

function saveSession(payload:any):AdminSession{
  const session:AdminSession={access_token:payload.access_token,refresh_token:payload.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(payload.expires_in||3600),user:payload.user};
  localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  return session;
}

export async function signIn(email:string,password:string){const payload=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim().toLowerCase(),password}});return saveSession(payload)}
export async function signUp(email:string,password:string){return request('/auth/v1/signup',{method:'POST',body:{email:email.trim().toLowerCase(),password}})}
export async function signOut(session?:AdminSession|null){try{if(session?.access_token)await request('/auth/v1/logout',{method:'POST',token:session.access_token})}catch{}localStorage.removeItem(SESSION_KEY)}

export async function getSession():Promise<AdminSession|null>{
  if(typeof window==='undefined')return null;
  const raw=localStorage.getItem(SESSION_KEY);if(!raw)return null;
  let session:AdminSession;try{session=JSON.parse(raw)}catch{localStorage.removeItem(SESSION_KEY);return null}
  if(!session?.access_token||!session?.refresh_token){localStorage.removeItem(SESSION_KEY);return null}
  if(session.expires_at>Date.now()/1000+90)return session;
  try{const payload=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});return saveSession(payload)}catch{localStorage.removeItem(SESSION_KEY);return null}
}

export async function assertAdmin(session:AdminSession){
  const email=String(session.user?.email||'').trim().toLowerCase();if(!email)throw new Error('Sesi admin tidak memiliki email.');
  const rows=await request('/rest/v1/bbweb_admin_allowlist?select=email,label&email=eq.'+encodeURIComponent(email)+'&limit=1',{token:session.access_token});
  if(!Array.isArray(rows)||!rows.length)throw new Error('Akun ini tidak memiliki akses admin Bisabikinweb.');return rows[0];
}

export async function loadPublicContent(){
  try{
    const [settingsRows,portfolioRows,serviceRows,pricingRows,merchRows,articleRows,testimonialRows]=await Promise.all([
      request('/rest/v1/bbweb_site_settings?select=whatsapp,email,instagram,tiktok,threads,linkedin,announcement,hero_label,headline,description&id=eq.1&limit=1'),
      request('/rest/v1/bbweb_portfolio?select=id,name,domain,category,tag,description,live,theme,technology,features,sort_order,is_active&is_active=eq.true&order=sort_order.asc'),
      request('/rest/v1/bbweb_services?select=id,name,icon,tag,description,features,sort_order&is_active=eq.true&order=sort_order.asc'),
      request('/rest/v1/bbweb_pricing?select=id,name,price,maintenance,description,features,featured,sort_order&is_active=eq.true&order=sort_order.asc'),
      request('/rest/v1/bbweb_merchandise?select=id,name,collection,type,color,print,description,price,badge,material,care,shipping,returns,stock,sort_order,image_url&is_active=eq.true&order=sort_order.asc'),
      request('/rest/v1/bbweb_articles?select=id,title,category,read_time,summary,body,cover_image_url,sort_order&is_active=eq.true&status=eq.published&order=sort_order.asc'),
      request('/rest/v1/bbweb_testimonials?select=id,name,business,quote,rating,sort_order&is_active=eq.true&order=sort_order.asc')
    ]);
    const row=Array.isArray(settingsRows)?settingsRows[0]:null;
    const testimonials=Array.isArray(testimonialRows)?testimonialRows.map((t:any)=>({id:t.id,name:t.name,business:t.business||'',quote:t.quote,rating:t.rating||5})):[];
    const settings=row?{whatsapp:row.whatsapp||'',email:row.email||'',instagram:row.instagram||'',tiktok:row.tiktok||'',threads:row.threads||'',linkedin:row.linkedin||'',announcement:row.announcement||'',heroLabel:row.hero_label||'',headline:row.headline||'',description:row.description||'',testimonials}:null;
    const portfolio=Array.isArray(portfolioRows)?portfolioRows.map((p:any)=>({id:p.id,name:p.name,domain:p.domain||'',category:p.category||'Company Profile',year:'—',tag:p.tag||'BUSINESS / WEBSITE',description:p.description||'',theme:p.theme||'trade',technology:p.technology||'Website',problem:'Informasi bisnis membutuhkan tempat yang mudah diakses secara online.',goal:'Memudahkan pengunjung mengenal brand dan menemukan informasi bisnis.',solution:p.description||'',features:Array.isArray(p.features)?p.features:[],result:'Kunjungi website resmi untuk melihat tampilan dan informasi terkini.',live:p.live||''})):null;
    const services=Array.isArray(serviceRows)?serviceRows.map((s:any)=>({id:s.id,name:s.name,icon:s.icon||'↗',tag:s.tag||'',description:s.description||'',features:Array.isArray(s.features)?s.features:[]})):null;
    const pricing=Array.isArray(pricingRows)?pricingRows.map((p:any)=>({id:p.id,name:p.name,price:p.price===null?null:Number(p.price),maintenance:p.maintenance===null?null:Number(p.maintenance),desc:p.description||'',features:Array.isArray(p.features)?p.features:[],featured:Boolean(p.featured)})):null;
    const products=Array.isArray(merchRows)?merchRows.map((p:any)=>({id:p.id,name:p.name,collection:p.collection||'CORE',type:p.type||'item',color:p.color||'',print:p.print||'',description:p.description||'',price:p.price===null?null:Number(p.price),badge:p.badge||'',material:p.material||'',care:p.care||'',shipping:p.shipping||'',returns:p.returns||'',image:p.image_url||'',image_url:p.image_url||'',stock:Number(p.stock||0)})):null;
    const articles=Array.isArray(articleRows)?articleRows.map((a:any)=>({id:a.id,title:a.title,category:a.category||'Business',read:a.read_time||'3 menit',summary:a.summary||'',body:Array.isArray(a.body)?a.body:[],image:a.cover_image_url||'',cover_image_url:a.cover_image_url||''})):null;
    return {settings,portfolio,services,pricing,products,articles};
  }catch{return {settings:null,portfolio:null,services:null,pricing:null,products:null,articles:null}}
}

export async function submitLead(input:any){
  const payload={name:String(input.name||'').trim().slice(0,100),company:String(input.company||'').trim().slice(0,150),phone:String(input.phone||'').trim().slice(0,30),email:String(input.email||'').trim().slice(0,254),website_type:String(input.type||'').trim().slice(0,100),budget:String(input.budget||'').trim().slice(0,100),domain_status:String(input.domain||'').trim().slice(0,100),deadline:input.deadline?String(input.deadline):null,features:String(input.features||'').trim().slice(0,1000),reference_url:String(input.reference||'').trim().slice(0,500),message:String(input.message||'').trim().slice(0,3000),status:'new',source:'website'};
  await request('/rest/v1/bbweb_leads',{method:'POST',body:payload,prefer:'return=minimal'});return {ok:true};
}

async function liveSession(session:AdminSession){return await getSession()||session}
async function adminRequest(session:AdminSession,path:string,options:RequestOptions={}){const live=await liveSession(session);return request('/rest/v1/'+path,{...options,token:live.access_token})}

export function adminListLeads(session:AdminSession){return adminRequest(session,'bbweb_leads?select=*&order=created_at.desc&limit=250')}
export function adminUpdateLead(session:AdminSession,id:string,status:string){return adminRequest(session,'bbweb_leads?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status},prefer:'return=representation'})}
export function adminDeleteLead(session:AdminSession,id:string){return adminRequest(session,'bbweb_leads?id=eq.'+encodeURIComponent(id),{method:'DELETE',prefer:'return=representation'})}
export function adminListPortfolio(session:AdminSession){return adminRequest(session,'bbweb_portfolio?select=*&order=sort_order.asc')}
export function adminSavePortfolio(session:AdminSession,item:any){const payload={id:String(item.id||'').trim().toLowerCase(),name:String(item.name||'').trim(),domain:String(item.domain||'').trim(),category:String(item.category||'Company Profile').trim(),tag:String(item.tag||'BUSINESS / WEBSITE').trim(),description:String(item.description||'').trim(),live:String(item.live||'').trim(),theme:String(item.theme||'trade').trim(),technology:String(item.technology||'Website').trim(),features:Array.isArray(item.features)?item.features:[],sort_order:Number(item.sort_order||100),is_active:Boolean(item.is_active),updated_at:new Date().toISOString()};return adminRequest(session,'bbweb_portfolio?on_conflict=id',{method:'POST',body:payload,prefer:'resolution=merge-duplicates,return=representation'})}
export function adminDeletePortfolio(session:AdminSession,id:string){return adminRequest(session,'bbweb_portfolio?id=eq.'+encodeURIComponent(id),{method:'DELETE',prefer:'return=representation'})}
export async function adminGetSettings(session:AdminSession){const rows=await adminRequest(session,'bbweb_site_settings?select=*&id=eq.1&limit=1');return Array.isArray(rows)?rows[0]:null}
export function adminSaveSettings(session:AdminSession,settings:any){const payload={whatsapp:String(settings.whatsapp||'').trim(),email:String(settings.email||'').trim(),instagram:String(settings.instagram||'').trim(),tiktok:String(settings.tiktok||'').trim(),threads:String(settings.threads||'').trim(),linkedin:String(settings.linkedin||'').trim(),announcement:String(settings.announcement||'').trim(),hero_label:String(settings.hero_label||'').trim(),headline:String(settings.headline||'').trim(),description:String(settings.description||'').trim(),updated_at:new Date().toISOString()};return adminRequest(session,'bbweb_site_settings?id=eq.1',{method:'PATCH',body:payload,prefer:'return=representation'})}

const COLLECTION_TABLE:Record<AdminCollection,string>={orders:'bbweb_orders',merchandise:'bbweb_merchandise',services:'bbweb_services',pricing:'bbweb_pricing',articles:'bbweb_articles',testimonials:'bbweb_testimonials',coupons:'bbweb_coupons',customers:'bbweb_customers'};
const COLLECTION_ORDER:Record<AdminCollection,string>={orders:'created_at.desc',merchandise:'sort_order.asc',services:'sort_order.asc',pricing:'sort_order.asc',articles:'sort_order.asc',testimonials:'sort_order.asc',coupons:'created_at.desc',customers:'created_at.desc'};
export function adminListCollection(session:AdminSession,collection:AdminCollection){return adminRequest(session,`${COLLECTION_TABLE[collection]}?select=*&order=${COLLECTION_ORDER[collection]}&limit=500`)}

function n(value:any,fallback=0){const x=Number(value);return Number.isFinite(x)?x:fallback}
function s(value:any,max=5000){return String(value??'').trim().slice(0,max)}
function arr(value:any){return Array.isArray(value)?value.map(x=>String(x).trim()).filter(Boolean):[]}

function collectionPayload(collection:AdminCollection,item:any){
  const now=new Date().toISOString();
  if(collection==='orders'){const payload:any={customer_id:item.customer_id||null,customer_name:s(item.customer_name,120),customer_email:s(item.customer_email,254),customer_phone:s(item.customer_phone,40),items:Array.isArray(item.items)?item.items:[],subtotal:n(item.subtotal),discount:n(item.discount),total:n(item.total),status:s(item.status||'new',30),payment_status:s(item.payment_status||'unpaid',30),notes:s(item.notes,3000),updated_at:now};if(item.id)payload.id=item.id;if(item.order_no)payload.order_no=s(item.order_no,80);return payload}
  if(collection==='merchandise')return {id:s(item.id,120).toLowerCase(),sku:s(item.sku,120),name:s(item.name,200),collection:s(item.collection||'CORE',100),type:s(item.type||'item',80),color:s(item.color,80),print:s(item.print,1000),description:s(item.description,5000),price:item.price===''||item.price===null||item.price===undefined?null:n(item.price),badge:s(item.badge,100),material:s(item.material,1000),care:s(item.care,1500),shipping:s(item.shipping,1500),returns:s(item.returns,1500),stock:Math.max(0,Math.round(n(item.stock))),low_stock_threshold:Math.max(0,Math.round(n(item.low_stock_threshold,5))),is_active:Boolean(item.is_active),sort_order:Math.round(n(item.sort_order,100)),updated_at:now};
  if(collection==='services')return {id:s(item.id,120).toLowerCase(),name:s(item.name,200),icon:s(item.icon||'↗',20),tag:s(item.tag,120),description:s(item.description,3000),features:arr(item.features),is_active:Boolean(item.is_active),sort_order:Math.round(n(item.sort_order,100)),updated_at:now};
  if(collection==='pricing')return {id:s(item.id,120).toLowerCase(),name:s(item.name,200),price:item.price===''||item.price===null||item.price===undefined?null:n(item.price),maintenance:item.maintenance===''||item.maintenance===null||item.maintenance===undefined?null:n(item.maintenance),description:s(item.description,3000),features:arr(item.features),featured:Boolean(item.featured),is_active:Boolean(item.is_active),sort_order:Math.round(n(item.sort_order,100)),updated_at:now};
  if(collection==='articles')return {id:s(item.id,160).toLowerCase(),title:s(item.title,300),category:s(item.category||'Business',100),read_time:s(item.read_time||'3 menit',50),summary:s(item.summary,3000),body:arr(item.body),cover_image_url:s(item.cover_image_url,1000),status:s(item.status||'draft',30),is_active:Boolean(item.is_active),sort_order:Math.round(n(item.sort_order,100)),published_at:item.status==='published'?(item.published_at||now):null,updated_at:now};
  if(collection==='testimonials'){const payload:any={name:s(item.name,160),business:s(item.business,200),quote:s(item.quote,3000),rating:Math.min(5,Math.max(1,Math.round(n(item.rating,5)))),is_active:Boolean(item.is_active),sort_order:Math.round(n(item.sort_order,100)),updated_at:now};if(item.id)payload.id=item.id;return payload}
  if(collection==='coupons')return {code:s(item.code,80).toUpperCase().replace(/[^A-Z0-9_-]/g,''),description:s(item.description,1000),discount_type:s(item.discount_type||'percent',20),discount_value:n(item.discount_value),min_order:n(item.min_order),max_uses:item.max_uses===''||item.max_uses===null||item.max_uses===undefined?null:Math.max(0,Math.round(n(item.max_uses))),used_count:Math.max(0,Math.round(n(item.used_count))),starts_at:item.starts_at||null,ends_at:item.ends_at||null,is_active:Boolean(item.is_active),updated_at:now};
  const payload:any={name:s(item.name,120),email:s(item.email,254),phone:s(item.phone,40),company:s(item.company,160),status:s(item.status||'active',30),notes:s(item.notes,3000),updated_at:now};if(item.id)payload.id=item.id;return payload;
}

export function adminSaveCollection(session:AdminSession,collection:AdminCollection,item:any){const table=COLLECTION_TABLE[collection];const payload=collectionPayload(collection,item);const key=collection==='coupons'?'code':'id';const hasKey=Boolean(payload[key]);return adminRequest(session,hasKey?`${table}?on_conflict=${key}`:table,{method:'POST',body:payload,prefer:hasKey?'resolution=merge-duplicates,return=representation':'return=representation'})}
export function adminDeleteCollection(session:AdminSession,collection:AdminCollection,item:any){const table=COLLECTION_TABLE[collection];const key=collection==='coupons'?'code':'id';const value=item?.[key];if(!value)throw new Error('Data tidak memiliki ID yang valid.');return adminRequest(session,`${table}?${key}=eq.${encodeURIComponent(String(value))}`,{method:'DELETE',prefer:'return=representation'})}
export function adminPatchCollection(session:AdminSession,collection:AdminCollection,item:any,patch:any){const table=COLLECTION_TABLE[collection];const key=collection==='coupons'?'code':'id';const value=item?.[key];if(!value)throw new Error('Data tidak memiliki ID yang valid.');return adminRequest(session,`${table}?${key}=eq.${encodeURIComponent(String(value))}`,{method:'PATCH',body:{...patch,updated_at:new Date().toISOString()},prefer:'return=representation'})}

function imageExtension(file:File){const byType:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'};return byType[file.type]||''}
function safeSlug(value:string){return String(value||'draft').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'draft'}
function encodeStoragePath(path:string){return path.split('/').map(encodeURIComponent).join('/')}

export async function adminUploadArticleImage(session:AdminSession,file:File,articleId='draft'){
  const ext=imageExtension(file);if(!ext)throw new Error('Format gambar harus JPG, PNG, WEBP, GIF, atau AVIF.');
  if(file.size>5*1024*1024)throw new Error('Ukuran gambar maksimal 5 MB.');
  if(file.size<=0)throw new Error('File gambar kosong.');
  const live=await liveSession(session);await assertAdmin(live);
  const random=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():Math.random().toString(36).slice(2);
  const path=`${safeSlug(articleId)}/${Date.now()}-${random}.${ext}`;
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/${ARTICLE_BUCKET}/${encodeStoragePath(path)}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+live.access_token,'Content-Type':file.type,'Cache-Control':'3600','x-upsert':'false'},body:file});
  if(!response.ok){let message='Upload gambar gagal.';try{const data=await response.json();message=data?.message||data?.error||message}catch{}throw new Error(message)}
  return `${SUPABASE_URL}/storage/v1/object/public/${ARTICLE_BUCKET}/${encodeStoragePath(path)}`;
}

export async function adminDeleteArticleImage(session:AdminSession,url:string){
  if(!url)return;
  const prefix=`${SUPABASE_URL}/storage/v1/object/public/${ARTICLE_BUCKET}/`;if(!url.startsWith(prefix))return;
  const encoded=url.slice(prefix.length);const path=encoded.split('/').map(decodeURIComponent).join('/');
  const live=await liveSession(session);await assertAdmin(live);
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/${ARTICLE_BUCKET}/${encodeStoragePath(path)}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+live.access_token}});
  if(!response.ok&&response.status!==404){let message='Gagal menghapus gambar.';try{const data=await response.json();message=data?.message||data?.error||message}catch{}throw new Error(message)}
}
