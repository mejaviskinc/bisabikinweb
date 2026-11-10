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
const lower=new Map([...translations].map(([k,v])=>[k.toLocaleLowerCase('id'),v]));
const blockedPath=/^\/(?:admin|seller|account|cart|checkout|payment|track-order|client|pesan-website|privacy|terms|refund|shipping)(?:\/|$)/;
const blockedTags=new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','CODE','PRE','TEXTAREA','OPTION','TITLE','IFRAME']);
let observer=null;
let pending=false;
let activeRoot=null;
let textOriginals=new Map();
let attributeOriginals=new Map();

export function canTranslatePath(path){
 return !blockedPath.test(String(path||'/'));
}
export function translateInterfaceText(source){
 const value=String(source??'');
 const trimmed=value.trim();
 if(!trimmed)return value;
 const result=translations.get(trimmed)||lower.get(trimmed.toLocaleLowerCase('id'));
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
 if(translated===original)return;
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
 if(activeRoot)restoreOriginal();
 activeRoot=root;
 document.documentElement.lang=locale==='en'?'en':'id';
 if(!root||locale!=='en')return;
 translateTree(root);
 observer=new MutationObserver(()=>{
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{
   pending=false;
   if(observer&&activeRoot)translateTree(activeRoot);
  });
 });
 observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
}
export function stopInlineLanguage(){
 if(observer){observer.disconnect();observer=null}
 pending=false;
 restoreOriginal();
 activeRoot=null;
 document.documentElement.lang='id';
}
