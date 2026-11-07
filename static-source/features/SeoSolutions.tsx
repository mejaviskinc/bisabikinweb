import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {keywordPages,keywordPageByPath,keywordGroups,keywordBrief} from '../lib/seo-solutions.mjs';
import {storyById} from '../lib/seo-story-content.mjs';
import {seoPageDesign} from '../lib/seo-page-design.mjs';
export {keywordPageByPath};
const destinationLabels={'/':'Jasa pembuatan website','/harga/':'Harga & paket website','/jasa/landing-page/':'Landing page','/jasa/company-profile/':'Website company profile','/jasa/ecommerce/':'Website toko online','/jasa/portfolio/':'Website portofolio','/jasa/custom-website/':'Website custom & web app','/jasa/maintenance/':'Maintenance website','/industri/fashion/':'Website fashion & toko baju','/industri/skincare/':'Website brand skincare','/industri/travel/':'Website travel & wisata','/portfolio/gooninks/':'Studi kasus GoO Ninks','/portfolio/mejavi-skin/':'Studi kasus Mejavi Skin+','/portfolio/gojogja-travel/':'Studi kasus GoJogja Travel'};
function destinationLabel(target:string){return destinationLabels[target]||'Jasa website '+target.split('/').filter(Boolean).at(-1).split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ')}
const destinations=Array.from(new Set(keywordPages.map(page=>page.target))).map(target=>({target,label:destinationLabel(target),pages:keywordPages.filter(page=>page.target===target)}));
export function SeoSolutionsIndex(){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('semua');
 const search=query.toLocaleLowerCase('id-ID').trim();
 const filtered=destinations.filter(item=>item.pages.some(page=>(category==='semua'||page.cluster===category)&&(!search||(page.keyword+' '+item.label).toLocaleLowerCase('id-ID').includes(search))));
 return <section className="section seo-solutions">
  <nav className="seo-crumb"><a href="/">Beranda</a><span>/</span><a href="/jasa/">Jasa</a><span>/</span>Solusi website</nav>
  <header className="seo-directory-hero"><span className="eyebrow">BISABIKINWEB / WEBSITE SOLUTIONS</span><h1>Temukan website yang<br/><em>sesuai kebutuhanmu.</em></h1><p>Bandingkan layanan, pelajari contoh proyek, atau temukan cakupan layanan di daerahmu. Pilihan yang serupa kami kelompokkan agar kamu lebih mudah menentukan langkah berikutnya.</p></header>
  <div className="seo-search-panel"><label htmlFor="seo-keyword-search">Cari solusi website</label><input id="seo-keyword-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Contoh: toko online, Bandung, payment gateway…" type="search"/><div className="seo-filter-tabs">{[['semua','Semua'],...Object.entries(keywordGroups)].map(([key,value])=><button key={key} type="button" aria-pressed={category===key} className={category===key?'active':''} onClick={()=>setCategory(key)}>{value}</button>)}</div><p role="status">{filtered.length} pilihan layanan dan panduan</p></div>
  {filtered.length?<div className="seo-keyword-grid">{filtered.map(item=><a key={item.target} href={item.target} className="seo-keyword-tile"><span>{item.target.startsWith('/wilayah/')?'WILAYAH LAYANAN ONLINE':item.target.startsWith('/portfolio/')?'CONTOH PEKERJAAN':'LAYANAN & PERENCANAAN'}</span><h2>{item.label}</h2><p>{item.target==='/harga/'?'Bandingkan paket, ruang lingkup, dan komponen biaya.':item.target.startsWith('/portfolio/')?'Pelajari kebutuhan dan pendekatan proyek dalam portofolio kami.':item.target.startsWith('/wilayah/')?'Kebutuhan usaha, persiapan materi, dan konsultasi website secara online.':'Pahami pilihan website, materi yang diperlukan, dan langkah memulai.'}</p><div>Pelajari selengkapnya <ArrowUpRight size={16}/></div></a>)}</div>:<div className="seo-no-results"><h2>Belum ditemukan.</h2><p>Coba kata lain atau konsultasikan kebutuhanmu.</p><button type="button" className="btn" onClick={()=>{setQuery('');setCategory('semua')}}>Lihat semuanya</button><a className="btn" href="/kontak/">Konsultasi</a></div>}
  <aside className="seo-final-cta"><div><span className="eyebrow">PROJECT READY?</span><h2>Mulai dari tujuan bisnismu.</h2><p>Kami bantu membahas layanan, fitur, dan anggaran yang sesuai.</p></div><a className="btn primary" href="/kontak/">Konsultasi Website <ArrowUpRight size={16}/></a></aside>
 </section>;
}

// The geometric illustration is generated from each page's fixed numeric identity.
// It uses the site's inherited brand colors and no external images or font assets.
function SeoSignatureVisual({design,page}:{design:any,page:any}){
 const art=design.art;
 const nodes=[0,1,2,3].map(i=>({
   x:32+i*79+(page.id*(i+3)%19),
   y:28+((art.y+i*31)%106)
 }));
 return <div className="seo-identity-art" aria-hidden="true">
  <svg viewBox="0 0 360 172" fill="none" preserveAspectRatio="xMidYMid meet">
   <path d={'M'+nodes.map(node=>node.x+' '+node.y).join(' L')} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity=".77"/>
   <path d={'M0 '+art.axis+' H360 M0 '+(art.axis+52)+' H360'} stroke="currentColor" strokeWidth=".6" opacity=".18"/>
   <path d={'M'+(art.x+art.stretch)+' 0 V172'} stroke="currentColor" strokeWidth=".65" opacity=".16"/>
   {nodes.map((node,i)=><g key={i}><circle cx={node.x} cy={node.y} r={i===design.hero%4?art.radius:7+i*2} stroke="currentColor" strokeWidth="1.4" opacity={i===design.hero%4?1:.65}/><circle cx={node.x} cy={node.y} r="2.5" fill="currentColor"/></g>)}
   <rect x={art.x} y={art.y} width={art.stretch} height={9+design.cards*4} rx={design.story%3===0?0:7} fill="currentColor" opacity=".12"/>
  </svg>
  <span>VISUAL CODE <b>{design.signature}</b></span>
 </div>;
}

export function SeoSolutionPage({path}:{path:string}){
 const page=keywordPageByPath[path];if(!page)return null;
 const brief=keywordBrief(page);
 const story=storyById[page.id];
 const design=seoPageDesign(page);
 const similar=Array.from(new Map(keywordPages.filter(item=>item.cluster===page.cluster&&item.target!==page.target).map(item=>[item.target,item])).values()).slice(0,3);
 return <main className={'section seo-solutions seo-detail seo-story-theme-'+page.cluster+' seo-unique-page'} data-seo-id={String(page.id).padStart(3,'0')} data-hero={design.hero} data-story={design.story} data-cards={design.cards} data-design={design.signature}>
  <nav className="seo-crumb"><a href="/">Beranda</a><span>/</span><a href="/solusi/">Panduan Website</a><span>/</span>{keywordGroups[page.cluster]}</nav>
  <div className="seo-design-strap" aria-label={'Identitas halaman '+design.signature}><span>DESIGNED FOR THIS SEARCH</span><strong>{design.signature}</strong></div>
  <header className="seo-detail-hero"><div><span className="eyebrow">BISABIKINWEB / {keywordGroups[page.cluster].toUpperCase()}</span><h1>{page.keyword.charAt(0).toUpperCase()+page.keyword.slice(1)}.</h1><p>{brief.intro}</p><div className="seo-actions"><a className="btn primary" href={'/kontak?estimate='+encodeURIComponent('Saya ingin konsultasi '+page.keyword)}>Konsultasi Website <ArrowUpRight size={17}/></a><a className="btn" href={page.target}>Layanan Utama <ArrowUpRight size={16}/></a></div></div><aside className="seo-detail-overview"><SeoSignatureVisual design={design} page={page}/><span>PROJECT PLAN / {String(page.id).padStart(3,'0')}</span><strong>{brief.angle}</strong><p>{brief.focus}</p><small>Ruang lingkup dan hasil disepakati sebelum pengembangan. Halaman ini adalah contoh perencanaan, bukan bukti proyek yang telah diselesaikan.</small></aside></header>
  <section className="seo-detail-section seo-editorial-story" aria-labelledby="seo-story-title">
   <div className="seo-story-heading"><div><span className="eyebrow">01 / CERITA DI BALIK PENCARIAN</span><h2 id="seo-story-title">{story.title}</h2><p>Cerita di bawah adalah <strong>skenario ilustratif, bukan pengalaman klien atau testimoni nyata.</strong> Setiap ilustrasi membantu menjelaskan pilihan desain yang mungkin cocok untuk kebutuhan bisnis tersebut.</p></div><div className="seo-story-index"><span>EDITORIAL SERIES</span><b>{String(page.id).padStart(3,'0')} / 600</b><small>{keywordGroups[page.cluster]}</small></div></div>
   <div className="seo-story-content"><div className="seo-story-prose"><p>{story.scene}</p><p>{story.challenge}</p><p>{story.pivot}</p></div><aside className="seo-story-highlight"><span>✳ / CIRI KHAS HALAMAN INI</span><h3>Pilihan kecil yang membuatnya berbeda.</h3><p>{story.signature}</p></aside></div>
   <div className="seo-story-outcome"><div><span>MANFAAT YANG DITUJU</span><p>{story.result}</p></div><div><span>PERTANYAAN UNTUK BRIEF</span><p>{story.question}</p></div></div>
  </section>
  <section className="seo-detail-section seo-benefit-section"><div className="seo-section-header"><span className="eyebrow">02 / KEBUTUHAN</span><h2>Website yang menyelesaikan kebutuhan nyata.</h2><p>Prioritaskan isi dan pengalaman pengunjung sebelum menentukan teknologi atau animasi.</p></div><div className="seo-benefit-grid"><article><span>TUJUAN</span><h3>Jelas untuk calon pelanggan</h3><p>Jelaskan fungsi website bagi {brief.audience}, kemudian tentukan tindakan yang diharapkan.</p></article><article><span>FITUR</span><h3>Fondasi yang diperlukan</h3><p>Mulailah dari {brief.focus}. Tambahan sistem hanya digunakan bila dibutuhkan operasional.</p></article><article><span>KONTEN</span><h3>Informasi yang dapat dipercaya</h3><p>Siapkan materi produk atau jasa, kontak resmi, serta bukti pekerjaan yang memang boleh dipublikasikan.</p></article></div></section>
  <section className="seo-detail-section seo-checklist"><div><span className="eyebrow">03 / PERSIAPAN</span><h2>Checklist sebelum memesan website</h2><p>Empat langkah praktis membantu memperjelas brief proyek dan estimasi biaya.</p></div><ol>{brief.steps.map((step,i)=><li key={step}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></li>)}</ol></section>
  <section className="seo-detail-section seo-price-section"><div className="seo-section-header"><span className="eyebrow">04 / PAKET & FITUR</span><h2>Biaya transparan sejak awal.</h2><p>Harga website sederhana bisa dimulai dari Rp800 ribuan. Biaya final tergantung jumlah halaman, integrasi, konten, hosting, dan dukungan yang disepakati—bukan sekadar nama keyword.</p></div><div className="seo-actions"><a href="/harga/" className="btn">Lihat Paket Harga <ArrowUpRight size={16}/></a><a href="/portfolio/" className="btn">Portofolio <ArrowUpRight size={16}/></a><a href={page.target} className="btn">Halaman Jasa Terkait <ArrowUpRight size={16}/></a></div></section>
  <section className="seo-detail-section seo-faq-section"><div className="seo-section-header"><span className="eyebrow">05 / PERTANYAAN</span><h2>FAQ sebelum memulai proyek.</h2></div><div className="seo-faq">{brief.questions.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
  <section className="seo-detail-section"><div className="seo-section-header"><h2>Jelajahi panduan terkait</h2></div><div className="seo-related">{similar.map(item=><a key={item.id} href={item.target}>{destinationLabel(item.target)}<ArrowUpRight size={15}/></a>)}<a href="/solusi/">Semua solusi website <ArrowUpRight size={15}/></a></div></section>
  <aside className="seo-final-cta"><div><span className="eyebrow">LET'S BUILD IT</span><h2>Ceritakan rencana website kamu.</h2><p>Konsultasi online tersedia untuk menentukan desain, isi, biaya, dan cakupan pekerjaan.</p></div><a href={'/kontak?estimate='+encodeURIComponent('Saya ingin membuat website untuk '+page.keyword)} className="btn primary">Mulai Konsultasi <ArrowUpRight size={16}/></a></aside>
 </main>;
}
