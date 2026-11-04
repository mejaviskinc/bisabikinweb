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
if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>1000)throw new Error('Invalid offset or limit');
const dir='public-assets/editorial-covers';
const mapFile='static-source/lib/editorial-cover-map.mjs';
await mkdir(dir,{recursive:true});
let map={};
try{const src=await readFile(mapFile,'utf8');map=JSON.parse(src.match(/\/\* COVER_MAP_JSON_START \*\/\s*([\s\S]*?)\s*\/\* COVER_MAP_JSON_END \*\//)?.[1]||'{}')}catch{}
const save=()=>writeFile(mapFile,'export const editorialCoverMap = '+JSON.stringify(map,null,2)+';\n/* COVER_MAP_JSON_START */\n'+JSON.stringify(map)+'\n/* COVER_MAP_JSON_END */\n','utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];
let generated=0,skipped=0;
function promptFor(p){
 const title=String(p.title||'').replace(/[\r\n]/g,' ').slice(0,320);
 return [
 'Generate ONE brand new photorealistic editorial cover photograph for an EVERGREEN EDUCATIONAL ARTICLE, not for a factual news story. Landscape composition, professional publication photo, daylight, natural detail, Indonesian context and realistic everyday objects.',
 'Topic and headline: '+title,
 'Image must illustrate the PRECISE SUBJECT of this educational headline, not generic technology stock imagery.',
 'Show an authentic, specific real-world setting with relevant objects, digital screens, work or business activity.',
 'No typography, captions, logos, watermarks, graphic text, AI labels or annotations in the image.'
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
 // The site's static builder uses this same public Supabase project. Include published
 // CMS items too, without using a service-role key or modifying the database.
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
 // News must use REAL, legally reusable event photography; never generate a fake event image.
 return [...byId.values()].filter(p=>!isNewsArticle(p));
}
const posts=await allPublishedPosts();
console.log('Published evergreen article image candidates (news excluded): '+posts.length);
const batch=posts.slice(offset,offset+limit);
for(const post of batch){
 const id=String(post.id||'');
 if(!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(id)){errors.push(id+':invalid slug');continue;}
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