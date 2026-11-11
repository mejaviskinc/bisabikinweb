'use client';
import {useState} from 'react';
import {ArrowUpRight,Check,ChevronDown} from 'lucide-react';
import {money} from '../lib/data';
import {api,event,whatsapp} from '../lib/client';
import {submitLead} from '../lib/supabase';
export function Calculator({settings}:{settings:any}){const [type,setType]=useState('Landing Page');const [pages,setPages]=useState(1);const [selected,setSelected]=useState<string[]>([]);const extras:any={'Online shop':4000000,'Payment gateway':1500000,'Blog / CMS':1500000,'Dashboard custom':4500000,'Login/register':1500000,'SEO audit':750000,'Multi-language':1000000,'Custom animation':600000};const base:any={'Landing Page':1490000,'Company Profile':3490000,'Online Store':6990000,'Custom Web App':12500000};const included:any={'Landing Page':1,'Company Profile':5,'Online Store':7,'Custom Web App':1};const min=base[type]+Math.max(0,pages-included[type])*300000+selected.reduce((t,x)=>t+extras[x],0);const text=`Halo Bisabikinweb, saya ingin konsultasi estimasi website.\nJenis: ${type}\nHalaman: ${pages}\nFitur: ${selected.join(', ')||'Standar'}\nEstimasi awal: ${money(min)} – ${money(Math.round(min*1.5))}. Mohon penawaran final.`;return <div className="calculator"><div><span className="eyebrow">NO GUESSWORK.</span><h2>Idenya apa?<br/>Kita hitung dulu.</h2><p>Geser, pilih, dan dapatkan gambaran budget. Tanpa harus menebak-nebak.</p><small>Estimasi indikatif, bukan penawaran final. Biaya layanan pihak ketiga dan scope final dikonfirmasi saat konsultasi. Maintenance dihitung per bulan.</small></div><div className="calc-panel"><label>Jenis website<select value={type} onChange={e=>setType(e.target.value)}>{Object.keys(base).map(x=><option key={x}>{x}</option>)}</select></label><label className="range-label">Jumlah halaman <strong>{pages} halaman</strong><input type="range" min="1" max="20" value={pages} onChange={e=>setPages(+e.target.value)}/></label><span className="field-label">Bikin lebih powerful <small>Opsional</small></span><div className="feature-toggles">{Object.keys(extras).map(x=><button key={x} aria-pressed={selected.includes(x)} onClick={()=>setSelected(a=>a.includes(x)?a.filter(y=>y!==x):[...a,x])}>{selected.includes(x)?<Check size={13}/>:<span>+</span>}{x}</button>)}</div><div className="estimate"><span>ESTIMASI PROJECT</span><strong>{money(min)} <small>–</small> {money(Math.round(min*1.5))}</strong><a className="btn primary" href={settings.whatsapp?whatsapp(settings.whatsapp,text):'/kontak?estimate='+encodeURIComponent(text)} onClick={()=>event('consultation_click')}>Konsultasikan Estimasi Ini <ArrowUpRight size={18}/></a></div></div></div>}
export function Consultation({locale='id'}:{locale?:'id'|'en'}){
 const english=locale==='en';
 const [state,setState]=useState('');
 const [busy,setBusy]=useState(false);
 const fields=english
  ? {name:'Your name',company:'Business name',phone:'WhatsApp',email:'Email',type:'Website type',budget:'Budget',domain:'Domain',deadline:'Target launch',features:'Required features',reference:'Reference website',message:'Project brief'}
  : {name:'Nama',company:'Bisnis',phone:'WhatsApp',email:'Email',type:'Jenis website',budget:'Budget',domain:'Domain',deadline:'Target online',features:'Fitur',reference:'Referensi',message:'Ide project'};
 const types=[
  ['Landing Page','Landing page'],['Company Profile','Company website'],['Online Store','Online store'],
  ['Personal / Portfolio','Personal / portfolio'],['Custom Web App','Custom web app'],
  ['Maintenance','Website maintenance'],['Belum yakin','Not sure yet']
 ];
 const budgets=[
  ['Belum ditentukan','Undecided'],['Rp800.000 – Rp2 juta','IDR 800,000 – 2 million'],
  ['Rp2 – Rp5 juta','IDR 2 – 5 million'],['Rp5 – Rp10 juta','IDR 5 – 10 million'],
  ['Di atas Rp10 juta','Over IDR 10 million']
 ];
 const domains=[['Belum','Not yet'],['Sudah','Yes'],['Butuh bantuan memilih','Need help choosing']];
 return <form className="consult-form" onSubmit={async e=>{
  e.preventDefault();setBusy(true);setState('');
  const data=Object.fromEntries(new FormData(e.currentTarget));
  try{
   if(data.website)return;
   await submitLead(data);
   const leadText=(english
     ? 'Hello BisaBikinWeb, I would like to discuss a website project.\n'
     : 'Halo Bisabikinweb, saya ingin konsultasi website.\n')
     +Object.entries(fields).filter(([key])=>data[key]).map(([key,label])=>label+': '+String(data[key])).join('\n');
   setState(english?'Inquiry saved. Opening WhatsApp…':'Data tersimpan. Membuka WhatsApp…');
   window.location.assign(whatsapp('62882003740969',leadText));
  }catch(err:any){setState((english?'Could not save your inquiry: ':'Gagal menyimpan konsultasi: ')+err.message)}
  finally{setBusy(false)}
 }}>
  <div className="form-grid">
   <label>{english?'Your name *':'Nama kamu *'}<input name="name" required minLength={2} maxLength={100} placeholder={english?'Full name':'Nama lengkap'} autoComplete="name"/></label>
   <label>{english?'Business name':'Nama bisnis'}<input name="company" maxLength={150} placeholder={english?'Company / brand':'Nama brand / perusahaan'} autoComplete="organization"/></label>
   <label>WhatsApp *<input name="phone" type="tel" minLength={8} maxLength={20} required placeholder={english?'+62 or international number':'08xxxxxxxxxx'} autoComplete="tel"/></label>
   <label>Email *<input name="email" type="email" required placeholder={english?'you@business.com':'kamu@bisnis.com'} autoComplete="email"/></label>
   <label>{english?'Website type':'Jenis website'}<select name="type">{types.map(([value,label])=><option key={value} value={value}>{english?label:value}</option>)}</select></label>
   <label>Budget<select name="budget">{budgets.map(([value,label])=><option key={value} value={value}>{english?label:value}</option>)}</select></label>
   <label>{english?'Already own a domain?':'Sudah punya domain?'}<select name="domain">{domains.map(([value,label])=><option key={value} value={value}>{english?label:value}</option>)}</select></label>
   <label>{english?'Target launch date':'Target online'}<input name="deadline" type="date"/></label>
  </div>
  <label>{english?'Required features':'Fitur yang dibutuhkan'}<input name="features" placeholder={english?'For example: product catalog, booking, multilingual':'Contoh: katalog, booking, dua bahasa'} maxLength={1000}/></label>
  <label>{english?'Reference website':'Website referensi'}<input name="reference" type="url" placeholder="https://..." maxLength={500}/></label>
  <label>{english?'Tell us about your project':'Ceritain idenya'}<textarea name="message" rows={5} maxLength={3000} defaultValue={typeof window!=='undefined'?new URLSearchParams(window.location.search).get('estimate')||'':''} placeholder={english?'What do you need to build, and who will use it?':'Apa yang ingin dibangun dan siapa penggunanya?'}/></label>
  <input className="honeypot" name="website" tabIndex={-1} aria-hidden="true" autoComplete="off"/>
  <label className="checkline"><input type="checkbox" required/>{english
    ? <>I agree that my data will be used to respond to this inquiry under the <a href="/privacy/">privacy policy (Indonesian)</a>.</>
    : <>Saya setuju data ini digunakan untuk menanggapi konsultasi sesuai <a href="/privacy/">kebijakan privasi</a>.</>}</label>
  {state&&<p role="alert" className={state.includes('saved')||state.startsWith('Data tersimpan')?'success':'error'}>{state}</p>}
  <button className="btn primary" disabled={busy}>{busy?(english?'Saving…':'Menyimpan…'):(english?'Submit inquiry via WhatsApp':'Konsultasi via WhatsApp')}<ArrowUpRight size={18}/></button>
  <small>{english?'Your inquiry is saved before WhatsApp opens so our team can review it.':'Data konsultasi disimpan aman di database lalu WhatsApp dibuka agar pesan bisa langsung dikirim.'}</small>
 </form>;
}
export function Newsletter(){return <a className="btn primary" href="https://wa.me/62882003740969?text=Halo%20Bisabikinweb%2C%20saya%20ingin%20mendapatkan%20informasi%20terbaru%20dari%20studio.">Hubungi studio via WhatsApp <ArrowUpRight size={18}/></a>}
export function FAQ({items}:{items:any[]}){return <div className="faq-list">{items.map(([q,a],i)=><details key={i}><summary><span>{q}</span><ChevronDown size={18}/></summary><p>{a}</p></details>)}</div>}
