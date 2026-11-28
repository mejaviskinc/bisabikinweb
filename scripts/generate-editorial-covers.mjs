import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {editorialPosts} from '../static-source/lib/editorial-posts.mjs';
import {isNewsArticle} from '../static-source/lib/news.mjs';

const key=process.env.OPENAI_API_KEY;
if(!key){console.error('Configure OPENAI_API_KEY repository secret before running; no images generated.');process.exit(2);}
const args=process.argv.slice(2);
const arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
const offset=Number(arg('--offset','0'));
const limit=args.includes('--all')?editorialPosts.length:Number(arg('--limit','10'));
const overwrite=args.includes('--overwrite');
const draftRequests=arg('--draft-requests','');
if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>1000)throw new Error('Invalid offset or limit');
const dir='public-assets/editorial-covers';
const mapFile='static-source/lib/editorial-cover-map.mjs';
await mkdir(dir,{recursive:true});
let map={};
try{const {editorialCoverMap}=await import('../static-source/lib/editorial-cover-map.mjs');map={...editorialCoverMap}}catch(e){console.warn('No cover map found; starting fresh',String(e?.message||e))}
const save=()=>writeFile(mapFile,'export const editorialCoverMap = '+JSON.stringify(map,null,2)+';\n','utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];
let generated=0,skipped=0;
function promptFor(p){
 const title=String(p.title||'').replace(/[\r\n]/g,' ').slice(0,320);
 const category=String(p.category||'Bisnis dan Ekspor').slice(0,120);
 const articleType=String(p.articleType||p.article_type||'analisis bisnis').slice(0,80);
 const brief=String(p.imageBrief||p.image_brief||'').replace(/[\r\n]/g,' ').slice(0,700);
 return [
  'Generate ONE brand-new photorealistic editorial cover photograph for a business, industry, export or technology article.',
  'Article type: '+articleType+'. Category: '+category+'.',
  'Headline: '+title,
  'Specific visual brief: '+brief,
  'Illustrate the article context without depicting a specific real-world news event, actual government meeting, identifiable official, named company or fabricated documentary evidence.',
  'Use an authentic Indonesian business setting, natural light, realistic materials and a professional editorial photography style.',
  'Wide landscape composition; the image will be center-cropped to 16:9. No typography, captions, logos, watermarks, readable labels, AI labels or graphic annotations.'
 ].join('\n');
}
async function generate(p){
 const payload={model:process.env.IMAGE_MODEL||'gpt-image-2.5-flare',prompt:promptFor(p),n:1,size:'1536x1024',quality:'medium',output_format:'webp',output_compression:80};
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(180000)});
   if(!res.ok)throw new Error('API HTTP '+res.status+': '+(await res.text()).slice(0,300));
   const json=await res.json();
   const b64=json?.data?.[0]?.b64_json;
   if(!b64)throw new Error('Image response did not include b64_json');
   return Buffer.from(b64,'base64');
  }catch(e){last=e;if(attempt<2)await sleep((attempt+1)*2500)}
 }
 throw last;
}
async function allPublishedPosts(){
 const byId=new Map(editorialPosts.map(p=>[p.id,p]));
 try{
  const src=await readFile('static-source/lib/supabase.ts','utf8');
  const url=src.match(/const SUPABASE_URL='([^']+)'/)?.[1];
  const publicKey=src.match(/const SUPABASE_KEY='([^']+)'/)?.[1];
  if(url&&publicKey){
   const endpoint=new URL('/rest/v1/bbweb_articles',url);
   endpoint.searchParams.set('select','id,title,category,status,is_active');
   endpoint.searchParams.set('status','eq.published');
   endpoint.searchParams.set('is_active','eq.true');
   endpoint.searchParams.set('limit','5000');
   const response=await fetch(endpoint,{headers:{apikey:publicKey,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
   if(response.ok){
    const rows=await response.json();
    for(const p of Array.isArray(rows)?rows:[]){
     const id=String(p.id||'');
     if(/^[a-z0-9][a-z0-9_-]{0,159}$/.test(id)&&p.title)
      byId.set(id,{...byId.get(id),id,title:String(p.title),category:String(p.category||'Artikel')});
    }
   }else console.warn('Could not enumerate live CMS covers: HTTP '+response.status);
  }
 }catch(e){console.warn('Live CMS unavailable; continuing with editorial records: '+String(e.message||e));}
 return [...byId.values()].filter(p=>!isNewsArticle(p));
}
async function requestedDraftPosts(path){
 const payload=JSON.parse(await readFile(path,'utf8'));
 const rows=Array.isArray(payload)?payload:payload.articles;
 if(!Array.isArray(rows))throw new Error('Cover request file must contain an articles array');
 return rows.map(p=>({
  id:String(p.id||''),
  title:String(p.title||''),
  category:String(p.category||'Bisnis dan Ekspor'),
  articleType:String(p.articleType||p.article_type||'analisis bisnis'),
  imageBrief:String(p.imageBrief||p.image_brief||'')
 }));
}
const posts=draftRequests?await requestedDraftPosts(draftRequests):await allPublishedPosts();
console.log((draftRequests?'Draft cover requests':'Published evergreen article image candidates')+': '+posts.length);
const batch=draftRequests?posts:posts.slice(offset,offset+limit);
for(const post of batch){
 const id=String(post.id||'');
 if(!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(id)){errors.push(id+':invalid slug');continue;}
 if(isNewsArticle(post)){errors.push(id+':news requires licensed journalistic photography; generation skipped');continue;}
 if(!post.title){errors.push(id+':missing title');continue;}
 const name=id+'.webp',file=join(dir,name),url='https://bisabikinweb.site/editorial-covers/'+name;
 let exists=false;try{await access(file);exists=true}catch{}
 if(exists&&!overwrite){map[id]=url;skipped++;continue}
 try{
  const data=await generate(post);
  if(data.length<1000)throw new Error('Image payload too small');
  await writeFile(file,data);
  map[id]=url;
  await save();
  generated++;
  console.log('CREATED '+id+' ('+Math.round(data.length/1024)+' KiB)');
 }catch(e){errors.push(id+':'+String(e.message||e).slice(0,140));console.error('FAILED '+id,e.message||e);}
}
await save();
console.log(JSON.stringify({requested:batch.length,generated,skipped,errors},null,2));
if(errors.length&&!generated&&!skipped)process.exitCode=1;
