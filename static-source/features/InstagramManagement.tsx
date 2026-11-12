import React from 'react';
import {ArrowUpRight,Check,Instagram,CalendarDays,PenTool,BarChart3,Megaphone,MessageCircle,ShieldCheck} from 'lucide-react';
import {money} from '../lib/data';
import {whatsapp,event} from '../lib/client';

type Package = {id:string;name:string;price:number;lead:string;features:string[];featured?:boolean};
const packages:Package[]=[
  {id:'starter',name:'Starter',price:1290000,lead:'Untuk UMKM yang ingin akun Instagram tampil rapi dan rutin.',features:['8 desain feed per bulan','4 Story sederhana/adaptasi feed','Caption dan penjadwalan posting','Optimasi bio awal','Laporan insight bulanan','1 putaran revisi minor per konten']},
  {id:'growth',name:'Growth',price:2490000,lead:'Konten lebih variatif untuk brand yang ingin terus berkembang.',featured:true,features:['12 desain feed per bulan','8 Story sederhana/adaptasi feed','2 Reels editing sederhana dari materi klien','Kalender konten dan caption','Penjadwalan dan insight bulanan','1 putaran revisi minor per konten']},
  {id:'premium',name:'Premium',price:3990000,lead:'Untuk brand yang butuh produksi konten dan pendampingan lebih intensif.',features:['16 desain feed per bulan','12 Story sederhana/adaptasi feed','4 Reels editing sederhana dari materi klien','Strategi dan kalender konten bulanan','Balas komentar dan DM ringan pada hari kerja','Laporan performa dan rekomendasi','1 putaran revisi minor per konten']}
];
const steps=[
  {title:'Brief & audit akun',copy:'Kami pelajari produk, identitas visual, audiens, dan tujuan komunikasi brand.'},
  {title:'Kalender konten',copy:'Topik, referensi, dan jadwal disusun untuk persetujuan sebelum produksi.'},
  {title:'Desain & revisi',copy:'Desain, caption, dan video sederhana disiapkan berdasarkan materi yang disediakan.'},
  {title:'Publikasi & evaluasi',copy:'Konten dijadwalkan, lalu performanya dirangkum setiap bulan.'}
];

export default function InstagramManagement({whatsappNumber}:{whatsappNumber:string}){
 const request=(name:string)=>whatsapp(whatsappNumber,'Halo BisaBikinWeb, saya ingin konsultasi layanan Kelola Instagram paket '+name+'. Mohon informasi alur mulai dan penawarannya.');
 return <div className="ig-service" data-dynamic-translate="public">
  <section className="ig-hero section" aria-labelledby="ig-hero-title">
   <div className="ig-hero-copy">
    <nav className="ig-breadcrumb" aria-label="Breadcrumb"><a href="/">Beranda</a><span>/</span><a href="/jasa/">Layanan</a><span>/</span><span>Kelola Instagram</span></nav>
    <span className="eyebrow"><Instagram size={15}/> SOCIAL MEDIA MANAGEMENT · BISABIKINWEB</span>
    <h1 id="ig-hero-title">Instagram aktif.<br/><em>Brand makin terlihat.</em></h1>
    <p>Biar tim kamu fokus mengurus bisnis, kami bantu menyiapkan desain feed, Story, Reels sederhana, caption, hingga jadwal publikasi. Konten yang konsisten, rapi, dan sesuai identitas brand.</p>
    <div className="ig-hero-actions"><a href="#paket-instagram" className="btn primary">Lihat paket & harga <ArrowUpRight size={17}/></a><a href={request('konsultasi')} className="btn" target="_blank" rel="noopener noreferrer" onClick={()=>event('consultation_click')}>Konsultasi via WhatsApp <MessageCircle size={16}/></a></div>
    <p className="ig-hero-note">Layanan untuk 1 akun Instagram · Kontrak & ruang lingkup disepakati sebelum pengerjaan</p>
   </div>
   <div className="ig-preview" aria-hidden="true">
    <div className="ig-preview-top"><span>CONTENT STUDIO</span><span>● ● ●</span></div>
    <div className="ig-preview-profile"><div className="ig-preview-avatar"><Instagram size={30}/></div><div><strong>Your Brand</strong><small>Good stories deserve a great feed.</small></div></div>
    <div className="ig-preview-grid"><div className="ig-tile ig-tile-one"><small>01 / BRAND</small><strong>MAKE IT<br/>MATTER.</strong><span>↗</span></div><div className="ig-tile ig-tile-two"><small>02 / CREATIVE</small><strong>BUILD<br/>TRUST.</strong><span>✳</span></div><div className="ig-tile ig-tile-three"><small>03 / CONTENT</small><strong>STAY<br/>VISIBLE.</strong><span>◉</span></div></div>
    <div className="ig-preview-bottom"><span>DESIGN</span><span>CAPTION</span><span>POSTING</span><span>REPORT</span></div>
   </div>
  </section>
  <section className="ig-values section" aria-labelledby="ig-values-title">
   <div className="section-heading"><div><span className="eyebrow">BUKAN SEKADAR POSTING</span><h2 id="ig-values-title">Konten terencana.<br/><em>Tampilan lebih profesional.</em></h2><p>Fokus kami adalah kualitas visual dan konsistensi komunikasi, bukan janji followers atau omzet instan.</p></div></div>
   <div className="ig-value-grid"><article><PenTool size={23}/><h3>Desain sesuai brand</h3><p>Feed dan Story disusun mengikuti warna, karakter, dan pesan bisnis kamu.</p></article><article><CalendarDays size={23}/><h3>Jadwal konsisten</h3><p>Kalender membantu konten tayang rutin tanpa mengganggu operasional.</p></article><article><BarChart3 size={23}/><h3>Laporan yang jelas</h3><p>Ringkasan performa untuk menentukan langkah konten berikutnya.</p></article></div>
  </section>
  <section className="ig-pricing section" id="paket-instagram" aria-labelledby="ig-pricing-title">
   <div className="section-heading"><div><span className="eyebrow">PAKET LAYANAN · BULANAN</span><h2 id="ig-pricing-title">Pilih ritme yang<br/><em>cocok untuk brand.</em></h2><p>Harga transparan untuk pengelolaan satu akun Instagram. Semua paket termasuk caption dan penjadwalan sesuai jumlah konten.</p></div></div>
   <div className="ig-plan-grid">{packages.map(plan=><article key={plan.id} className={'ig-plan '+(plan.featured?'ig-plan-featured':'')}>
    {plan.featured&&<span className="ig-plan-badge">PALING DIREKOMENDASIKAN</span>}
    <span className="ig-plan-label">{plan.name.toUpperCase()}</span><h3>{money(plan.price)}</h3><span className="ig-plan-unit">per bulan / 1 akun Instagram</span><p>{plan.lead}</p>
    <ul>{plan.features.map(feature=><li key={feature}><Check size={16}/><span>{feature}</span></li>)}</ul>
    <a className={'btn '+(plan.featured?'primary':'')} href={request(plan.name)} target="_blank" rel="noopener noreferrer" onClick={()=>event('pricing_click')}>Pilih paket {plan.name} <ArrowUpRight size={17}/></a>
   </article>)}</div>
   <p className="ig-fineprint">Materi foto/video mentah disediakan klien. Story sederhana dapat berupa adaptasi feed; Reels berupa editing dasar, bukan produksi video di lokasi. Satu revisi minor per konten. Shooting, desain/animasi kompleks, pengelolaan customer service penuh, dan budget iklan tidak termasuk.</p>
  </section>
  <section className="ig-ads section" aria-labelledby="ig-ads-title">
   <div className="ig-ads-copy"><span className="eyebrow"><Megaphone size={15}/> OPSIONAL / META ADS</span><h2 id="ig-ads-title">Perlu menjangkau<br/><em>lebih banyak orang?</em></h2><p>Tambahkan pengelolaan iklan Instagram dan Facebook lewat Meta Ads. Cocok untuk kampanye yang punya target, materi, dan anggaran iklan jelas. Kesiapan akun dan tracking diperiksa sebelum kampanye.</p><a href={request('Meta Ads Starter')} target="_blank" rel="noopener noreferrer" className="text-link">Diskusikan kebutuhan iklan <ArrowUpRight size={17}/></a></div>
   <div className="ig-ads-card"><span className="eyebrow">META ADS MANAGEMENT</span><h3>Mulai {money(1000000)}<small> / bulan</small></h3><p>Fee jasa pengelolaan, bukan biaya tayang iklan.</p><ul><li><Check size={16}/> 1 kampanye aktif</li><li><Check size={16}/> Riset audiens dan setup awal</li><li><Check size={16}/> 2 variasi materi iklan sederhana</li><li><Check size={16}/> Monitoring mingguan & laporan</li></ul><div className="ig-ads-warning"><ShieldCheck size={16}/><span>Budget iklan dibayar terpisah langsung ke Meta. Hasil penjualan, leads, dan jangkauan tidak dijamin.</span></div></div>
  </section>
  <section className="ig-process section" aria-labelledby="ig-process-title"><div className="section-heading"><div><span className="eyebrow">CARA KERJA</span><h2 id="ig-process-title">Rapi dari brief<br/><em>sampai laporan.</em></h2></div></div><div className="ig-steps">{steps.map((step,i)=><article key={step.title}><span>{String(i+1).padStart(2,'0')}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>
  <section className="ig-faq section" aria-labelledby="ig-faq-title"><div><span className="eyebrow">PERTANYAAN UMUM</span><h2 id="ig-faq-title">Sebelum kita mulai.</h2></div><div className="ig-faq-list">
   <details><summary>Apakah harga sudah termasuk budget Meta Ads?</summary><p>Belum. Paket Starter, Growth, dan Premium berfokus pada konten organik. Meta Ads merupakan layanan tambahan dengan fee pengelolaan dan budget iklan terpisah.</p></details>
   <details><summary>Apakah konten harus disediakan oleh klien?</summary><p>Klien menyediakan materi foto/video mentah, informasi produk, identitas brand, serta persetujuan penggunaan materi. Tim mengolahnya menjadi desain dan konten sesuai paket.</p></details>
   <details><summary>Apakah bisa menjamin followers, views, atau penjualan?</summary><p>Tidak. Kami berkomitmen pada layanan dan deliverable yang disepakati, tetapi performa dipengaruhi banyak faktor di luar kendali pengelola.</p></details>
   <details><summary>Bagaimana akses dan keamanan akun?</summary><p>Pengelolaan dilakukan melalui akses yang disepakati. Utamakan pemberian akses peran melalui Meta Business Suite, tanpa membagikan kata sandi atau kode OTP pribadi.</p></details>
   <details><summary>Berapa lama kerja sama dan bagaimana revisinya?</summary><p>Periode awal dan pembayaran disepakati dalam penawaran. Setiap konten mendapat satu putaran revisi minor; perubahan konsep besar atau permintaan di luar kuota dihitung terpisah.</p></details>
  </div></section>
  <section className="ig-final section"><span className="eyebrow">LET'S BUILD YOUR PRESENCE</span><h2>Brand kamu layak punya<br/><em>Instagram yang terurus.</em></h2><p>Mulai dari brief dan pilih paket sesuai kebutuhan. Kami bantu susun rencana konten yang realistis.</p><a className="btn primary" href={request('konsultasi')} target="_blank" rel="noopener noreferrer" onClick={()=>event('consultation_click')}>Konsultasi layanan Instagram <ArrowUpRight size={18}/></a></section>
 </div>;
}
