import {ArrowUpRight,Check,Layers,MessageCircle,Globe,Target,Camera,Palette,Wrench,ShieldCheck} from 'lucide-react';
import {money} from '../lib/data';
import {event,whatsapp} from '../lib/client';
import './all-in-one.css';

const deliverables=[
 {Icon:Globe,title:'Website Company Profile + Toko Online',text:'Satu website responsif dengan profil bisnis, layanan, katalog sampai 20 produk, dan alur order standar yang disepakati.'},
 {Icon:Target,title:'SEO & Google Ads',text:'Optimasi SEO dasar dan penyiapan satu kampanye Google Ads. Anggaran iklan dibayar terpisah oleh klien.'},
 {Icon:Camera,title:'Social Media Management',text:'Pengelolaan satu akun Instagram selama 30 hari, termasuk rencana konten, 8 feed, 4 Story, dan caption.'},
 {Icon:Palette,title:'Branding & Desain Grafis',text:'Arahan visual brand, satu konsep logo atau penyegaran identitas, serta maksimal 5 aset promosi digital.'},
 {Icon:Wrench,title:'Maintenance Website',text:'Perbaikan bug, pemeriksaan dasar dan dukungan website selama 30 hari setelah serah terima.'},
 {Icon:ShieldCheck,title:'Strategi & Pelaporan',text:'Kickoff, daftar prioritas, review pekerjaan, dan ringkasan hasil awal untuk langkah berikutnya.'}
];

export default function AllInOne({settings,service}:{settings:any,service:any}){
 const price=Number(service?.price||25000000);
 const message='Halo BisaBikinWeb, saya tertarik dengan Layanan All in One budget mulai Rp25.000.000. Bisa kirim rincian scope, jadwal, dan proposal?';
 const waLink=settings?.whatsapp?whatsapp(settings.whatsapp,message):'/kontak/?estimate='+encodeURIComponent('Layanan All in One Rp25.000.000');
 return <main className="aio-page" id="aio-main">
  <section className="section aio-hero" aria-labelledby="aio-title">
   <nav className="aio-breadcrumb" aria-label="Breadcrumb"><a href="/">Beranda</a><span>/</span><a href="/jasa/">Layanan</a><span>/</span><span>All in One</span></nav>
   <div className="aio-hero-grid">
    <div className="aio-hero-copy">
     <div className="aio-kicker"><Layers size={17}/> PAKET DIGITAL TERINTEGRASI</div>
     <h1 id="aio-title">Satu paket untuk <em>website, branding, dan promosi.</em></h1>
     <p>Bangun identitas digital yang saling terhubung: website untuk menerima pelanggan, konten yang konsisten, dan kampanye promosi dengan tujuan bisnis yang jelas.</p>
     <div className="aio-price"><span>Budget paket mulai</span><strong>{money(price)}</strong><small>Proyek sesuai ruang lingkup tertulis, bukan biaya iklan.</small></div>
     <div className="aio-hero-actions">
      <a className="btn primary" href={waLink} onClick={()=>event('all_in_one_whatsapp_click')}>{settings?.whatsapp?'Konsultasi Paket via WhatsApp':'Minta Proposal'} <ArrowUpRight size={18}/></a>
      <a className="btn" href="/portfolio/">Lihat Portofolio <ArrowUpRight size={17}/></a>
     </div>
     <ul className="aio-trust"><li><Check size={15}/>Satu koordinasi proyek</li><li><Check size={15}/>Ruang lingkup tertulis</li><li><Check size={15}/>Biaya pihak ketiga transparan</li></ul>
    </div>
    <div className="aio-overview" aria-label="Rangkaian layanan All in One">
     <div className="aio-overview-head"><span>ALL IN ONE / 2026</span><Layers size={28}/></div>
     <h2>Ide bisnis.<br/><em>Eksekusi terarah.</em></h2>
     <div className="aio-overview-grid">
      <span>01 / WEBSITE</span><span>02 / SEO & ADS</span>
      <span>03 / INSTAGRAM</span><span>04 / BRANDING</span>
      <span>05 / MAINTENANCE</span><span>06 / REPORTING</span>
     </div>
     <p>Website + marketing + desain dalam satu rencana pengerjaan.</p>
    </div>
   </div>
  </section>

  <section className="section aio-deliverables" aria-labelledby="aio-includes-title">
   <div className="aio-heading"><span className="eyebrow">YANG DIDAPAT</span><h2 id="aio-includes-title">Enam layanan untuk satu tujuan bisnis.</h2><p>Paket awal berikut menjadi acuan budget Rp25 juta. Detail fitur, revisi, periode layanan, dan jadwal pengerjaan dipastikan lewat proposal sebelum pembayaran.</p></div>
   <div className="aio-deliverables-grid">{deliverables.map(({Icon,title,text},i)=><article className="aio-deliverable" key={title}><div className="aio-deliverable-icon"><Icon size={22}/></div><span className="aio-sequence">{String(i+1).padStart(2,'0')} / 06</span><h3>{title}</h3><p>{text}</p></article>)}</div>
  </section>

  <section className="section aio-process" aria-labelledby="aio-process-title">
   <div><span className="eyebrow">PROSES KERJA</span><h2 id="aio-process-title">Jelas sejak awal, bukan janji tanpa batas.</h2><p>Kita mulai dari kebutuhan bisnis, lalu pilih prioritas agar budget dipakai untuk hal yang benar-benar berdampak.</p></div>
   <ol><li><strong>01. Konsultasi & brief</strong><span>Ceritakan target, bisnis, materi yang tersedia, serta kebutuhan situs dan promosi.</span></li><li><strong>02. Proposal & ruang lingkup</strong><span>Terima rincian hasil kerja, jumlah revisi, biaya tambahan, dan tahapan pembayaran.</span></li><li><strong>03. Produksi & review</strong><span>Website, materi brand dan aset pemasaran dikerjakan sesuai jadwal yang disepakati.</span></li><li><strong>04. Peluncuran & serah terima</strong><span>Review hasil, panduan penggunaan, laporan awal, dan dukungan sesuai paket.</span></li></ol>
  </section>

  <section className="section aio-terms" aria-labelledby="aio-terms-title"><div><span className="eyebrow">TRANSPARANSI BUDGET</span><h2 id="aio-terms-title">Apa yang belum termasuk?</h2></div><p>Anggaran tayang Google Ads/Meta Ads, domain, hosting, lisensi berbayar, produksi foto/video khusus, integrasi kompleks, dan pengelolaan di luar 30 hari awal tidak otomatis termasuk dalam Rp25 juta. Website company profile dan toko online merupakan satu proyek terintegrasi, bukan dua website terpisah. Semua biaya tambahan hanya dikerjakan setelah disetujui.</p></section>

  <section className="section aio-cta" aria-labelledby="aio-cta-title"><div><span className="eyebrow">SIAP MULAI?</span><h2 id="aio-cta-title">Cerita dulu. Biar paketnya tepat sasaran.</h2><p>Konsultasi awal gratis. Kami bantu menyusun proposal berdasarkan bisnis dan prioritasmu.</p></div><a className="btn primary" href={waLink} onClick={()=>event('all_in_one_whatsapp_click')}>{settings?.whatsapp?'Diskusikan Budget Rp25 Juta':'Minta Penawaran'} <MessageCircle size={17}/></a></section>
 </main>;
}
