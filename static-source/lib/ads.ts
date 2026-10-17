import type {AdminSession} from './supabase';
import {getSession} from './supabase';

const SUPABASE_URL='https://iyhwephcrxeqwiemhppw.supabase.co';
const SUPABASE_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
const FIELDS='ad_enabled,ad_label,ad_title,ad_description,ad_cta,ad_url,ad_image_url,ad_images,ad_start_at,ad_end_at';

export type AdSettings={
  ad_enabled:boolean;
  ad_label:string;
  ad_title:string;
  ad_description:string;
  ad_cta:string;
  ad_url:string;
  ad_image_url:string;
  ad_images:string[];
  ad_start_at:string|null;
  ad_end_at:string|null;
};

export const defaultAd:AdSettings={
  ad_enabled:true,
  ad_label:'IKLAN',
  ad_title:'Punya bisnis tapi websitenya masih “nanti dulu”?',
  ad_description:'Website profesional mulai Rp800 ribuan untuk bantu bisnis tampil lebih serius, rapi, dan mudah ditemukan.',
  ad_cta:'Bikin Website Sekarang',
  ad_url:'/kontak',
  ad_image_url:'',
  ad_images:[],
  ad_start_at:null,
  ad_end_at:null
};

function text(value:any,max:number){return String(value??'').trim().slice(0,max)}
export function safeAdHref(value:any){
  const raw=text(value,1000);if(!raw)return '';
  if(raw.startsWith('/')&&!raw.startsWith('//'))return raw;
  try{const url=new URL(raw);return url.protocol==='https:'?url.toString():''}catch{return ''}
}
export function safeAdImage(value:any){
  const raw=text(value,1000);if(!raw)return '';
  try{const url=new URL(raw);return url.protocol==='https:'?url.toString():''}catch{return ''}
}
export function safeAdImages(value:any){
  const raw=Array.isArray(value)?value:[];
  return [...new Set(raw.map(safeAdImage).filter(Boolean))].slice(0,8);
}
function normalize(row:any):AdSettings{
  const legacy=safeAdImage(row?.ad_image_url);
  const gallery=safeAdImages(row?.ad_images);
  const images=gallery.length?gallery:(legacy?[legacy]:[]);
  return {
    ad_enabled:row?.ad_enabled!==false,
    ad_label:text(row?.ad_label||defaultAd.ad_label,40),
    ad_title:text(row?.ad_title||defaultAd.ad_title,180),
    ad_description:text(row?.ad_description||defaultAd.ad_description,600),
    ad_cta:text(row?.ad_cta||defaultAd.ad_cta,80),
    ad_url:safeAdHref(row?.ad_url)||defaultAd.ad_url,
    ad_image_url:images[0]||legacy,
    ad_images:images,
    ad_start_at:row?.ad_start_at?String(row.ad_start_at):null,
    ad_end_at:row?.ad_end_at?String(row.ad_end_at):null
  };
}

async function request(token?:string,options:RequestInit={}){
  const headers:Record<string,string>={apikey:SUPABASE_KEY,Accept:'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  if(options.body)headers['Content-Type']='application/json';
  const response=await fetch(SUPABASE_URL+'/rest/v1/bbweb_site_settings?id=eq.1&select='+FIELDS,{...options,headers:{...headers,...(options.headers||{})}});
  const textBody=await response.text();let payload:any=null;if(textBody){try{payload=JSON.parse(textBody)}catch{payload=textBody}}
  if(!response.ok)throw new Error(String(payload?.message||payload?.error||`Request gagal (${response.status})`));
  return payload;
}

export function isAdActive(ad:AdSettings|null,now=Date.now()){
  if(!ad?.ad_enabled)return false;
  const start=ad.ad_start_at?Date.parse(ad.ad_start_at):NaN;const end=ad.ad_end_at?Date.parse(ad.ad_end_at):NaN;
  if(Number.isFinite(start)&&now<start)return false;
  if(Number.isFinite(end)&&now>end)return false;
  return Boolean(ad.ad_title||ad.ad_description||safeAdImages(ad.ad_images).length||safeAdImage(ad.ad_image_url));
}

export async function loadPublicAd():Promise<AdSettings|null>{
  try{const rows=await request();return Array.isArray(rows)&&rows[0]?normalize(rows[0]):null}catch{return null}
}

export async function adminLoadAd(session:AdminSession):Promise<AdSettings>{
  const live=await getSession()||session;const rows=await request(live.access_token);return Array.isArray(rows)&&rows[0]?normalize(rows[0]):defaultAd;
}

export async function adminSaveAd(session:AdminSession,input:AdSettings):Promise<AdSettings>{
  const live=await getSession()||session;
  const images=safeAdImages(input.ad_images?.length?input.ad_images:(input.ad_image_url?[input.ad_image_url]:[]));
  const payload={
    ad_enabled:Boolean(input.ad_enabled),ad_label:text(input.ad_label,40),ad_title:text(input.ad_title,180),ad_description:text(input.ad_description,600),ad_cta:text(input.ad_cta,80),
    ad_url:safeAdHref(input.ad_url),ad_image_url:images[0]||'',ad_images:images,ad_start_at:input.ad_start_at||null,ad_end_at:input.ad_end_at||null,updated_at:new Date().toISOString()
  };
  const rows=await request(live.access_token,{method:'PATCH',body:JSON.stringify(payload),headers:{Prefer:'return=representation'}});
  return Array.isArray(rows)&&rows[0]?normalize(rows[0]):normalize(payload);
}
