import {ArrowUpRight,ArrowRight,PackageCheck,Layers3,ShieldCheck,Boxes,Headphones,Paintbrush,Truck,Settings2,Check,MessageCircle,ClipboardList} from 'lucide-react';
import {PortfolioVisual} from '../components/Visuals';
import './ecommerce-showcase.css';

const MEJAVI_SITE='https://mejaviskincare.co.id/';
const mejaviProject={id:'mejavi-skin',name:'Mejavi Skin+',domain:'mejaviskincare.co.id',live:MEJAVI_SITE};
const capabilities=[
 {icon:Layers3,title:'Katalog yang mudah dijelajahi',copy:'Kategori, pencarian, foto produk, varian ukuran atau warna, dan detail yang membantu pembeli memilih.'},
 {icon:PackageCheck,title:'Keranjang & checkout',copy:'Dari memilih produk sampai membuat pesanan dengan alur yang jelas dan responsif di perangkat seluler.'},
 {icon:Boxes,title:'Dashboard toko & stok',copy:'Kelola katalog, status pesanan, inventori, promo, serta akses admin sesuai kebutuhan operasional.'},
 {icon:ShieldCheck,title:'Pembayaran terverifikasi',copy:'Integrasi gateway dan status pembayaran dari sistem penyedia, bukan sekadar mengandalkan tampilan berhasil.'},
 {icon:Truck,title:'Pengiriman & notifikasi',copy:'Rencana metode ongkir, alamat pelanggan, status pengiriman, serta pemberitahuan sesuai integrasi yang disepakati.'},
 {icon:Headphones,title:'Pertumbuhan setelah rilis',copy:'Pengembangan SEO produk, analytics, pembaruan konten, dan opsi maintenance bulanan.'}
];
const models=[
 {no:'01',name:'Katalog + WhatsApp',tag:'MEMULAI JUALAN',description:'Untuk bisnis yang ingin menampilkan produk dengan rapi dan menerima pemesanan lewat admin.',features:['Halaman toko & kategori produk','Detail produk dan variasi','Tombol pemesanan WhatsApp','Pengelolaan konten yang disepakati']},
 {no:'02',name:'Online Store + Checkout',tag:'TRANSAKSI TERSTRUKTUR',description:'Untuk brand yang membutuhkan keranjang, pesanan, pelanggan dan alur pembayaran online.',features:['Keranjang & alur checkout','Dashboard pesanan & stok','Integrasi pembayaran sesuai kesiapan akun','Notifikasi dan opsi pengiriman']},
 {no:'03',name:'Commerce Kustom',tag:'SKALA OPERASIONAL',description:'Untuk alur yang lebih kompleks, termasuk preorder, multi-role atau integrasi sistem internal.',features:['Analisis proses bisnis','Dashboard & role khusus','Integrasi API berdasarkan kelayakan','Pengembangan bertahap & dukungan']}
];
const questions=[
 ['Apakah website toko online bisa memiliki domain sendiri?','Bisa. Domain, hosting, dan biaya perpanjangan dicantumkan terpisah atau dalam paket sesuai penawaran yang disetujui.'],
 ['Apakah pembayaran otomatis langsung tersedia?','Integrasi pembayaran dapat direncanakan, tetapi aktivasi memerlukan akun payment gateway yang disetujui penyedia, akses teknis, dan pengujian status transaksi.'],
 ['Apakah stok produk bisa diatur dari dashboard?','Bisa untuk cakupan toko online dengan dashboard. Varian, pengurangan stok, diskon, dan hak akses perlu didefinisikan pada tahap analisis.'],
 ['Apakah toko online bisa dibuat sesuai identitas brand?','Bisa. Warna, tipografi, visual produk, struktur kategori, dan pengalaman belanja dirancang menyesuaikan industri serta identitas bisnis.'],
 ['Bagaimana kalau sudah punya website atau marketplace?','Kami bisa mengevaluasi website saat ini terlebih dahulu. Integrasi dengan marketplace atau sistem eksternal bergantung pada akses resmi, API, dan ruang lingkup yang disepakati.'],
 ['Setelah website online, apakah ada maintenance?','Ada opsi pemeliharaan bulanan yang dapat mencakup pembaruan teknis, pemantauan, backup, perbaikan ringan dan dukungan, sesuai SLA dalam kontrak.']
];

export default function EcommerceShowcase(){
 return <div className="ec-showcase">
  <section className="section ec-intro" aria-labelledby="ec-intro-heading">
   <div className="ec-intro-copy">
    <span className="eyebrow">BUKAN SEKADAR WEBSITE KATALOG</span>
    <h2 id="ec-intro-heading">Bangun toko online yang <em>terlihat meyakinkan.</em> Siap untuk transaksi nyata.</h2>
    <p>Orang datang untuk melihat produk. Pengalaman belanja yang baik membantu mereka menemukan ukuran, memahami harga, menyimpan pilihan, lalu menyelesaikan pesanan. Desain, data, dan alur operasional harus bekerja bersama.</p>
    <div className="ec-intro-points"><span><Check size={15}/> Sesuai identitas brand</span><span><Check size={15}/> Responsif di ponsel</span><span><Check size={15}/> Bertahap sesuai kebutuhan</span></div>
    <div className="ec-cta-row"><a href="/beli-website/" className="btn primary">Rancang toko saya <ArrowUpRight size={17}/></a><a href="/portfolio/" className="btn">Lihat portofolio <ArrowRight size={17}/></a></div>
   </div>
   <div className="ec-preview-shell ec-mejavi-shell">
    <div className="ec-preview-head"><div><span className="ec-live-dot"/> MEJAVI SKIN+ / SCREENSHOT WEBSITE ASLI</div><span className="ec-screenshot-state">CAPTURED HOMEPAGE</span></div>
    <a className="ec-mejavi-shot-link" href={MEJAVI_SITE} target="_blank" rel="noopener noreferrer" aria-label="Buka website resmi Mejavi Skin+">
     <PortfolioVisual project={mejaviProject}/>
    </a>
    <div className="ec-preview-note"><span><span className="ec-live-dot"/> PREVIEW SAMA SEPERTI DI PORTOFOLIO</span><a href={MEJAVI_SITE} target="_blank" rel="noopener noreferrer">Buka website asli <ArrowUpRight size={14}/></a></div>
    <p className="ec-mejavi-frame-help">Tangkapan layar berasal dari homepage website resmi Mejavi Skin+ dan bukan desain ulang. Klik pratinjau untuk menjelajahi website secara langsung di tab baru.</p>
   </div>
  </section>

  <section className="section ec-capabilities" aria-labelledby="ec-capabilities-heading">
   <div className="ec-section-heading"><div><span className="eyebrow">ALL THE RIGHT PIECES</span><h2 id="ec-capabilities-heading">Satu pengalaman belanja.<br/><em>Semua bagian terhubung.</em></h2></div><p>Kebutuhan tiap toko berbeda. Pilih fitur yang benar-benar membantu pengunjung, tim admin, dan proses transaksi.</p></div>
   <div className="ec-feature-grid">{capabilities.map(({icon:Icon,title,copy},i)=><article key={title} className="ec-feature-card"><div className="ec-feature-head"><span>0{i+1}</span><Icon size={23}/></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
  </section>

  <section className="section ec-industry" aria-labelledby="ec-industries-heading">
   <div className="ec-industry-intro"><span className="eyebrow">DESIGNED AROUND YOUR BUSINESS</span><h2 id="ec-industries-heading">Beda industri.<br/><em>Beda cara berjualan.</em></h2><p>Toko fashion memerlukan ukuran dan preorder. Skincare memerlukan detail produk. Makanan dan produk digital mempunyai alur pembelian berbeda. Struktur website harus mengikuti kebutuhan bisnis, bukan template yang dipaksakan.</p><a className="text-link" href="/industri/">Jelajahi solusi industri <ArrowUpRight size={18}/></a></div>
   <div className="ec-industry-cards">
    <a href="/industri/fashion/" className="ec-industry-card"><img src="/editorial-covers/katalog-fashion-online-foto-ukuran-varian.webp" loading="lazy" alt="Ilustrasi katalog fashion dan variasi produk"/><span>01 / FASHION & LIFESTYLE</span><h3>Ukuran, warna, koleksi & preorder <ArrowUpRight size={19}/></h3></a>
    <a href="/industri/skincare/" className="ec-industry-card"><img src="/editorial-covers/website-skincare-komposisi-legalitas-klaim-produk.webp" loading="lazy" alt="Ilustrasi website produk skincare"/><span>02 / BEAUTY & SKINCARE</span><h3>Detail manfaat, komposisi & varian <ArrowUpRight size={19}/></h3></a>
   </div>
  </section>

  <section className="section ec-solutions" aria-labelledby="ec-solutions-heading">
   <div className="ec-section-heading"><div><span className="eyebrow">PILIH MODEL PENJUALAN</span><h2 id="ec-solutions-heading">Mulai dari yang dibutuhkan.<br/><em>Siapkan ruang untuk berkembang.</em></h2></div><p>Ini contoh ruang lingkup, bukan paket harga tetap. Fitur dan biaya akhir ditetapkan setelah brief dan proposal.</p></div>
   <div className="ec-model-grid">{models.map((m,i)=><article key={m.no} className={'ec-model-card '+(i===1?'ec-model-featured':'')}><div className="ec-model-top"><span>{m.no} / {m.tag}</span>{i===1&&<b>POPULAR SCOPE</b>}</div><h3>{m.name}</h3><p>{m.description}</p><ul>{m.features.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul><a href={'/beli-website/?service=ecommerce&model='+encodeURIComponent(m.name)}>Diskusikan kebutuhan <ArrowUpRight size={16}/></a></article>)}</div>
  </section>

  <section className="section ec-workflow" aria-labelledby="ec-workflow-heading">
   <div><span className="eyebrow">DARI IDE KE ONLINE</span><h2 id="ec-workflow-heading">Proses yang jelas.<br/><em>Tanpa tebak-tebakan.</em></h2><p>Setiap pengembangan dimulai dari kebutuhan produk, alur pemesanan dan kapasitas operasional. Integrasi pihak ketiga dilakukan setelah prasyaratnya terpenuhi.</p></div>
   <div className="ec-steps">{[
    {icon:ClipboardList,title:'Discovery & scope',desc:'Petakan produk, pembeli, tim admin, metode pembayaran, dan target bisnis.'},
    {icon:Paintbrush,title:'Desain & struktur',desc:'Rancang navigasi katalog, halaman produk, keranjang, dan pengalaman mobile.'},
    {icon:Settings2,title:'Development & integrasi',desc:'Bangun sistem sesuai scope; siapkan akun, hak akses, dan integrasi yang disetujui.'},
    {icon:PackageCheck,title:'Uji, rilis & serah terima',desc:'Periksa tampilan, pesanan, pembayaran, serta dokumentasi dan kebutuhan maintenance.'}
   ].map((step,i)=><article key={step.title}><span>0{i+1}</span><step.icon size={19}/><h3>{step.title}</h3><p>{step.desc}</p></article>)}</div>
  </section>

  <section className="section ec-faq" aria-labelledby="ec-faq-heading"><div className="ec-faq-title"><span className="eyebrow">FREQUENTLY ASKED</span><h2 id="ec-faq-heading">Sebelum mulai,<br/><em>ini yang sering ditanyakan.</em></h2></div><div className="ec-faq-list">{questions.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

  <section className="section ec-final-cta" aria-label="Mulai membuat toko online"><div><span className="eyebrow">READY FOR YOUR OWN STORE?</span><h2>Produkmu sudah siap.<br/><em>Sekarang bangun rumah digitalnya.</em></h2><p>Mulai dari brief produk, desain yang mencerminkan brand, lalu sistem yang sesuai cara bisnis kamu berjalan. Kami bantu susun ruang lingkup dengan transparan.</p></div><div className="ec-final-actions"><a className="btn primary" href="/beli-website/">Mulai pesan website <ArrowUpRight size={18}/></a><a className="btn" href="/kontak/">Tanya tim BisaBikinWeb <MessageCircle size={17}/></a><small>Harga, integrasi, waktu pengerjaan, dan maintenance mengikuti proposal yang disetujui.</small></div></section>
 </div>
}
