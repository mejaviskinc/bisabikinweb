'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,Check,Search,Monitor,Globe2,ShieldCheck,LayoutTemplate,Clock3} from 'lucide-react';
import {websiteCategories,websitePackages,websiteConcepts,websiteStatusLabel,rupiah} from '../lib/website-store';
import {getWebsiteCatalog,websiteStoreApi} from '../lib/website-store-api';
import {customerGetSession} from '../lib/customer';
import {whatsapp} from '../lib/client';
import {websiteDemos} from '../lib/website-demos.mjs';
import {creativeFor} from '../lib/demo-creative.mjs';
import DokuPaymentChannels from '../components/DokuPaymentChannels';

type Template={slug:string;title:string;category:string;description:string;features?:string[];image_url?:string;demo_url?:string;theme?:string;concept?:boolean};
type Package={slug:string;name:string;description:string;base_price:number|null;features:string[]};
const legacyConcepts:Template[]=websiteConcepts.map(x=>({...x,concept:true}));
const conceptTemplates:Template[]=websiteDemos.map(d=>({slug:d.slug,title:d.title,category:d.category,description:d.description,features:d.highlights,image_url:d.image,demo_url:'https://bisabikinweb.site/demo/'+d.slug+'/',concept:false,theme:d.category}));
const basePackages:Package[]=websitePackages.map(x=>({...x,features:[...x.features]}));
const pendingConsultationKey='bbweb_pending_website_consultation';
function rememberPaidConsultation(orderId:string){try{sessionStorage.setItem(pendingConsultationKey,orderId)}catch{}}
function websitePaidConsultationMessage(order:any){
 const category=websiteCategories.find(c=>c.slug===order.category)?.label||order.category||'-';
 const design=websiteDemos.find(d=>d.slug===order.template_slug)?.title||order.template_slug||'Desain custom';
 const selectedPackage=websitePackages.find(p=>p.slug===order.package_slug)?.name||order.package_slug||'-';
 return [
  'Halo tim BisaBikinWeb, saya ingin melanjutkan konsultasi desain website setelah pembayaran terverifikasi.',
  '',
  '*Nomor pesanan:* '+order.order_no,
  '*Nama klien:* '+(order.full_name||'-'),
  '*Nama bisnis:* '+(order.company||'-'),
  '*Email:* '+(order.email||'-'),
  '*WhatsApp klien:* '+(order.phone||'-'),
  '*Industri:* '+category,
  '*Paket website:* '+selectedPackage,
  '*Desain dipilih:* '+design,
  '*Domain yang diinginkan:* '+(order.requested_domain||'Belum ditentukan'),
  '*Total pembayaran:* '+(order.quoted_total==null?'-':rupiah(Number(order.quoted_total))),
  '',
  'Pembayaran sudah diverifikasi oleh sistem. Mohon bantuan untuk konsultasi desain dan pengurusan domain.'
 ].join('\n');
}
function safeUrl(raw:any){try{const u=new URL(String(raw||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
// Render the actual demo's first-fold design from its shared content and visual tokens.
// External iframes can fail to load or be blocked, leaving broken gray rectangles.
function LiveSitePreview({slug}:{slug:string}){
 const d=websiteDemos.find(demo=>demo.slug===slug);
 if(!d)return null;
 const creative=creativeFor(d.slug);
 const style={'--wd-ink':d.palette.ink,'--wd-accent':d.palette.accent,'--wd-paper':d.palette.paper,'--wd-deep':d.palette.deep} as React.CSSProperties;
 return <div className="ws-live-canvas" aria-label={'Cuplikan website demo '+d.title}>
  <div className="ws-demo-mini-site">
   <div className={'wd-root wd-layout-'+d.layout+' wd-sector-'+d.category} style={style}>
    <div className="wd-preview-ribbon"><div><span className="wd-live-dot"/>DEMO INTERAKTIF • {d.title.toUpperCase()}</div><div>WEB DESIGN / BISABIKINWEB</div></div>
    <header className="wd-header"><span className="wd-logo">{d.title}<small>®</small></span><nav className="wd-nav" aria-label="Contoh navigasi website"><span>Beranda</span><span>Koleksi</span><span>Layanan</span><span>Tentang</span><span>Kontak</span></nav><span className="wd-header-contact">Hubungi kami <ArrowUpRight size={15}/></span></header>
    <section className="wd-hero">
     <div className="wd-hero-copy">
      <div className="wd-kicker"><i/>{d.tagline} <span>/ {d.category.toUpperCase()}</span></div>
      <h1>{creative?.headline||d.headline}</h1><p>{creative?.story||d.description}</p>
      <div className="wd-hero-actions"><span className="wd-main-button">{d.action}<ArrowUpRight size={19}/></span><span className="wd-secondary-button">Kenali kami <ArrowRight size={16}/></span></div>
      <div className="wd-hero-caption"><span>THOUGHTFULLY PRESENTED</span><span>—</span><span>MADE FOR THE EVERYDAY</span></div>
     </div>
     <div className={'wd-visual wd-visual-'+d.layout}>
      <img src={d.image} alt="" loading="lazy" decoding="async" onError={e=>{e.currentTarget.style.display='none'}}/>
      <div className="wd-visual-halo" aria-hidden="true"><i/><i/><i/></div>
      <div className="wd-visual-note"><span>{d.tagline.toUpperCase()}</span><strong>01 / 03</strong></div>
     </div>
    </section>
    <div className="wd-ticker"><span>{d.tagline}</span>{d.highlights.map(h=><span key={h}>{h}</span>)}</div>
   </div>
  </div>
 </div>;
}
function Preview({item}:{item:Template}){
 const src=safeUrl(item.image_url);
 const demoUrl=safeUrl(item.demo_url);
 const liveDemo=websiteDemos.find(d=>d.slug===item.slug);
 const hasLivePreview=Boolean(liveDemo&&/^https:\/\/bisabikinweb\.site\/demo\/[a-z0-9-]+\/$/.test(demoUrl));
 return <div className={'ws-preview ws-preview-'+(item.theme||'graphite')}>
  {hasLivePreview?<LiveSitePreview slug={item.slug}/>:
  src?<img src={src} alt={'Pratinjau '+item.title} loading="lazy" width="700" height="420"/>:
  <div className="ws-faux-browser" aria-label="Ilustrasi konsep desain, bukan screenshot situs jadi">
   <span className="ws-browser-chrome"><i/><i/><i/><b>DESIGN CONCEPT</b></span>
   <div className="ws-browser-body"><span className="ws-mini-brand">YOUR BRAND <span>↗</span></span><div className="ws-shapes"><div><strong>Make your<br/>mark online.</strong><small>Professional digital presence</small><em/></div><div className="ws-art-shape"><span>WEB</span></div></div><div className="ws-mini-cards"><span/><span/><span/></div></div>
  </div>}
  {item.concept?<span className="ws-concept-tag">Ilustrasi konsep</span>:demoUrl&&<span className="ws-concept-tag ws-demo-tag">LIVE DEMO TERSEDIA</span>}
 </div>
}
function PriceCards({items}:{items:Package[]}){
 return <div className="ws-package-grid">{items.map(p=><article className="ws-package" key={p.slug}>
  <small>PAKET / {p.slug.toUpperCase()}</small><h3>{p.name}</h3><strong>{p.base_price===null?'Konsultasi':rupiah(p.base_price)}</strong>
  <p>{p.description}</p><ul>{(p.features||[]).map(f=><li key={f}><Check size={14}/>{f}</li>)}</ul>
  <a className="btn primary" href={'/pesan-website/?paket='+encodeURIComponent(p.slug)}>Pilih paket <ArrowUpRight size={16}/></a>
 </article>)}</div>
}
export default function WebsiteStore({path}:{path:string}){
 const [templates,setTemplates]=useState<Template[]>(conceptTemplates);
 const [packages,setPackages]=useState<Package[]>(basePackages);
 const [search,setSearch]=useState(''),[category,setCategory]=useState(websiteCategories.some(c=>c.slug===path.split('/')[2])?path.split('/')[2]:'semua');
 useEffect(()=>{let active=true;getWebsiteCatalog().then(rows=>{
  if(!active||!rows)return;
  if(rows.templates.length)setTemplates(()=>{const remote=rows.templates.filter(t=>/^[a-z0-9-]+$/.test(String(t.slug||''))).map(t=>({...t,concept:false}));const remoteBySlug=new Map(remote.map(t=>[t.slug,t]));return [...conceptTemplates.map(local=>({...local,...(remoteBySlug.get(local.slug)||{}),title:local.title,description:local.description,features:local.features,image_url:local.image_url,demo_url:local.demo_url,category:local.category})),...remote.filter(t=>!conceptTemplates.some(local=>local.slug===t.slug))];});
  if(rows.packages.length)setPackages(rows.packages.map(p=>({...p,base_price:p.base_price==null?null:Number(p.base_price)})));
 });return()=>{active=false}},[]);
 const match=path.match(/^\/desain\/([a-z0-9-]+)$/);
 const item=match?(templates.find(t=>t.slug===match[1])||legacyConcepts.find(t=>t.slug===match[1])):null;
 const categorySlug=path.startsWith('/beli-website/')?path.split('/')[2]:null;
 useEffect(()=>{if(categorySlug&&websiteCategories.some(c=>c.slug===categorySlug))setCategory(categorySlug)},[categorySlug]);
 const visible=useMemo(()=>templates.filter(t=>(category==='semua'||t.category===category)&&[t.title,t.description,t.category].join(' ').toLowerCase().includes(search.toLowerCase().trim())),[templates,category,search]);
 if(path==='/harga-website')return <div className="ws-root"><section className="ws-hero section"><small>PAKET WEBSITE / TRANSPARAN</small><h1>Harga website.<br/><em>Jelas dari awal.</em></h1><p>Bandingkan paket berdasarkan kebutuhan usaha. Harga yang tampil adalah harga mulai; biaya domain, hosting, integrasi dan revisi disepakati dalam penawaran final.</p><div className="ws-actions"><a className="btn primary" href="/beli-website/">Jelajahi desain <ArrowRight size={17}/></a></div></section><section className="section ws-section"><PriceCards items={packages}/><p className="ws-disclaimer">Pilihan pembayaran untuk jasa website masih melalui penawaran dan invoice terverifikasi. Checkout otomatis jasa belum diaktifkan.</p></section></div>;
 if(match){
  if(!item)return <section className="section ws-root"><h1>Desain belum tersedia.</h1><p>Desain ini mungkin belum dipublikasikan. Silakan kembali ke katalog.</p><a className="btn primary" href="/beli-website/">Lihat katalog</a></section>;
  const cat=websiteCategories.find(c=>c.slug===item.category);
  return <div className="ws-root"><section className="section ws-detail"><nav aria-label="Breadcrumb" className="ws-breadcrumb"><a href="/beli-website/">Beli Website</a><span>/</span>{cat?.label||item.category}</nav><div className="ws-detail-grid"><div><small>DESAIN / {String(item.category).toUpperCase()}</small><h1>{item.title}<em>.</em></h1>{safeUrl(item.demo_url)&&<div className="ws-live-status"><span/> Website demo aktif — bisa dibuka di browser</div>}<p>{item.description}</p><ul className="ws-feature-list">{(item.features?.length?item.features:cat?.features||[]).map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul><div className="ws-actions"><a className="btn primary" href={'/pesan-website/?desain='+encodeURIComponent(item.slug)}>Pilih desain <ArrowUpRight size={17}/></a>{safeUrl(item.demo_url)&&<a className="btn ws-live-button" href={safeUrl(item.demo_url)} target="_blank" rel="noopener noreferrer">Buka website demo <ArrowUpRight size={16}/></a>}</div>{item.concept&&<p className="ws-disclaimer">Ini ilustrasi konsep, bukan template siap pakai atau situs live. Detail desain dan ruang lingkup disepakati saat pemesanan.</p>}</div><Preview item={item}/></div></section><section className="section ws-section"><h2>Pilih paket pengerjaan</h2><PriceCards items={packages}/></section></div>;
 }
 return <div className="ws-root"><section className="section ws-hero"><div className="ws-hero-layout"><div><small>BISABIKINWEB.ID / 60 LIVE WEBSITE DEMOS</small><h1>Website impianmu.<br/><em>Pilih, pesan, jadi.</em></h1><p>Jelajahi 60 konsep website multipage dalam delapan industri. Setiap demo memperlihatkan struktur navigasi dan layanan yang relevan dengan cara bisnis bekerja, lalu pilih desain untuk mengirim brief. Tim kami akan meninjau detail dan mengirim penawaran sebelum pengerjaan dimulai.</p><div className="ws-actions"><a className="btn primary" href="#koleksi">Cari desain website <ArrowRight size={17}/></a><a className="btn" href="/harga-website/">Bandingkan paket</a></div></div><div className="ws-hero-visual"><Preview item={conceptTemplates[1]}/><span>DESIGN FOR YOUR BUSINESS</span></div></div></section>
 <section className="ws-steps section" aria-label="Cara memesan website">{[['01','Pilih desain','Temukan ide tampilan yang cocok.'],['02','Pilih paket','Sesuaikan fitur dan kisaran biaya.'],['03','Kirim brief','Jelaskan bisnis dan domain pilihan.'],['04','Terima penawaran','Tim mengonfirmasi scope serta invoice.']].map(step=><article key={step[0]}><small>{step[0]}</small><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</section>
 <section className="section ws-section" id="koleksi"><div className="ws-section-heading"><div><small>KATALOG DESAIN WEBSITE</small><h2>Desain untuk<br/><em>setiap bisnis.</em></h2><p>60 konsep ini ditata sebagai website multipage sesuai industrinya, dengan halaman katalog, layanan, cerita usaha dan inquiry simulasi. Fitur produksi dan integrasi dijelaskan pada penawaran.</p></div><a className="text-link" href="/harga-website/">Lihat daftar harga <ArrowUpRight size={17}/></a></div><div className="ws-toolbar"><label><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari desain atau industri..." aria-label="Cari desain website"/></label><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter kategori website"><option value="semua">Semua kategori</option>{websiteCategories.map(c=><option value={c.slug} key={c.slug}>{c.label}</option>)}</select></div><div className="ws-template-grid">{visible.map(t=><article className="ws-template" key={t.slug}><div className="ws-template-visual"><Preview item={t}/><a className="ws-template-visual-link" href={safeUrl(t.demo_url)||'/desain/'+t.slug+'/'} target={safeUrl(t.demo_url)?'_blank':undefined} rel={safeUrl(t.demo_url)?'noopener noreferrer':undefined} aria-label={(safeUrl(t.demo_url)?'Buka website demo ':'Detail desain ')+t.title}><span>Buka website <ArrowUpRight size={16}/></span></a></div><div className="ws-template-copy"><small>{websiteCategories.find(c=>c.slug===t.category)?.label||t.category}</small><h3>{t.title}</h3><p>{t.description}</p><div>{safeUrl(t.demo_url)&&<a className="ws-live-link" href={safeUrl(t.demo_url)} target="_blank" rel="noopener noreferrer">Buka demo <ArrowUpRight size={15}/></a>}<a href={'/desain/'+t.slug+'/'}>Detail desain <ArrowUpRight size={15}/></a><a href={'/pesan-website/?desain='+encodeURIComponent(t.slug)}>Pesan <ArrowRight size={15}/></a></div></div></article>)}</div>{!visible.length&&<p className="ws-empty">Belum ada desain di kategori ini. Coba kategori lain atau <a href="/kontak/">konsultasikan desain custom.</a></p>}</section>
 <section className="section ws-categories"><div className="ws-section-heading"><div><small>PILIH BERDASARKAN INDUSTRI</small><h2>Website sesuai<br/><em>cara bisnismu bekerja.</em></h2></div></div><div className="ws-category-grid">{websiteCategories.map(c=><a href={'/beli-website/'+c.slug+'/'} key={c.slug}><span>{c.label}</span><p>{c.lead}</p><ArrowUpRight size={19}/></a>)}</div></section>
 <section className="section ws-section"><div className="ws-section-heading"><div><small>PAKET PENGERJAAN</small><h2>Pilih yang masuk<br/><em>ke anggaranmu.</em></h2></div></div><PriceCards items={packages}/></section>
 <section className="section ws-closing"><Globe2 size={28}/><h2>Masih belum menemukan desain yang cocok?</h2><p>Website custom selalu bisa dibicarakan. Jelaskan kebutuhanmu, kami bantu susun scope dan penawarannya.</p><a className="btn primary" href="/pesan-website/?paket=custom">Pesan website custom <ArrowUpRight size={17}/></a></section></div>;
}

export function WebsiteCheckout(){
 const [packageSlug,setPackageSlug]=useState('starter'),[templateSlug,setTemplateSlug]=useState('');
 const [packages,setPackages]=useState<Package[]>(basePackages);
 const [fields,setFields]=useState({full_name:'',email:'',phone:'',company:'',category:'umkm',domain:'',reference_url:'',brief:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<any>(null),[logged,setLogged]=useState<boolean|null>(null);
 useEffect(()=>{const query=new URLSearchParams(location.search);const pkg=query.get('paket');const design=query.get('desain');if(pkg&&/^[a-z0-9-]+$/.test(pkg))setPackageSlug(pkg);if(design&&/^[a-z0-9-]+$/.test(design)){setTemplateSlug(design);const chosen=websiteDemos.find(d=>d.slug===design);if(chosen){setFields(f=>({...f,category:chosen.category}));if(!pkg)setPackageSlug(chosen.packageSlug)}}customerGetSession().then(s=>{setLogged(Boolean(s));if(s?.user?.email)setFields(f=>({...f,email:s.user.email||f.email,full_name:s.user.user_metadata?.full_name||f.full_name}))}).catch(()=>setLogged(false));getWebsiteCatalog().then(rows=>{if(rows?.packages.length)setPackages(rows.packages.map(p=>({...p,base_price:p.base_price==null?null:Number(p.base_price)})))});},[]);
 const current=packages.find(p=>p.slug===packageSlug);
 const selectedDesign=websiteDemos.find(d=>d.slug===templateSlug);
 const setField=(key:string,value:string)=>setFields(p=>({...p,[key]:value}));
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');try{
   const response=await websiteStoreApi('create_order',{package_slug:packageSlug,template_slug:templateSlug||null,...fields});
   setResult(response.order);
 }catch(e:any){setError(String(e.message||'Permintaan gagal.'))}finally{setBusy(false)}}
 if(result)return <section className="section ws-root ws-confirmation"><ShieldCheck size={42}/><small>PERMINTAAN BERHASIL DISIMPAN</small><h1>Brief diterima.</h1><p>Nomor permintaan: <strong>{result.order_no}</strong>. Status: {websiteStatusLabel[result.status]||'Menunggu tinjauan'}. Belum ada pembayaran yang ditagihkan. Tim akan memeriksa scope dan mengirim penawaran.</p><a className="btn primary" href="/client/dashboard/">Lihat proyek saya <ArrowUpRight size={17}/></a></section>;
 return <div className="ws-root"><section className="section ws-order"><nav aria-label="Breadcrumb" className="ws-breadcrumb"><a href="/beli-website/">Beli Website</a><span>/</span>Pemesanan</nav><small>BRIEF / PESAN WEBSITE</small><h1>Mulai dari<br/><em>cerita bisnismu.</em></h1><p>Pilih paket dan isi brief. Permintaan ini bukan pembayaran otomatis; kami akan memverifikasi detail domain, biaya, dan fitur sebelum menerbitkan invoice.</p>{selectedDesign&&<div className="ws-selected-design"><strong>Desain dipilih: {selectedDesign.title}</strong><span>{websiteCategories.find(c=>c.slug===selectedDesign.category)?.label||selectedDesign.category} · Paket {current?.name||packageSlug}</span><a href={'/demo/'+selectedDesign.slug+'/'} target="_blank" rel="noopener noreferrer">Lihat desain <ArrowUpRight size={15}/></a></div>}<div className="ws-order-layout"><form onSubmit={submit} className="ws-form">
  {logged===false&&<div className="ws-notice">Silakan <a href="/account/">login atau daftar akun pembeli</a> sebelum mengirim permintaan. Akun yang sama dipakai untuk memantau proyek.</div>}
  <div className="ws-form-grid"><label>Nama lengkap *<input required maxLength={120} value={fields.full_name} onChange={e=>setField('full_name',e.target.value)}/></label><label>Email *<input type="email" required maxLength={254} value={fields.email} onChange={e=>setField('email',e.target.value)}/></label><label>WhatsApp *<input required maxLength={32} value={fields.phone} onChange={e=>setField('phone',e.target.value)} placeholder="08..."/></label><label>Nama bisnis *<input required maxLength={160} value={fields.company} onChange={e=>setField('company',e.target.value)}/></label><label>Kategori bisnis<select value={fields.category} onChange={e=>setField('category',e.target.value)}>{websiteCategories.map(c=><option value={c.slug} key={c.slug}>{c.label}</option>)}</select></label><label>Paket website *<select required value={packageSlug} onChange={e=>setPackageSlug(e.target.value)}>{packages.map(p=><option key={p.slug} value={p.slug}>{p.name} — {p.base_price===null?'Penawaran':rupiah(p.base_price)}</option>)}</select></label><label className="wide">Desain yang dipilih (opsional)<input maxLength={100} value={templateSlug} onChange={e=>setTemplateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="Kode desain katalog"/></label><label className="wide">Domain yang diinginkan<input maxLength={253} value={fields.domain} onChange={e=>setField('domain',e.target.value)} placeholder="contohbisnis.com (perlu verifikasi manual)"/></label><label className="wide">Referensi desain (URL, opsional)<input type="url" maxLength={500} value={fields.reference_url} onChange={e=>setField('reference_url',e.target.value)} placeholder="https://..."/></label><label className="wide">Ceritakan kebutuhan website *<textarea required minLength={20} rows={6} maxLength={3500} value={fields.brief} onChange={e=>setField('brief',e.target.value)} placeholder="Tujuan website, halaman, fitur, target pelanggan, dan estimasi deadline..."/></label></div>
  <p className="ws-disclaimer">Dengan mengirim permintaan, kamu menyetujui <a href="/terms/">Syarat & Ketentuan</a> serta <a href="/privacy/">Kebijakan Privasi</a>. Domain dan harga akhir belum dikonfirmasi.</p>{error&&<p className="ws-error" role="alert">{error}</p>}<button className="btn primary" type="submit" disabled={busy||!logged}>{busy?'Menyimpan permintaan...':'Kirim brief & minta penawaran'} <ArrowUpRight size={16}/></button>
 </form><aside className="ws-order-summary"><small>RINGKASAN PERMINTAAN</small><h3>{current?.name||'Paket tidak tersedia'}</h3><strong>{current?.base_price==null?'Menunggu penawaran':rupiah(current.base_price)}</strong><p>Estimasi harga mulai, belum termasuk biaya tambahan yang disepakati.</p><ul>{(current?.features||[]).map(f=><li key={f}><Check size={14}/>{f}</li>)}</ul><div className="ws-summary-note"><Clock3 size={18}/> Penawaran dan invoice diterbitkan setelah brief diverifikasi.</div></aside></div></section></div>;
}

export function WebsiteClientProjects({whatsappNumber}:{whatsappNumber:string}){
 const redirectedToConsultation=useRef(false);
 const [consultOrderId]=useState<string>(()=>{
  if(typeof window==='undefined')return '';
  const fromReturn=new URLSearchParams(window.location.search).get('consult')||'';
  let fromCheckout='';
  try{fromCheckout=sessionStorage.getItem(pendingConsultationKey)||''}catch{}
  const id=fromReturn||fromCheckout;
  return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)?id:'';
 });
 const [orders,setOrders]=useState<any[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[logged,setLogged]=useState<boolean|null>(null);
 const [selected,setSelected]=useState(''),[note,setNote]=useState(''),[sending,setSending]=useState(false),[notice,setNotice]=useState('');
 const [payingId,setPayingId]=useState('');
 const safeDokuUrl=(raw:unknown,mode:string)=>{try{const u=new URL(String(raw||''));return u.protocol==='https:'&&!u.username&&!u.password&&(mode==='production'?['checkout.doku.com','jokul.doku.com']:['sandbox.doku.com']).includes(u.hostname)?u.href:''}catch{return ''}};
 async function payNow(id:string){setPayingId(id);setError('');setNotice('');try{const result=await websiteStoreApi('create_payment',{id});const url=safeDokuUrl(result.redirect_url,result.environment);if(!url)throw Error('Tautan DOKU tidak valid.');rememberPaidConsultation(id);location.assign(url);}catch(e:any){setError(String(e.message||'Pembayaran DOKU belum dapat dibuka.'));setPayingId('');}}
 async function loadOrders(){const session=await customerGetSession();setLogged(Boolean(session));if(!session)return;const r=await websiteStoreApi('my_orders',{},session.access_token);setOrders(r.orders||[]);}
 useEffect(()=>{let alive=true;(async()=>{try{if(alive)await loadOrders()}catch(e:any){if(alive)setError(String(e.message||'Gagal memuat proyek.'))}finally{if(alive)setBusy(false)}})();return()=>{alive=false}},[]);
 // DOKU redirects back here; the webhook, not the callback query, must confirm payment.
 useEffect(()=>{
  if(!consultOrderId||!logged||busy||redirectedToConsultation.current)return;
  const paidOrder=orders.find(order=>order.id===consultOrderId&&order.payment_status==='paid');
  if(!paidOrder)return;
  const digits=whatsappNumber.replace(/\D/g,'');
  if(digits.length<10||digits.length>15){setError('Nomor WhatsApp konsultasi belum valid. Hubungi admin BisaBikinWeb.');return;}
  redirectedToConsultation.current=true;
  try{
   sessionStorage.removeItem(pendingConsultationKey);
   const cleanUrl=new URL(window.location.href);
   cleanUrl.searchParams.delete('consult');
   history.replaceState(history.state,'',cleanUrl.pathname+cleanUrl.search+cleanUrl.hash);
  }catch{}
  window.location.assign(whatsapp(whatsappNumber,websitePaidConsultationMessage(paidOrder)));
 },[consultOrderId,logged,busy,orders,whatsappNumber]);
 // Provider notifications can arrive after the browser returns; retry status briefly.
 useEffect(()=>{
  if(!consultOrderId||!logged||redirectedToConsultation.current)return;
  let polls=0;
  const timer=window.setInterval(()=>{
   if(redirectedToConsultation.current||++polls>40){window.clearInterval(timer);return;}
   void loadOrders().catch((e:any)=>setError(String(e.message||'Gagal memeriksa status pembayaran.')));
  },3000);
  return()=>window.clearInterval(timer);
 },[consultOrderId,logged]);
 async function requestRevision(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!selected)return;setSending(true);setError('');setNotice('');try{await websiteStoreApi('request_revision',{id:selected,note});setNotice('Permintaan revisi berhasil disimpan.');setSelected('');setNote('');await loadOrders();}catch(e:any){setError(String(e.message||'Revisi belum tersimpan.'))}finally{setSending(false)}}
 return <section className="section ws-root ws-projects">
  <small>CLIENT AREA / WEBSITE PROJECTS</small><h1>Website yang<br/><em>sedang dibangun.</em></h1>
  <p>Pantau permintaan dan progres pengerjaan website, terpisah dari pesanan merchandise.</p>
  <div className="ws-actions"><a href="/pesan-website/" className="btn primary">Buat pesanan baru <ArrowUpRight size={15}/></a><a href="/account/" className="btn">Akun pembeli</a><button type="button" className="btn" onClick={()=>{setBusy(true);loadOrders().catch((e:any)=>setError(String(e.message))).finally(()=>setBusy(false))}}>Perbarui status pembayaran</button></div>
  {busy&&<p>Memuat data...</p>}{!busy&&!logged&&<div className="ws-notice">Masuk melalui <a href="/account/">akun pembeli</a> untuk melihat proyek.</div>}
  {error&&<p className="ws-error" role="alert">{error}</p>}{notice&&<p className="ws-notice" role="status">{notice}</p>}
  {!busy&&logged&&orders.length===0&&<div className="ws-empty">Belum ada permintaan website yang tersimpan.</div>}
  <div className="ws-project-list">{orders.map(o=><article key={o.id}>
   <small>{o.order_no} · {new Date(o.created_at).toLocaleDateString('id-ID')}</small>
   <h3>{o.company||'Website bisnis'} — {o.package_slug}</h3>
   <p>{websiteStatusLabel[o.status]||o.status}</p>
   <span>Status pembayaran: {o.payment_status==='not_invoiced'?'Belum ada invoice':o.payment_status}</span>
   <p>Domain yang diminta: {o.requested_domain||'Belum ditentukan'} (status: {o.domain_status==='manual_review'?'Perlu diperiksa':o.domain_status})</p>
   {o.id===consultOrderId&&o.payment_status!=='paid'&&<p className="ws-notice">Menunggu konfirmasi pembayaran DOKU. Setelah pembayaran benar-benar terverifikasi, WhatsApp konsultasi akan terbuka otomatis.</p>}
   {o.quoted_total!=null&&<strong>Nilai penawaran: {rupiah(Number(o.quoted_total))}</strong>}
   <div className="ws-client-payment">
     <small>PEMBAYARAN WEBSITE VIA DOKU</small>
     {o.payment_status==='paid'?<p className="ws-payment-paid"><Check size={16}/> Pembayaran DOKU terkonfirmasi. {o.id===consultOrderId?'Membuka WhatsApp konsultasi secara otomatis...':'Pengerjaan dapat dilanjutkan.'}</p>:
      o.payment_status==='refunded'?<p>Pembayaran dikembalikan. Hubungi admin bila perlu konfirmasi.</p>:
      o.payment?.status==='unknown'||o.payment?.status==='expired'?<p>Status invoice perlu diverifikasi admin sebelum pembayaran ulang.</p>:
      o.status==='awaiting_payment'&&Number(o.quoted_total)>0?<>
       <p>Nominal final: <strong>{rupiah(Number(o.quoted_total))}</strong>. Pilih metode pembayaran yang aktif langsung di halaman resmi DOKU Checkout.</p>
        <DokuPaymentChannels/>
       {safeDokuUrl(o.payment?.redirect_url,o.payment?.environment)?<a className="btn primary" href={safeDokuUrl(o.payment.redirect_url,o.payment.environment)} onClick={()=>rememberPaidConsultation(o.id)} rel="noopener noreferrer">Lanjutkan pembayaran DOKU <ArrowUpRight size={16}/></a>:
        o.payment?.status==='created'||o.payment?.status==='authorized'?<p>Invoice sedang diproses. Segarkan status atau hubungi admin.</p>:
        <button type="button" className="btn primary" disabled={payingId===o.id} onClick={()=>void payNow(o.id)}>{payingId===o.id?'Mempersiapkan pembayaran...':'Bayar dengan DOKU'} <ArrowUpRight size={16}/></button>}
      </>:<p>Menunggu admin menyetujui penawaran dan menetapkan invoice.</p>}
   </div>
   <div className="ws-timeline"><h4>Riwayat progres</h4><ol>{(o.events||[]).map((ev:any,i:number)=><li key={i}><small>{new Date(ev.created_at).toLocaleString('id-ID')}</small><strong>{websiteStatusLabel[ev.event_type]||ev.event_type}</strong>{ev.note&&<p>{ev.note}</p>}</li>)}</ol></div>
   {o.status==='client_review'&&<div className="ws-revision">
    {selected===o.id?<form onSubmit={requestRevision}><label htmlFor={'revision-'+o.id}>Tulis permintaan revisi</label><textarea id={'revision-'+o.id} minLength={10} maxLength={1200} rows={3} required value={note} onChange={e=>setNote(e.target.value)} placeholder="Bagian mana yang perlu diubah?"/><div className="ws-actions"><button type="submit" disabled={sending} className="btn primary">{sending?'Mengirim...':'Kirim revisi'}</button><button type="button" className="btn" onClick={()=>{setSelected('');setNote('')}}>Batal</button></div></form>:<button type="button" className="btn primary" onClick={()=>setSelected(o.id)}>Ajukan revisi</button>}
   </div>}
  </article>)}</div>
 </section>;
}
