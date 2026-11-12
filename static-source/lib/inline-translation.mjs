import {cachedDynamicTranslation,shouldTranslatePublicText,queuePublicTranslation,clearDynamicTranslationQueue,primeDynamicTranslator} from './live-content-translation.mjs';
// In-place user-interface language switcher. This deliberately does NOT navigate,
// alter SEO canonicals, send page content to third parties, or rewrite user input.
// Text for which a reviewed translation is unavailable remains unchanged.
const translations=new Map([
 ['Jasa Website','Web Services'],['Harga','Pricing'],['Toko Online','Online Store'],['Portofolio','Portfolio'],
 ['Beli Website','Buy a Website'],['Artikel','Articles'],['Berita','News'],['Cari website','Search websites'],
 ['Cari sesuatu','Search'],['Konsultasi Gratis','Free Consultation'],['Layanan Website','Website Services'],
 ['Jasa Pembuatan Website','Website Development Services'],['Harga & Paket Website','Website Packages & Pricing'],
 ['Buat Toko Online','Build an Online Store'],['Portofolio Website','Website Portfolio'],
 ['Wilayah','Service Areas'],['Wilayah Layanan','Service Areas'],['Jasa Website Seluruh Indonesia','Website Services Across Indonesia'],
 ['Konsultasi & Kontak','Consultation & Contact'],['Beli Website / Desain','Buy a Website / Designs'],
 ['Paket Website','Website Packages'],['Proyek Saya','My Projects'],['Solusi Website','Website Solutions'],
 ['Tentang BisaBikinWeb','About BisaBikinWeb'],['Lacak pesanan','Track Order'],['Akun & Wishlist','Account & Wishlist'],
 ['Layanan Digital','Digital Services'],['Lihat penawaran','See Our Offer'],
 ['Bikin Website Sekarang','Start Your Website Project'],['Lihat Portfolio','View Portfolio'],
 ['Lihat Portofolio','View Portfolio'],['Mulai Project','Start Your Project'],['Mulai Proyek','Start Your Project'],
 ['Hubungi studio via WhatsApp','Contact Our Studio on WhatsApp'],['Chat WhatsApp','Chat on WhatsApp'],
 ['Tanyakan Sekarang','Ask Now'],['Hubungi Kami','Contact Us'],['Kirim','Send'],
 ['Konsultasikan Project','Discuss Your Project'],['Konsultasikan Estimasi Ini','Discuss This Estimate'],
 ['Lihat semua project','View All Projects'],['Lihat proyek','View Projects'],['Kunjungi website','Visit Website'],
 ['Kunjungi website ↗','Visit Website ↗'],['Detail proyek ↗','Project Details ↗'],
 ['Studi kasus','Case Study'],['Lihat contoh pekerjaan','Explore Previous Work'],
 ['Kunjungi website resmi','Visit the Official Website'],
 ['Jasa bikin web','Website Development'],['Jasa bikin website','Website Development'],
 ['Pilih desain dan pesan website','Choose a Design and Order Your Website'],
 ['Website yang bikin bisnis kamu kelihatan serius.','A Website That Makes Your Business Look Professional.'],
 ['Jasa bikin web untuk bisnis di seluruh Indonesia.','Website Development for Businesses Across Indonesia.'],
 ['Jasa bikin web','Website Development'],['untuk bisnis','for businesses'],['di seluruh Indonesia.','across Indonesia.'],
 ['di seluruh Indonesia','across Indonesia'],['Website Bisnis','Business Website'],
 ['Landing Page','Landing Page'],['Company Profile','Company Website'],
 ['Personal & Portfolio','Personal & Portfolio'],['Custom Web App','Custom Web App'],
 ['Website Maintenance','Website Maintenance'],['Maintenance','Maintenance'],
 ['Website yang sesuai kebutuhan','Websites Tailored to Your Needs'],['Bukan sekadar bikin web.','More Than Just a Website.'],
 ['Bangun yang berguna.','Build Something Useful.'],['Jasa pembuatan landing page','Landing Page Development'],
 ['Jasa pembuatan website company profile','Company Website Development'],
 ['Jasa pembuatan website toko online','Online Store Development'],
 ['Jasa pembuatan website custom dan web app','Custom Website and Web App Development'],
 ['Jasa maintenance dan perawatan website','Website Maintenance and Support'],
 ['Butuh beberapa halaman layanan?','Need Multiple Service Pages?'],
 ['Bandingkan dengan company profile','Compare with Company Websites'],
 ['Lihat pilihan biaya maintenance','View Maintenance Pricing'],
 ['Lihat toko online','Explore Online Stores'],['Lihat company profile','Explore Company Websites'],
 ['Lihat landing page','Explore Landing Pages'],['Lihat web app','Explore Web Apps'],
 ['Kebutuhan','Your Needs'],['Persiapan','Preparation'],['Ruang Lingkup','Project Scope'],
 ['Materi sebelum meminta penawaran.','What to Prepare Before Requesting a Quote.'],
 ['Apa yang perlu disepakati?','What Should Be Agreed in Advance?'],
 ['Harga Website','Website Pricing'],['Paket & Harga','Packages & Pricing'],
 ['Harga pembuatan website.','Website Development Pricing.'],['Jelas sejak awal.','Clear from the Start.'],
 ['Sekali bayar','One-Time Project'],['per bulan','per month'],['mulai dari / project','starting price / project'],
 ['Minta penawaran','Request a Quote'],['Sesuai kebutuhan','Tailored to Your Needs'],
 ['Belum ditentukan','Not Yet Decided'],['Belum yakin','Not Sure Yet'],
 ['Pilih Starter','Choose Starter'],['Pilih Business','Choose Business'],['Pilih Commerce','Choose Commerce'],
 ['Pilih Custom','Choose Custom'],['Bandingkan paket','Compare Packages'],
 ['Masih penasaran?','Still Have Questions?'],['Jelajahi karya untuk brand, fashion, e-commerce, hingga travel.','Explore Work Across Brands, Fashion, E-commerce, and Travel.'],
 ['Pelajari pendekatan setiap proyek.','Explore the Approach Behind Each Project.'],
 ['Lihat studi kasus','View Case Studies'],['Pelajari kebutuhan website sejenis','Learn About Similar Website Projects'],
 ['Baca panduan perancangan website untuk industri ini','Read the Website Planning Guide for This Industry'],
 ['Pelajari sebelum memesan','Learn Before You Order'],
 ['Bandingkan kebutuhan, fitur, dan contoh website.','Compare Your Requirements, Features, and Website Examples.'],
 ['Panduan website company profile B2B','B2B Company Website Guide'],
 ['Website fashion dan toko online','Fashion and Online Store Websites'],
 ['Komponen biaya website & maintenance','Website and Maintenance Costs'],
 ['Lihat portofolio website','Explore Our Website Portfolio'],
 ['Pelajari biaya sebelum memilih paket.','Understand Costs Before Choosing a Package.'],
 ['Panduan biaya pembuatan website','Website Development Cost Guide'],
 ['Bandingkan jasa website','Compare Website Services'],
 ['Layanan website toko online','Online Store Development'],
 ['Layanan company profile','Company Website Services'],
 ['Panduan website skincare','Skincare Website Guide'],
 ['Ceritain.','Tell Us.'],['Kita','We'],['bikinin.','Build It.'],
 ['Konsultasi tanpa biaya','Free Initial Consultation'],
 ['Nggak harus paham teknis','No Technical Knowledge Required'],
 ['Scope dan harga jelas sebelum mulai','Clear Scope and Pricing Before We Begin'],
 ['Nama kamu *','Your Name *'],['Nama lengkap','Full Name'],['Nama bisnis','Business Name'],
 ['Nama brand / perusahaan','Brand / Company Name'],['Jenis website','Website Type'],
 ['Sudah punya domain?','Do You Have a Domain?'],['Target online','Target Launch Date'],
 ['Fitur yang dibutuhkan','Required Features'],['Website referensi','Reference Website'],
 ['Ceritain idenya','Tell Us About Your Project'],
 ['Apa yang ingin dibangun dan siapa penggunanya?','What Would You Like to Build and Who Will Use It?'],
 ['Contoh: katalog, booking, dua bahasa','For Example: Product Catalog, Bookings, Two Languages'],
 ['Belum','Not Yet'],['Sudah','Yes'],['Butuh bantuan memilih','Need Help Choosing'],
 ['Nama','Name'],['Bisnis','Business'],['Email','Email'],['WhatsApp','WhatsApp'],
 ['Konsultasi via WhatsApp','Send Inquiry via WhatsApp'],
 ['Menyimpan…','Saving…'],['Data tersimpan. Membuka WhatsApp…','Inquiry Saved. Opening WhatsApp…'],
 ['Ide project','Project Brief'],
 ['Jumlah halaman','Number of Pages'],
 ['Bikin lebih powerful','Add More Features'],['Opsional','Optional'],
 ['Jenis Website','Website Type'],['Estimasi project','Project Estimate'],
 ['Estimasi indikatif, bukan penawaran final.','Indicative Estimate, Not a Final Quote.'],
 ['Tanpa harus menebak-nebak.','No Guesswork Required.'],
 ['Apa website resmi BisaBikinWeb?','What Is BisaBikinWeb’s Official Website?'],
 ['Apakah BisaBikinWeb melayani kota di luar Yogyakarta?','Does BisaBikinWeb Serve Businesses Outside Yogyakarta?'],
 ['Apa yang perlu disiapkan sebelum konsultasi website?','What Should I Prepare for a Website Consultation?'],
 ['Berapa lama pembuatan website?','How Long Does Website Development Take?'],
 ['Apakah dapat domain?','Is a Domain Included?'],
 ['Apakah website bisa diedit?','Can I Edit My Website?'],
 ['Apakah mobile friendly?','Is the Website Mobile-Friendly?'],
 ['Apakah bisa muncul di Google?','Can It Appear on Google?'],
 ['Apakah ada maintenance?','Is Maintenance Available?'],
 ['Bisa bikin toko online dan custom fitur?','Can You Build Online Stores and Custom Features?'],
 ['Bisa dikembangkan setelah online?','Can the Website Be Expanded After Launch?'],
 ['Kebijakan Privasi','Privacy Policy'],['Syarat & Ketentuan','Terms & Conditions'],
 ['Kebijakan Pengembalian Dana','Refund Policy'],
 ['Belum ada project yang dipublikasikan di kategori ini.','No Projects Published in This Category Yet.'],
 ['Baca artikel','Read Article'],['Baca berita','Read News'],
 ['Baca selengkapnya','Read More'],['Lihat selengkapnya','See More'],
 ['Artikel Terbaru','Latest Articles'],['Berita Terbaru','Latest News'],
 ['Beranda','Home'],['Jelajahi BisaBikinWeb','Explore BisaBikinWeb'],
 ['Temukan layanan website yang kamu butuhkan.','Find the Website Service You Need.'],
 ['Biar kamu nggak ketinggalan.','Stay in the Loop.'],
 ['Kabar terbaru dari studio.','Latest News from Our Studio.'],
 ['Build Your Digital Presence','Build Your Digital Presence'],
 ['Website resmi:','Official Website:'],
 ['Konsultasi website','Website Consultation'],['Mulai konsultasi','Start a Consultation'],
 ['Lanjutkan','Continue'],['Kembali','Back'],['Tutup','Close'],
 ['Cari','Search'],['Tidak ada hasil','No Results'],
 ['Harga website','Website Pricing'],
 ['Biaya awal dan biaya berulang.','Upfront and Recurring Costs.'],
 ['Maintenance dan pengembangan.','Maintenance and Further Development.'],
 ['Apa yang menentukan harga website?','What Determines Website Development Costs?']
]);
for(const [id,en] of [["BisaBikinWeb membantu UMKM, brand, dan perusahaan di seluruh Indonesia membuat website profesional. Konsultasi dan pengerjaan proyek dapat dilakukan secara online.","BisaBikinWeb helps small businesses, brands, and companies across Indonesia and internationally build professional websites. Consultations and development can take place remotely."],["Jasa pembuatan website untuk UMKM, perusahaan, dan brand di Indonesia maupun luar negeri. Mulai dari company profile, landing page, toko online, sampai web app. Konsultasi, brief, desain, dan review proyek dapat dilakukan secara online sesuai ruang lingkup yang disepakati.","Website development for small businesses, companies, and brands in Indonesia and abroad. From company websites and landing pages to online stores and web apps. We can discuss the brief, design, and project reviews remotely based on the agreed scope."],["Kami melayani konsultasi secara online dari berbagai provinsi dan kota.","We provide online consultations across different cities and regions."],["Cek wilayah layanan","See service areas"],["jelajahi","explore"],["solusi website sesuai kebutuhan","website solutions for your needs"],["Jenis usaha yang berbeda memerlukan alur informasi dan fitur yang berbeda. Pilih pendekatan yang sesuai sebelum memutuskan paket.","Different businesses need different information flows and features. Choose the right approach before selecting a package."],["Company profile dan jasa profesional","Company Websites and Professional Services"],["Untuk konsultan, kontraktor, supplier, dan perusahaan yang ingin menampilkan layanan, profil bisnis, dan permintaan penawaran secara jelas.","For consultants, contractors, suppliers, and companies that need to present their services, business profile, and quote requests clearly."],["Toko online dan katalog","Online Stores and Product Catalogs"],["Untuk brand fashion, skincare, kuliner, dan bisnis ritel yang membutuhkan kategori produk, varian, stok, atau alur checkout sesuai kesepakatan.","For fashion, beauty, food, and retail brands that need product categories, variants, inventory, or an agreed checkout flow."],["Landing page yang fokus","Focused Landing Pages"],["Untuk promosi satu produk, kampanye usaha, atau penawaran jasa dengan penjelasan manfaat dan tombol konsultasi yang mudah ditemukan.","For one product, business campaign, or service offer with clear benefits and an easy-to-find consultation button."],["Web app dan dashboard khusus","Custom Web Apps and Dashboards"],["Untuk kebutuhan booking, dashboard admin, formulir pelanggan, pengelolaan data, atau integrasi bisnis yang memerlukan analisis fitur terlebih dahulu.","For bookings, admin dashboards, customer forms, data management, or business integrations that need requirements analysis first."],["Ingin membandingkan anggaran atau mencari layanan dari kota lain? Mulai dari halaman yang sesuai dengan kebutuhanmu.","Want to compare budgets or ask about remote services? Start with the page that matches your needs."],["Mulai dari panduan yang sesuai jenis bisnis, lalu periksa hasil proyek nyata dan minta estimasi tertulis.","Start with the guide for your business type, explore real projects, and request a written estimate."],["Bandingkan fitur, biaya domain, hosting, dan pemeliharaan supaya lingkup penawaran sesuai kebutuhan bisnis.","Compare features, domain costs, hosting, and maintenance so the proposal matches your business needs."],["Bandingkan paket jasa bikin website berdasarkan kebutuhan, fitur, dan biaya operasionalnya.","Compare website development packages by needs, features, and ongoing costs."],["Jumlah halaman, kebutuhan desain, kesiapan materi, akses admin, serta integrasi menentukan biaya pengerjaan. Pilih layanan dahulu, lalu bandingkan paket berdasarkan fitur dan hasil yang diserahkan.","The number of pages, design requirements, content readiness, admin access, and integrations determine development costs. Choose your service first, then compare package features and deliverables."],["Domain, hosting, email bisnis, serta layanan pihak ketiga dapat memiliki biaya perpanjangan. Minta rincian komponen yang termasuk paket, masa aktif, dan tanggung jawab pembayaran agar anggaran tahun berikutnya jelas.","Domain, hosting, business email, and third-party services may incur renewal fees. Ask what is included and who handles renewals so future costs stay clear."],["Pembaruan konten, backup, dukungan, serta penambahan fitur memiliki cakupan berbeda. Sepakati akses, dokumentasi serah terima, batas revisi, dan biaya pemeliharaan secara tertulis sebelum pekerjaan dimulai.","Content updates, backups, support, and additional features have different scopes. Agree on access, handover documentation, revision limits, and maintenance fees in writing before work begins."],["Scope, revisi, domain, hosting, dan biaya integrasi dirinci dalam penawaran. Harga final disepakati sebelum project dimulai.","Scope, revisions, domain, hosting, and integration fees are detailed in your proposal. Final pricing is agreed before development starts."],["Langkah pertama yang serius.","A Serious First Step."],["Ruang lebih besar untuk bisnismu.","More Room for Your Business."],["Etalase milik brand kamu sendiri.","A Storefront for Your Brand."],["Ide unik. Solusi yang juga unik.","Unique Idea. Tailored Solution."],["Satu halaman. Satu tujuan. Bikin pengunjung ambil tindakan.","One Page. One Goal. Help Visitors Take Action."],["Rumah digital yang memperkenalkan bisnis kamu dengan cara yang tepat.","A Digital Home That Introduces Your Business Clearly."],["Dari lihat-lihat sampai checkout. Semuanya di tempat kamu sendiri.","From Browsing to Checkout, All on Your Own Website."],["Karya kamu punya cerita. Kasih mereka panggung yang pantas.","Your Work Has a Story. Give It the Space It Deserves."],["Booking, inventory, dashboard. Kalau bisa dibuka di browser, ayo obrolin.","Bookings, Inventory, Dashboards. Let's Talk About What You Need."],["Website tetap terawat, sementara kamu fokus menjalankan bisnis.","Keep Your Website Maintained While You Focus on Business."],["Desain responsive","Responsive Design"],["CTA WhatsApp","WhatsApp CTA"],["SEO dasar","Basic SEO"],["Analytics opsional","Optional Analytics"],["Optimasi kecepatan","Speed Optimization"],["Profil perusahaan","Company Profile"],["Layanan & portfolio","Services & Portfolio"],["Halaman tim","Team Page"],["Form kontak","Contact Form"],["Katalog & varian","Catalog & Variants"],["Keranjang belanja","Shopping Cart"],["Pengelolaan pesanan","Order Management"],["Stok & diskon","Inventory & Discounts"],["Integrasi pembayaran sesuai kesepakatan","Payment Integration as Agreed"],["Galeri karya","Project Gallery"],["Profil personal","Personal Profile"],["Form inquiry","Inquiry Form"],["Hak akses","Access Controls"],["Integrasi sistem","System Integrations"],["Update konten","Content Updates"],["Perbaikan bug","Bug Fixes"],["Backup sesuai paket","Backups per Package"],["Optimasi performa","Performance Optimization"],["Pemeriksaan keamanan","Security Checks"],["Landing page / personal website","Landing Page / Personal Website"],["Tampilan responsive","Responsive Layout"],["CTA konsultasi","Consultation CTA"],["Company profile multi halaman","Multi-Page Company Website"],["Portfolio & layanan","Portfolio & Services"],["Konten sesuai kebutuhan","Content Tailored to Your Needs"],["Katalog & varian produk","Product Catalog & Variants"],["Cart & checkout","Cart & Checkout"],["Integrasi sesuai kebutuhan","Integrations as Needed"],["Web app & sistem internal","Web Apps & Internal Systems"],["Hak akses pengguna","User Permissions"],["Integrasi API","API Integrations"],["Scope sesuai kesepakatan","Agreed Project Scope"],["Punya brief rapi? Gas. Masih sebatas ide? Nggak masalah. Mulai dari obrolan dulu.","Have a detailed brief or just an idea? Either way, let's talk about it."],["Saya setuju data ini digunakan untuk menanggapi konsultasi sesuai ","I agree that my data will be used to respond to this inquiry under the "],["kebijakan privasi","privacy policy"],["Data konsultasi disimpan aman di database lalu WhatsApp dibuka agar pesan bisa langsung dikirim.","Your inquiry is saved before WhatsApp opens so you can send your message directly."],["Apa yang menentukan harga website?","What Determines Website Pricing?"],["Konsultasi proyek internasional","International Project Consultation"],["Penawaran untuk klien internasional","Quote for International Clients"],["Website resmi studio BisaBikinWeb adalah https://bisabikinweb.site/. Periksa domain ini saat melihat layanan, portofolio, harga, atau mengirim permintaan konsultasi.","The official BisaBikinWeb website is https://bisabikinweb.site/. Check this domain when browsing services, the portfolio, pricing, or sending an inquiry."],["Ya. Konsultasi dan pengembangan website dapat dilakukan secara online untuk pelaku usaha di seluruh Indonesia. Halaman kota menunjukkan cakupan layanan online, bukan klaim kantor fisik di setiap kota.","Yes. Website consultation and development are available remotely across Indonesia. City pages describe remote service coverage, not a physical office in every city."],["Siapkan jenis bisnis, tujuan website, fitur wajib, jumlah halaman perkiraan, contoh desain, materi brand, jadwal yang diinginkan, dan kisaran anggaran. Tim akan membahas ruang lingkup dan biaya final sebelum pekerjaan dimulai.","Prepare your business type, website goals, required features, approximate number of pages, design references, brand materials, timeline, and budget range. The team discusses scope and final pricing before work begins."],["Tergantung scope dan kesiapan konten. Timeline disepakati setelah kebutuhan, struktur, dan fitur dibahas.","It depends on scope and content readiness. The timeline is agreed after discussing requirements, structure, and features."],["Kebutuhan domain dan hosting dijelaskan dalam penawaran. Kamu juga bisa menggunakan domain yang sudah dimiliki.","Domain and hosting requirements are detailed in the quote. You can also use a domain you already own."],["Bisa. Pengelolaan konten dan akses admin disesuaikan dengan paket yang dipilih.","Yes. Content management and admin access depend on the selected package."],["Ya, tampilan dirancang agar nyaman digunakan dari ponsel, tablet, dan desktop.","Yes. The layout is designed for phones, tablets, and desktop computers."],["Website disiapkan dengan struktur SEO dasar. Pengindeksan dan posisi pencarian tetap mengikuti proses dan kebijakan mesin pencari; peringkat tertentu tidak dijamin.","Websites include basic SEO structure. Indexing and search positions depend on search engine processes; specific rankings are not guaranteed."],["Ada layanan maintenance. Lingkup update, backup, perbaikan, dan biaya disepakati secara terpisah.","Maintenance is available. Updates, backups, fixes, and related fees are agreed separately."],["Bisa. Ceritakan alur bisnis dan integrasi yang dibutuhkan agar scope dapat disusun dengan tepat.","Yes. Describe your business workflow and integration requirements so the scope can be planned."],["Bisa. Pengembangan berikutnya direncanakan sesuai arsitektur, kebutuhan, serta anggaran.","Yes. Further development can be planned based on architecture, requirements, and budget."]]) translations.set(id,en);
// Conversion-first homepage copy: curated ID/EN translations for the static sales flow.
for(const [id,en] of [
 ['JASA PEMBUATAN WEBSITE · SELURUH INDONESIA','WEBSITE DEVELOPMENT · ACROSS INDONESIA'],
 ['Konsultasi awal gratis','Free initial consultation'],
 ['Paket website mulai','Website packages from'],
 ['Paket website sesuai kebutuhan bisnis','Website packages tailored to your business'],
 ['Website profesional yang bikin bisnis','Professional websites that make your business'],
 ['lebih dipercaya dan mudah dihubungi.','more trustworthy and easier to contact.'],
 ['BisaBikinWeb membantu bisnis memiliki website yang jelas, enak dibuka dari HP, dan memudahkan calon pelanggan menemukan layanan serta menghubungi kamu.','BisaBikinWeb helps businesses build clear, mobile-friendly websites that make it easier for potential customers to find services and get in touch.'],
 ['Lihat Paket & Pesan','View Packages & Order'],
 ['Konsultasi via WhatsApp','Consult on WhatsApp'],
 ['Lihat hasil website yang sudah dikerjakan','See Websites We Have Built'],
 ['Nyaman di HP','Mobile-friendly'],
 ['Alur pemesanan jelas','Clear ordering steps'],
 ['Harga paket ditampilkan','Package prices displayed'],
 ['Toko Online','Online Store'],
 ['Desain Sesuai Industri','Industry-Specific Design'],
 ['Dukungan Setelah Online','Support After Launch'],
 ['Buat profil bisnis, layanan, dan kontak tampil lebih meyakinkan dalam satu website resmi.','Present your business profile, services, and contacts more credibly on one official website.'],
 ['Arahkan pengunjung ke satu penawaran dengan tombol kontak yang gampang ditemukan.','Guide visitors to one clear offer with an easy-to-find contact button.'],
 ['Tampilkan katalog, keranjang, dan alur pemesanan dalam website milik bisnismu.','Show products, cart, and ordering steps on your own business website.'],
 ['Tampilan disesuaikan dengan karakter brand, bukan sekadar ganti warna template.','Design tailored to your brand, not just a template color change.'],
 ['Cakupan revisi, garansi bug, dan layanan tambahan dijelaskan sesuai paket.','Revisions, bug warranty, and optional services are explained for each package.'],
 ['PORTOFOLIO NYATA','REAL PROJECT PORTFOLIO'],
 ['Lihat contoh hasil kerja sebelum memesan.','See real projects before placing an order.'],
 ['Jelajahi portofolio','Explore Portfolio'],
 ['Cara mudah memulai website','An Easy Way to Get Started'],
 ['Pilih paket','Choose a package'],
 ['Bandingkan fitur dan harga','Compare features and prices'],
 ['Isi kebutuhan','Share your requirements'],
 ['Ceritakan website yang kamu mau','Describe your ideal website'],
 ['Lanjutkan pemesanan','Continue your order'],
 ['Ikuti langkah checkout','Follow the checkout steps'],
 ['Mulai dari sini','Start here'],
 ['PILIH SESUAI TUJUAN','CHOOSE BY BUSINESS GOAL'],
 ['Mau website yang bantu jualan atau bangun kepercayaan?','Need a website to support sales or build trust?'],
 ['Jangan bingung pilih teknologi dulu. Mulai dari tujuan bisnisnya, lalu lihat layanan yang paling pas.','Start with your business goal, not the technology. Then explore the most suitable service.'],
 ['Website Bisnis','Business Website'],
 ['Profil perusahaan, layanan, dan informasi kontak yang rapi.','A clear company profile, services, and contact information.'],
 ['Katalog produk, keranjang, dan checkout yang lebih terarah.','Product catalogs, carts, and a more guided checkout flow.'],
 ['Kelola Instagram','Instagram Management'],
 ['Konten dan pengelolaan Instagram untuk melengkapi kehadiran digital brand.','Instagram content and account management to support your digital brand.'],
 ['Lihat layanan','Explore service'],
 ['HARGA JELAS, PILIHAN SESUAI KEBUTUHAN','CLEAR PRICES, PACKAGES TO FIT YOUR NEEDS'],
 ['Pilih paket website tanpa perlu menebak biayanya.','Choose a website package with clear pricing.'],
 ['Bandingkan fitur, lihat cakupan tiap paket, lalu lanjut ke pemesanan. Biaya domain, hosting, dan tambahan lainnya dijelaskan terpisah.','Compare package features and scope, then proceed to your order. Domain, hosting, and optional costs are explained separately.'],
 ['Detail harga','Pricing details'],
 ['Lihat Paket','View Packages'],
 ['DESIGNED FOR YOUR BUSINESS. BUILT TO WORK.','DESIGNED FOR YOUR BUSINESS. BUILT TO WORK.']
]) translations.set(id,en);
const lower=new Map([...translations].map(([k,v])=>[k.toLocaleLowerCase('id'),v]));
const blockedPath=/^\/(?:admin|seller|account|cart|checkout|payment|track-order|client|pesan-website|privacy|terms|refund|shipping)(?:\/|$)/;
const blockedTags=new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','CODE','PRE','TEXTAREA','OPTION','TITLE','IFRAME']);
let observer=null;
let pending=false;
let activeRoot=null;
let currentLocale='id';
let textOriginals=new Map();
let attributeOriginals=new Map();

export function canTranslatePath(path){
 return !blockedPath.test(String(path||'/'));
}
export function translateInterfaceText(source){
 const value=String(source??'');
 const trimmed=value.trim();
 if(!trimmed)return value;
 const result=translations.get(trimmed)||lower.get(trimmed.toLocaleLowerCase('id'))||cachedDynamicTranslation(trimmed);
 if(!result)return value;
 const from=value.indexOf(trimmed);
 return value.slice(0,from)+result+value.slice(from+trimmed.length);
}
function eligible(element){
 if(!element||element.nodeType!==1)return false;
 const tag=element.tagName;
 if(blockedTags.has(tag))return false;
 if(element.closest('[data-no-translate],.language-switch,[contenteditable="true"],svg,pre,code,textarea,script,style,noscript'))return false;
 return true;
}
function translateNode(node){
 const element=node.parentElement;
 if(!eligible(element))return;
 let original=textOriginals.get(node);
 if(original===undefined)original=node.nodeValue||'';
 else if(node.nodeValue!==original&&node.nodeValue!==translateInterfaceText(original)){
  original=node.nodeValue||'';
  textOriginals.set(node,original);
 }
 const translated=translateInterfaceText(original);
 if(translated===original){
  if(currentLocale==='en'&&shouldTranslatePublicText(original,element)){
   // Async translation is tied to the originating React text node and locale;
   // stale responses must never replace freshly published content or form input.
   const source=original;
   queuePublicTranslation(source.trim(),()=>{
    if(currentLocale==='en'&&node.isConnected&&textOriginals.get(node)===source&&node.nodeValue===source){
     const next=translateInterfaceText(source);
     if(next!==source)node.nodeValue=next;
    }
   });
   textOriginals.set(node,source);
  }
  return;
 }
 textOriginals.set(node,original);
 if(node.nodeValue!==translated)node.nodeValue=translated;
}
function translateAttributes(element){
 if(!eligible(element))return;
 for(const attr of ['placeholder','title','aria-label']){
  if(!element.hasAttribute(attr))continue;
  const value=element.getAttribute(attr)||'';
  let snapshot=attributeOriginals.get(element);
  const original=snapshot?.get(attr)??value;
  const translated=translateInterfaceText(original);
  if(translated===original)continue;
  if(!snapshot){snapshot=new Map();attributeOriginals.set(element,snapshot)}
  snapshot.set(attr,original);
  if(value!==translated)element.setAttribute(attr,translated);
 }
}
function translateTree(root){
 if(!root)return;
 if(root.nodeType===1)translateAttributes(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let current;
 while((current=walker.nextNode())){
  if(current.nodeType===Node.TEXT_NODE)translateNode(current);
  else translateAttributes(current);
 }
}
function restoreOriginal(){
 for(const [node,original] of textOriginals){
  if(node.isConnected&&node.nodeValue===translateInterfaceText(original))node.nodeValue=original;
 }
 for(const [element,fields] of attributeOriginals){
  if(!element.isConnected)continue;
  for(const [attr,original] of fields){
   if(element.getAttribute(attr)===translateInterfaceText(original))element.setAttribute(attr,original);
  }
 }
 textOriginals.clear();
 attributeOriginals.clear();
}
export function applyInlineLanguage(root,locale){
 if(observer){observer.disconnect();observer=null}
 pending=false;
 clearDynamicTranslationQueue();
 if(activeRoot)restoreOriginal();
 activeRoot=root;
 currentLocale=locale;
 document.documentElement.lang=locale==='en'?'en':'id';
 if(!root||locale!=='en')return;
 // Also attempt to use an already downloaded browser language pack after navigation.
 primeDynamicTranslator();
 translateTree(root);
 observer=new MutationObserver((records)=>{
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{
   pending=false;
   if(!observer||!activeRoot||currentLocale!=='en')return;
   // Process only changed CMS nodes. Rewalking entire articles after every
   // translation response caused O(n²) work and occasional typing delays.
   for(const record of records){
    if(record.type==='childList'){
     for(const added of record.addedNodes){
      if(added.nodeType===Node.TEXT_NODE)translateNode(added);
      else if(added.nodeType===Node.ELEMENT_NODE)translateTree(added);
     }
    }else if(record.type==='characterData')translateNode(record.target);
    else if(record.type==='attributes')translateAttributes(record.target);
   }
  });
 });
 observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
}
export function stopInlineLanguage(){
 if(observer){observer.disconnect();observer=null}
 pending=false;
 clearDynamicTranslationQueue();
 currentLocale='id';
 restoreOriginal();
 activeRoot=null;
 document.documentElement.lang='id';
}
