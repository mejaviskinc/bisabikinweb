// Translate newly published public CMS text without changing routes or user input.
// Uses the on-device Translator API where supported; otherwise calls our own
// Supabase Edge Function, which is inert until a provider key is configured.
// Avoids any third-party browser request and deduplicates/caches identical text.
const API_URL='https://kdlrobdzlxpjlkxbvzsd.supabase.co/functions/v1/bbweb-public-translate';
const PUBLIC_KEY='sb_publishable_Xy3TI3nbOGglkk5xy6uAsA_ytlPYhv-';
const MAX_CACHE=1500;
const cache=new Map();
const queued=new Map();
let flushTimer=null;
let running=false;
let translatorPromise=null;
let serverDisabled=false;
let callbacks=0;
let lastStatus='idle';

export function dynamicTranslateStatus(){return lastStatus}
export function cachedDynamicTranslation(text){return cache.get(String(text))||null}
export function clearDynamicTranslationQueue(){
 if(flushTimer!==null)clearTimeout(flushTimer);
 flushTimer=null;
 queued.clear();
 callbacks++;
}
export function primeDynamicTranslator(){
 const Native=globalThis.Translator;
 if(!Native||typeof Native.create!=='function')return false;
 if(!translatorPromise){
  try{
   // Called directly within the language-button click to permit model download.
   translatorPromise=Promise.resolve(Native.create({sourceLanguage:'id',targetLanguage:'en'})).catch(()=>null);
  }catch{translatorPromise=Promise.resolve(null)}
 }
 return true;
}
function isIndonesianPublicText(text){
 if(text.length<12||text.length>11000)return false;
 if(!/[a-z]{3}/i.test(text)||/^\s*(?:https?:\/\/|[\d.,%-]+)\s*$/i.test(text))return false;
 if(/(?:<\s*\/?\w+>|\bsk_[a-z0-9]+\b|https?:\/\/\S+|www\.\S+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\+62\d{8,})/i.test(text))return false;
 return /\b(yang|dan|untuk|dengan|dari|pada|dalam|adalah|kami|kamu|anda|tersebut|bisa|akan|telah|sudah|agar|sebagai|tentang|melalui|saat|kebutuhan|perusahaan|bisnis|website|produk|layanan|pemerintah|terbaru|ekonomi|artikel|berita|harga|jasa|indonesia|proyek|pengguna|pelanggan|penjualan|pembayaran|konten|panduan|tampilan|pemesanan)\b/i.test(text);
}
export function shouldTranslatePublicText(text,element){
 if(!element||!element.closest?.('[data-dynamic-translate="public"]'))return false;
 if(element.closest?.('[data-no-translate],.consult-form,form,button,[contenteditable],.legal-document,pre,code'))return false;
 return isIndonesianPublicText(String(text||'').trim());
}
function chunkText(input,max=1100){
 const parts=[];let rest=String(input);
 while(rest.length>max){
  const stop=rest.lastIndexOf(' ',max);
  const cut=stop>max*0.45?stop:max;
  parts.push(rest.slice(0,cut));rest=rest.slice(cut).trimStart();
 }
 if(rest)parts.push(rest);
 return parts;
}
async function nativeTranslate(texts){
 const translator=await translatorPromise;
 if(!translator)return null;
 try{
  const output=[];
  for(const text of texts){
   output.push(await translator.translate(text));
  }
  return output;
 }catch{return null}
}
async function serverTranslate(texts){
 if(serverDisabled)return null;
 try{
  const res=await fetch(API_URL,{
   method:'POST',headers:{'Content-Type':'application/json',apikey:PUBLIC_KEY},
   body:JSON.stringify({segments:texts}),signal:AbortSignal.timeout(16000),credentials:'omit'
  });
  if(res.status===503||res.status===401||res.status===403||res.status===404){serverDisabled=true;lastStatus='not-configured';return null}
  if(!res.ok)return null;
  const data=await res.json();
  if(!Array.isArray(data?.translations)||data.translations.length!==texts.length)return null;
  return data.translations;
 }catch{
  // Network problems are not a license to send marketing copy to arbitrary origins.
  return null;
 }
}
async function translateTexts(texts){
 const native=translatorPromise?await nativeTranslate(texts):null;
 if(native)return native;
 return serverTranslate(texts);
}
async function translateOne(text){
 const chunks=chunkText(text);
 const output=[];
 for(let i=0;i<chunks.length;i+=8){
  const slice=chunks.slice(i,i+8);
  const translated=await translateTexts(slice);
  if(!translated)return null;
  output.push(...translated);
 }
 return output.join(' ');
}
async function flush(){
 if(running)return;
 running=true;
 try{
  while(queued.size){
   // Bounded processing: newly loaded articles may have dozens of paragraphs.
   const entries=[...queued.entries()].slice(0,10);
   for(const [source] of entries)queued.delete(source);
   for(const [source,subscribers] of entries){
    const result=await translateOne(source);
    if(typeof result==='string'&&result.trim()&&result!==source){
     cache.set(source,result.trim());
     if(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);
     lastStatus='ready';
     for(const callback of subscribers)callback(result.trim());
    }else{
     lastStatus=serverDisabled?'not-configured':'unavailable';
    }
   }
  }
 }finally{running=false}
}
export function queuePublicTranslation(source,onTranslated){
 const text=String(source||'').trim();
 if(!isIndonesianPublicText(text)||typeof onTranslated!=='function')return false;
 const cached=cache.get(text);
 if(cached){onTranslated(cached);return true}
 let waiting=queued.get(text);
 if(waiting){waiting.push(onTranslated);return true}
 // Avoid unbounded client work when dozens of large news stories render at once.
 if(queued.size>90)return false;
 queued.set(text,[onTranslated]);
 if(flushTimer===null)flushTimer=setTimeout(()=>{flushTimer=null;void flush()},70);
 return true;
}
