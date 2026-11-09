import React from 'react';
import {ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, GraduationCap, Globe2, MapPin, Search, ShoppingBag} from 'lucide-react';
import {brandPositioning} from '../lib/demo-industries.mjs';
import {galleryPhotoFor} from '../lib/demo-creative.mjs';
import './industry-site-preview.css';

type Demo={
 slug:string; title:string; category:string; description:string; headline:string;
 tagline:string; highlights:string[]; image:string; layout:number;
 offerings:{name:string;price:number}[];
};
type Creative={headline?:string;story?:string}|undefined;

const typeNames:Record<string,string>={
 umkm:'UMKM & LOKAL', 'company-profile':'COMPANY PROFILE',
 'toko-online':'E-COMMERCE', ekspor:'EKSPOR / B2B',
 travel:'TRAVEL & TOUR', restoran:'RESTORAN & KAFE',
 fashion:'FASHION BRAND', pendidikan:'PENDIDIKAN'
};
const idr=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
function Photo({src,alt='',className=''}:{src:string;alt?:string;className?:string}){
 return <img className={className} src={src} alt={alt} loading="lazy" decoding="async"/>;
}
function PreviewButton({children}:{children:React.ReactNode}){
 return <span className="ws-ip-button">{children}<ArrowUpRight size={22}/></span>;
}

/**
 * Industry-specific, intentionally non-clickable catalog window.
 * The enclosing card links to the real multipage demo, not to a fake checkout.
 * Uses the same demo data and sector navigation as WebsiteLiveDemo.
 */
export default function IndustrySitePreview({demo:d,creative}:{demo:Demo;creative?:Creative}){
 const profile=brandPositioning(d);
 const headline=creative?.headline||d.headline;
 const photo=d.image;
 const items=d.offerings.slice(0,3);
 return <div className={'ws-ip ws-ip-'+d.category+' ws-ip-layout-'+d.layout} data-industry-preview={d.category} aria-label={'Preview '+typeNames[d.category]+' '+d.title}>
   <div className="ws-ip-topline"><span>{typeNames[d.category]||'WEBSITE'} / WEBSITE DEMO</span><span>{d.tagline}</span></div>
   <header className="ws-ip-header"><strong>{d.title}<sup>®</sup></strong><nav aria-label={'Navigasi contoh '+d.title}>{profile.nav.slice(0,4).map(n=><span key={n}>{n}</span>)}</nav><div className="ws-ip-header-end">{d.category==='toko-online'||d.category==='fashion'?<><Search size={20}/><ShoppingBag size={21}/></>:<span>{d.category==='ekspor'?'Request RFQ':d.category==='company-profile'?'Ajukan Proyek':'Hubungi Kami'} ↗</span>}</div></header>
   {d.category==='company-profile'&&<main className="ws-ip-corporate">
     <div className="ws-ip-corp-copy"><span className="ws-ip-kicker"><Building2 size={22}/> STRATEGIC / CORPORATE</span><h3>{headline}</h3><p>{d.description}</p><PreviewButton>Konsultasi proyek</PreviewButton></div>
     <div className="ws-ip-corp-image"><Photo src={photo}/><span>COMPANY / SERVICES / PORTFOLIO</span></div>
     <div className="ws-ip-corp-services">{items.map((item,i)=><div key={item.name}><small>0{i+1} / SOLUSI</small><strong>{item.name}</strong><ArrowUpRight size={19}/></div>)}</div>
   </main>}
   {d.category==='toko-online'&&<main className="ws-ip-commerce">
     <div className="ws-ip-shop-categories"><span>NEW ARRIVALS</span><span>BEST SELLERS</span><span>ALL PRODUCTS</span><span>COLLECTIONS</span></div>
     <div className="ws-ip-shop-hero"><div><small>THE NEW COLLECTION / SHOP ONLINE</small><h3>{headline}</h3><PreviewButton>Belanja koleksi</PreviewButton></div><Photo src={photo}/></div>
     <div className="ws-ip-product-heading"><strong>Produk pilihan</strong><span>LIHAT SEMUA ↗</span></div>
     <div className="ws-ip-products">{items.map((p,i)=><div key={p.name}><Photo src={galleryPhotoFor(d,i)}/><span>{p.name}</span><b>{idr(p.price)}</b></div>)}</div>
   </main>}
   {d.category==='ekspor'&&<main className="ws-ip-export">
     <div className="ws-ip-export-hero"><div><span className="ws-ip-kicker"><Globe2 size={23}/> INTERNATIONAL SUPPLIER</span><h3>{headline}</h3><p>{d.description}</p><PreviewButton>Request quotation</PreviewButton></div><Photo src={photo}/></div>
     <div className="ws-ip-export-table"><strong>PRODUCT / SPECIFICATION</strong><strong>INQUIRY</strong>{items.map((p,i)=><React.Fragment key={p.name}><span>0{i+1} — {p.name}</span><span>RFQ ↗</span></React.Fragment>)}</div>
   </main>}
   {d.category==='travel'&&<main className="ws-ip-travel"><Photo src={photo}/><div className="ws-ip-travel-overlay"><small><MapPin size={21}/> EXPLORE EXPERIENCES</small><h3>{headline}</h3><p>{d.tagline}</p><div className="ws-ip-travel-search"><span>Destinasi</span><span>Tanggal perjalanan</span><b>Cari Trip ↗</b></div></div><div className="ws-ip-travel-trips">{items.map(x=><span key={x.name}>{x.name}</span>)}</div></main>}
   {d.category==='restoran'&&<main className="ws-ip-restaurant"><div className="ws-ip-restaurant-copy"><small>GOOD FOOD / GOOD TIMES</small><h3>{headline}</h3><p>{d.tagline}</p><PreviewButton>Lihat menu</PreviewButton><div className="ws-ip-food-menu">{items.map(p=><div key={p.name}><span>{p.name}</span><b>{idr(p.price)}</b></div>)}</div></div><Photo src={photo}/></main>}
   {d.category==='fashion'&&<main className="ws-ip-fashion"><div className="ws-ip-fashion-copy"><small>EDITORIAL / COLLECTION {String(d.layout+1).padStart(2,'0')}</small><h3>{headline}</h3><PreviewButton>Explore lookbook</PreviewButton></div><Photo src={photo}/><div className="ws-ip-fashion-bottom"><span>NEW COLLECTION — {d.tagline}</span><span>VIEW ALL ↗</span></div></main>}
   {d.category==='pendidikan'&&<main className="ws-ip-education"><div className="ws-ip-education-hero"><div><span className="ws-ip-kicker"><GraduationCap size={24}/> LEARN / GROW / CREATE</span><h3>{headline}</h3><PreviewButton>Lihat program</PreviewButton></div><Photo src={photo}/></div><div className="ws-ip-education-programs"><strong>Program unggulan</strong>{items.map((p,i)=><span key={p.name}><b>0{i+1}</b>{p.name}<ArrowUpRight size={18}/></span>)}</div></main>}
   {d.category==='umkm'&&<main className="ws-ip-local"><div className="ws-ip-local-hero"><Photo src={photo}/><div><small><MapPin size={19}/> BRAND & USAHA LOKAL</small><h3>{headline}</h3><p>{d.description}</p><PreviewButton>Lihat pilihan</PreviewButton></div></div><div className="ws-ip-local-offers">{items.map((p,i)=><span key={p.name}>0{i+1} / {p.name}</span>)}</div></main>}
 </div>;
}

export function DemoIndustrySignature({demo:d}:{demo:Demo}){
 const labels:Record<string,[string,string,string]>={
 'company-profile':['PROFIL PERUSAHAAN','SOLUSI & PROYEK','KONSULTASI B2B'],
 'toko-online':['KATEGORI PRODUK','PRODUK & HARGA','KERANJANG DEMO'],
 ekspor:['PRODUCT CATALOG','SPECIFICATIONS','REQUEST RFQ'],
 travel:['PAKET PERJALANAN','ITINERARY','REQUEST BOOKING'],
 restoran:['MENU & HARGA','RESERVASI','LOKASI KAFE'],
 fashion:['NEW COLLECTION','LOOKBOOK','SIZE GUIDE'],
 pendidikan:['PROGRAM BELAJAR','JADWAL KELAS','PENDAFTARAN'],
 umkm:['PROFIL USAHA','PRODUK / LAYANAN','HUBUNGI KAMI']
 };
 const words=labels[d.category]||labels.umkm;
 return <div className={'wd-industry-signature wd-signature-'+d.category} aria-label={'Struktur website '+typeNames[d.category]}>{words.map((w,i)=><span key={w}><b>0{i+1}</b>{w}</span>)}</div>;
}
