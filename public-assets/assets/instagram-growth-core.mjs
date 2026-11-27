export const count=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const dateFmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'});
const day=(d)=>{const p=Object.fromEntries(dateFmt.formatToParts(d).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
export function category(id){return /news/.test(id)?'Berita':/quote|-q\d+-/.test(id)?'Quotes':/carousel/.test(id)?'Carousel':/reel/.test(id)?'Reels':'Lainnya'}
export function auditState(entries,now=new Date()){
 if(!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('State tidak valid');
 const days=Object.fromEntries(Array.from({length:7},(_,i)=>[day(new Date(now.getTime()-(6-i)*86400000)),0]));const formats={};let unknown=0;
 for(const [id,r] of Object.entries(entries)){if(r?.status!=='published')continue;const ts=r.published_at||r.claimed_at;if(typeof ts!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(ts)){unknown++;continue}const d=new Date(ts);if(!Number.isFinite(+d)){unknown++;continue}const k=day(d);if(d>now||!Object.hasOwn(days,k))continue;days[k]++;const f=category(id);formats[f]=(formats[f]||0)+1}
 const today=days[day(now)];return {days,formats,today,week:Object.values(days).reduce((a,b)=>a+b,0),remaining:Math.max(0,5-today),unknown};
}
export function reviewDraft({headline='',caption='',topic='',kind='education',rights=false,original=false}){
 const h=headline.trim(),c=caption.trim(),t=topic.trim().toLowerCase(),tags=c.match(/#[\p{L}\p{N}_]+/gu)||[];
 const checks=[['Headline jelas dan terbaca (12–85 karakter)',h.length>=12&&h.length<=85],['Caption 30–2200 karakter',c.length>=30&&c.length<=2200],['Keyword ada secara natural di headline atau caption',!!t&&(h+' '+c).toLowerCase().includes(t)],['Ada CTA atau pertanyaan relevan',/\?|\b(simpan|bagikan|cek|baca|pelajari|lihat|komentar|diskusikan)\b/i.test(c)],['Hashtag tidak berlebihan (maks. 5)',tags.length<=5],['Orisinalitas diperiksa',original],['Hak penggunaan & fakta diperiksa',rights]];
 if(kind==='news')checks.push(['Caption mencantumkan tautan sumber',/https:\/\/[^\s]+/i.test(c)]);
 return {score:Math.round(100*checks.filter(x=>x[1]).length/checks.length),checks,reviewReady:rights&&original&&!!h&&!!c&&(kind!=='news'||/https:\/\/[^\s]+/i.test(c))};
}
export function headlines(topic,kind){const t=topic.trim().slice(0,100);if(!t)return [];const templates=kind==='news'?['Apa yang perlu diketahui tentang ','Mengapa perkembangan ini penting: ']:kind==='portfolio'?['Di balik proses: ','Apa yang berubah setelah ']:kind==='relatable'?['Kalau kamu pernah mengalami ini: ','Realita di balik ']:kind==='promotion'?['Pertimbangkan ini sebelum memilih ','Cara mengevaluasi ']:['Panduan praktis: ','Yang perlu kamu ketahui tentang '];return templates.map(x=>x+t)}
export function parseReport(obj){
 const i=obj?.insights;if(!i||!Array.isArray(i.posts)||i.posts.length>50||!Array.isArray(i.top_comparable))throw Error('Gunakan laporan JSON Insights V1 yang sudah didekripsi');
 const posts=i.posts.filter(p=>p&&typeof p.id==='string'&&typeof p.format==='string'&&count(p.age_hours)!==null&&p.metrics&&typeof p.metrics==='object');
 const views=posts.map(p=>count(p.metrics.views)).filter(v=>v!==null);
 const ranked=i.top_comparable.filter(p=>p&&typeof p.id==='string'&&count(p.views)!==null&&count(p.sample)>=3).slice(0,5);
 const groups=new Map();for(const p of posts){if(p.age_hours<24||count(p.metrics.views)===null||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.slot_wib))continue;const band=p.age_hours<72?'1–3d':p.age_hours<168?'3–7d':'7–30d';const bucket=p.slot_wib.slice(0,2)+':00';const key=JSON.stringify([p.format,band]);if(!groups.has(key))groups.set(key,new Map());const m=groups.get(key);if(!m.has(bucket))m.set(bucket,[]);m.get(bucket).push(p.metrics.views)}
 const slots=[];for(const [key,m] of groups){const eligible=[...m].filter(x=>x[1].length>=3);if(eligible.length<2)continue;const [format,band]=JSON.parse(key);const med=x=>{const v=x.slice().sort((a,b)=>a-b);return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2};const sorted=eligible.map(([slot,v])=>({slot,n:v.length,median:med(v)})).sort((a,b)=>b.median-a.median);slots.push({format,band,...sorted[0]})}
 return {sample:posts.length,coverage:views.length,views:views.length?views.reduce((a,b)=>a+b,0):null,ranked,slots};
}
