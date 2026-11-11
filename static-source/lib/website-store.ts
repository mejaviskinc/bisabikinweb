export const websiteCategories=[
  {slug:'umkm',label:'Website UMKM',lead:'Bangun kepercayaan pelanggan lokal dengan informasi usaha yang jelas.',features:['Profil usaha','Lokasi dan kontak','Katalog sederhana']},
  {slug:'company-profile',label:'Company Profile',lead:'Perkenalkan profil, layanan, tim, dan kredibilitas perusahaan.',features:['Tentang perusahaan','Layanan','Form permintaan penawaran']},
  {slug:'toko-online',label:'Toko Online',lead:'Katalog produk dan alur belanja yang disesuaikan operasional.',features:['Katalog','Varian produk','Integrasi checkout sesuai scope']},
  {slug:'ekspor',label:'Website Ekspor',lead:'Menjangkau calon buyer internasional dengan informasi produk dan RFQ.',features:['Katalog B2B','Informasi perusahaan','Request for Quotation']},
  {slug:'travel',label:'Travel & Tour',lead:'Tampilkan paket perjalanan dan bantu wisatawan menghubungi tim.',features:['Daftar paket','Detail destinasi','Permintaan booking']},
  {slug:'restoran',label:'Restoran & Kafe',lead:'Menu, lokasi, cerita brand, dan reservasi sesuai kebutuhan.',features:['Daftar menu','Jam operasional','Kontak dan lokasi']},
  {slug:'fashion',label:'Fashion & Brand',lead:'Tampilkan koleksi dan identitas brand dengan pengalaman visual.',features:['Lookbook','Koleksi','Cerita brand']},
  {slug:'pendidikan',label:'Sekolah & Pendidikan',lead:'Pusat informasi akademik, pengumuman, dan pendaftaran.',features:['Profil sekolah','Berita dan agenda','Formulir informasi']}
] as const;
export const websitePackages=[
  {slug:'starter',name:'Starter',description:'Landing page untuk UMKM. Target 4–6 hari kerja setelah materi lengkap.',base_price:1490000,features:['1 halaman landing page responsif','1 template industri dengan penyesuaian brand','CTA WhatsApp dan formulir kontak sederhana','SEO on-page dasar','1 putaran revisi','Garansi bug implementasi 30 hari']},
  {slug:'business',name:'Business',description:'Company profile profesional. Target 7–12 hari kerja setelah materi lengkap.',base_price:3490000,features:['Maksimal 5 halaman standar','Template bisnis dan penyesuaian brand','Layanan, portofolio, kontak, dan WhatsApp','SEO on-page dasar','2 putaran revisi','Garansi bug implementasi 30 hari']},
  {slug:'commerce',name:'Commerce',description:'Toko online berbasis sistem teruji. Target 15–25 hari kerja setelah materi lengkap.',base_price:6990000,features:['Maksimal 7 halaman utama','Katalog hingga 20 produk awal','Keranjang, checkout, dan pesanan standar','Admin produk dan pesanan standar','Integrasi 1 payment gateway standar (aktivasi tergantung provider)','2 putaran revisi dan garansi bug 30 hari']},
  {slug:'custom',name:'Custom',description:'Mulai Rp12.500.000. Harga final berdasarkan analisis kebutuhan dan penawaran tertulis.',base_price:null,features:['Analisis kebutuhan dan estimasi jam kerja','Dashboard, hak akses, atau API sesuai proposal','Timeline dan milestone tertulis','Batas revisi dan garansi sesuai kontrak','Tidak termasuk sistem kompleks tanpa penawaran khusus']}
] as const;
export const websiteConcepts=[
  {slug:'studio-umkm',title:'Studio UMKM',category:'umkm',description:'Konsep landing page dengan profil usaha, produk unggulan, dan tombol konsultasi.',theme:'olive'},
  {slug:'corporate-grid',title:'Corporate Grid',category:'company-profile',description:'Konsep profil perusahaan dengan layanan, nilai bisnis, dan form inquiry.',theme:'graphite'},
  {slug:'shop-essentials',title:'Shop Essentials',category:'toko-online',description:'Konsep katalog toko online berfokus pada produk, kategori, dan checkout.',theme:'sand'},
  {slug:'global-trade',title:'Global Trade',category:'ekspor',description:'Konsep katalog ekspor berbahasa Inggris dengan profil supplier dan formulir RFQ.',theme:'blue'},
  {slug:'tour-story',title:'Tour Story',category:'travel',description:'Konsep paket wisata dengan detail perjalanan dan konsultasi pemesanan.',theme:'sunset'},
  {slug:'cafe-menu',title:'Cafe Menu',category:'restoran',description:'Konsep cafe dengan daftar menu, lokasi, dan identitas visual brand.',theme:'coffee'},
  {slug:'atelier',title:'Atelier',category:'fashion',description:'Konsep lookbook brand fashion dengan visual koleksi dan cerita label.',theme:'ivory'},
  {slug:'campus-info',title:'Campus Info',category:'pendidikan',description:'Konsep website sekolah dengan informasi, program, dan agenda.',theme:'forest'}
] as const;
export const rupiah=(n:number|null|undefined)=>n==null?'Harga berdasarkan penawaran':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const websiteStatusLabel:Record<string,string>={
 requested:'Permintaan diterima',reviewing:'Review kebutuhan',proposal:'Menunggu persetujuan penawaran',
 awaiting_payment:'Menunggu pembayaran',in_progress:'Dalam pengerjaan',client_review:'Review klien',
 revision:'Revisi',completed:'Selesai',cancelled:'Dibatalkan'
};
