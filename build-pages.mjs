import {createHash} from 'node:crypto';
import {build} from 'vite';
import {englishPages,englishHref,hasEnglishPage} from './static-source/lib/languages.mjs';
import {isNewsArticle,makeNewsSitemap,getFreshNewsArticles} from './static-source/lib/news.mjs';
import {mergeEditorialPosts} from './static-source/lib/editorial-posts.mjs';
import {cityLandingPages} from './static-source/lib/city-pages.mjs';
import {provincePages,localityPages,provinceBySlug,localityByPath} from './static-source/lib/geo-pages.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const configFile=new URL('./vite.pages.mjs',import.meta.url).pathname;
await build({configFile});
await build({configFile,publicDir:false,build:{ssr:'render.tsx',outDir:'../.pages-ssr',emptyOutDir:true}});
const {render,defaults}=await import('./.pages-ssr/render.js');

async function fetchPublishedArticles(){
  try{
    const source=await readFile('static-source/lib/supabase.ts','utf8');
    const supabaseUrl=source.match(/const SUPABASE_URL='([^']+)'/)?.[1];
    const publishableKey=source.match(/const SUPABASE_KEY='([^']+)'/)?.[1];
    if(!supabaseUrl||!publishableKey)throw new Error('Konfigurasi Supabase publik tidak ditemukan');
    const endpoint=new URL('/rest/v1/bbweb_articles',supabaseUrl);
    endpoint.searchParams.set('select','id,title,category,read_time,summary,body,cover_image_url,sort_order,status,is_active,published_at,updated_at,created_at,seller_id,author_store_name,author_type');
    endpoint.searchParams.set('is_active','eq.true');
    endpoint.searchParams.set('status','eq.published');
    endpoint.searchParams.set('order','sort_order.asc,published_at.desc');
    const response=await fetch(endpoint,{headers:{apikey:publishableKey,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Supabase merespons HTTP '+response.status);
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error('Data artikel Supabase bukan array');
    const seen=new Set();
    return rows.map(row=>({
      id:String(row.id||'').trim().toLowerCase(),
      title:String(row.title||'').trim(),
      category:String(row.category||'Business').trim()||'Business',
      read:String(row.read_time||'3 menit').trim()||'3 menit',
      summary:String(row.summary||'').trim(),
      body:Array.isArray(row.body)?row.body.map(p=>String(p??'').trim()).filter(Boolean):[],
      image:String(row.cover_image_url||'').trim(),
      cover_image_url:String(row.cover_image_url||'').trim(),
      published_at:row.published_at||null,
      updated_at:row.updated_at||row.published_at||null,
      created_at:row.created_at||row.published_at||null,
      seller_id:row.seller_id||null,
      author_store_name:String(row.author_store_name||'BisaBikinWeb').trim(),
      author_type:row.author_type==='seller'?'seller':'editorial',
      sort_order:row.sort_order??100
    })).filter(article=>{
      if(!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(article.id)||!article.title||seen.has(article.id))return false;
      seen.add(article.id);
      return true;
    });
  }catch(error){
    console.warn('Artikel live belum bisa dimuat saat build; memakai artikel bawaan.',error instanceof Error?error.message:String(error));
    return null;
  }
}
const liveArticles=await fetchPublishedArticles();
const buildArticles=mergeEditorialPosts(liveArticles?.length?liveArticles:defaults.articles);
// Artikel SEO baru: website ekspor untuk bisnis Indonesia.
const exportArticle={id:'website-ekspor-bisnis-internasional',title:'Website Ekspor: Cara Bisnis Indonesia Menjangkau Buyer Internasional',category:'Bisnis dan Teknologi',read:'6 menit',summary:'Pelajari manfaat website ekspor untuk memperkenalkan produk Indonesia, membangun kepercayaan buyer internasional, dan memperluas pasar global.',body:[
'Website ekspor adalah website bisnis yang dirancang untuk memperkenalkan perusahaan, produk, kapasitas produksi, dan informasi perdagangan kepada calon pembeli dari luar negeri. Bagi eksportir, website dapat menjadi pusat informasi resmi yang bisa diakses buyer kapan saja dan dari berbagai negara.',
'Mengapa bisnis ekspor membutuhkan website profesional? Buyer internasional biasanya perlu memeriksa profil perusahaan, jenis produk, spesifikasi, kapasitas pasokan, sertifikasi yang relevan, serta cara menghubungi pemasok sebelum memulai komunikasi. Website yang rapi membantu informasi penting tersebut ditemukan dalam satu tempat.',
'Manfaat pertama adalah memperluas jangkauan pasar. Website dapat ditemukan melalui mesin pencari saat calon buyer mencari produk atau pemasok berdasarkan nama produk, negara asal, atau spesifikasi tertentu. Website tidak menjamin buyer langsung datang, tetapi membantu bisnis membangun kehadiran digital yang bisa ditemukan dan dibagikan.',
'Manfaat kedua adalah meningkatkan kepercayaan. Tampilkan identitas perusahaan yang konsisten, alamat dan kontak bisnis, foto produk yang asli, penjelasan proses produksi, serta dokumen atau sertifikasi yang memang dimiliki. Hindari klaim sertifikasi, kapasitas, atau pengalaman ekspor yang belum dapat dibuktikan.',
'Manfaat ketiga adalah memudahkan permintaan penawaran. Katalog produk dapat memuat nama produk, spesifikasi, grade, pilihan kemasan, minimum order quantity jika berlaku, kapasitas pasokan, negara asal, dan foto. Formulir inquiry atau Request for Quotation (RFQ) membantu buyer mengirim kebutuhan volume, tujuan pengiriman, dan detail lain yang diperlukan untuk tindak lanjut.',
'Fitur penting website ekspor meliputi company profile, katalog produk yang mudah diperbarui, halaman kontak, formulir permintaan penawaran, tampilan responsif untuk ponsel, sertifikat SSL, serta halaman privasi. Jika menargetkan beberapa negara, pertimbangkan versi bahasa Inggris yang diterjemahkan dengan baik dan informasi satuan ukur yang konsisten.',
'Optimasi SEO untuk website ekspor dimulai dengan halaman terpisah untuk produk atau kategori utama. Gunakan kata kunci yang sesuai dengan produk dan pasar sasaran, judul halaman yang jelas, deskripsi meta yang relevan, URL sederhana, gambar terkompresi dengan teks alternatif, serta tautan internal antarhalaman. Buat konten yang benar-benar menjawab pertanyaan buyer, bukan mengulang kata kunci secara berlebihan.',
'Langkah membangun website ekspor: tentukan negara dan tipe buyer yang ingin dijangkau; siapkan profil perusahaan dan informasi produk yang terverifikasi; susun struktur halaman; siapkan versi bahasa yang dibutuhkan; pasang analitik dan Google Search Console; lalu perbarui katalog dan konten secara berkala. Pastikan tim dapat menanggapi inquiry dengan cepat dan profesional.',
'Apakah website otomatis mendatangkan buyer internasional? Tidak. Website merupakan salah satu saluran pemasaran dan validasi bisnis. Hasilnya dipengaruhi oleh kualitas produk, harga, kesiapan dokumen ekspor, daya saing, promosi, optimasi SEO, serta tindak lanjut terhadap calon buyer. Website akan lebih efektif jika didukung jaringan perdagangan, marketplace B2B, pameran, dan aktivitas pemasaran lain yang relevan.',
'Jika bisnis Anda ingin mulai membangun kehadiran digital untuk pasar lokal maupun internasional, BisaBikinWeb dapat membantu merancang website bisnis dengan struktur informasi yang jelas dan siap dikembangkan untuk kebutuhan SEO. Kunjungi https://bisabikinweb.site/ untuk berkonsultasi mengenai kebutuhan website perusahaan atau katalog produk ekspor.'
],image:'',cover_image_url:'',published_at:'2026-10-21T00:00:00+07:00',updated_at:'2026-10-21T00:00:00+07:00',created_at:'2026-10-21T00:00:00+07:00',seller_id:null,author_store_name:'BisaBikinWeb',author_type:'editorial',sort_order:0};
if(!buildArticles.some(article=>article.id===exportArticle.id))buildArticles.unshift(exportArticle);

const buildData={...defaults,articles:buildArticles};
const freshNewsArticles=getFreshNewsArticles(buildArticles);
const origin='https://bisabikinweb.site';
const brand='BisaBikinWeb.id';
const logo=origin+'/brand/bisabikinweb-logo-compact.svg';
const phone='+62882003740969';
const email='bisabikinw3b@gmail.com';
const pages={
  '/':['BisaBikinWeb.id | Jasa Bikin Website Seluruh Indonesia','Jasa pembuatan website profesional untuk UMKM, perusahaan, dan toko online di seluruh Indonesia. Lihat layanan, paket harga, portofolio, dan konsultasi BisaBikinWeb.'],
  '/jasa':['Jasa Pembuatan Website Profesional di Indonesia','Pilih jasa pembuatan website untuk UMKM dan perusahaan di seluruh Indonesia: landing page, company profile, toko online, web app, dan maintenance.'],
  '/wilayah':['Jasa Website Seluruh Indonesia & 38 Provinsi','Lihat daftar layanan jasa bikin web BisaBikinWeb untuk Jakarta, Bandung, Surabaya, Medan, Makassar, seluruh 38 provinsi dan kota/kabupaten lainnya di Indonesia.'],
  '/harga':['Harga & Paket Jasa Pembuatan Website','Bandingkan paket Starter, Business, Commerce, dan Custom BisaBikinWeb. Lihat fitur, pilihan biaya, serta konsultasikan ruang lingkup proyek website.'],
  '/portfolio':['Portofolio Website Bisnis & Toko Online','Lihat studi kasus dan karya website BisaBikinWeb untuk Berbeda, Karpenter, Mejavi Skin+, GoO Ninks, GoJogja Travel, dan berbagai kebutuhan bisnis.'],
  '/layanan-digital':['Layanan Digital: Pulsa, Data, Token & Travel','Rencana layanan digital BisaBikinWeb meliputi pulsa, paket data, token listrik, dan kebutuhan perjalanan. Fitur masih dalam tahap persiapan.'],
  '/merch':['Merchandise & Koleksi Apparel BisaBikinWeb','Jelajahi koleksi merchandise BisaBikinWeb, desain apparel, dan produk kreatif. Lihat pilihan produk, informasi stok, varian, serta cara pemesanan.'],
  '/tentang':['Tentang Studio Digital BisaBikinWeb di Yogyakarta','Kenali pendekatan dan proses kerja BisaBikinWeb dalam merancang website bisnis. Dari kebutuhan UMKM hingga solusi web khusus untuk perusahaan.'],
  '/kontak':['Konsultasi & Kontak Jasa Pembuatan Website','Hubungi BisaBikinWeb via WhatsApp atau email untuk konsultasi pembuatan website secara online dari mana saja di Indonesia, mulai UMKM hingga perusahaan.'],
  '/artikel':['Artikel SEO, Website & Strategi Bisnis Digital','Baca panduan praktis tentang SEO, pembuatan website, desain web, pemasaran digital, dan pengembangan bisnis dari tim editorial BisaBikinWeb.'],
  '/berita':['Berita Bisnis, Ekonomi, Politik & Teknologi','Ikuti berita terkurasi BisaBikinWeb seputar ekonomi, bisnis, politik, teknologi, dan perkembangan dalam maupun luar negeri dengan rujukan sumber.'],
  '/redaksi':['Redaksi, Sumber Berita & Kebijakan Koreksi','Ketahui standar editorial BisaBikinWeb: penggunaan sumber, verifikasi fakta, koreksi berita, hak penggunaan gambar, dan informasi kontak redaksi.'],
  '/privacy':['Kebijakan Privasi & Penggunaan Data','Baca bagaimana BisaBikinWeb mengumpulkan, memproses, dan melindungi data saat konsultasi website, berlangganan konten, dan transaksi.'],
  '/terms':['Syarat & Ketentuan Layanan Website','Pelajari syarat penggunaan website BisaBikinWeb, layanan digital, ketentuan pemesanan, dan tanggung jawab pengguna.'],
  '/refund':['Ketentuan Refund & Pengembalian Pesanan','Informasi kebijakan pengembalian, pembatalan, serta penanganan permintaan refund untuk produk dan layanan BisaBikinWeb.'],
  '/shipping':['Informasi Pengiriman Merchandise','Temukan informasi proses pengiriman merchandise BisaBikinWeb, konfirmasi alamat dan ongkir, serta pemantauan status pesanan.'],
  '/cart':['Keranjang','Tinjau wishlist dan produk Anda.'],
  '/checkout':['Checkout Merchandise','Selesaikan detail pengiriman dan lanjutkan pembayaran merchandise Bisabikinweb.'],
  '/payment':['Pengalihan Pembayaran DOKU — BisaBikinWeb','Pengalihan aman tautan pembayaran lama ke DOKU Checkout resmi.'],
  '/track-order':['Lacak Pesanan Merchandise','Periksa status pembayaran dan pengiriman pesanan Bisabikinweb.'],
  '/account':['Akun Pembeli — BisaBikinWeb','Login pembeli, profil, riwayat pesanan, dan status pembayaran merchandise BisaBikinWeb.'],
  '/admin':['Admin Bisabikinweb','Panel admin Bisabikinweb untuk lead, portfolio, dan pengaturan website.'],
  '/admin/sellers':['Seller Operations — Bisabikinweb','Panel admin untuk menyetujui seller, meninjau produk marketplace, dan mengelola permintaan withdraw.'],
  '/seller':['Seller Dashboard — Bisabikinweb','Dashboard seller untuk mengelola produk, pesanan, saldo penjualan, dan permintaan pencairan.'],
  '/admin/iklan':['Ads Manager Bisabikinweb','Panel admin untuk mengatur iklan homepage Bisabikinweb.'],
  '/admin/payments':['Payment Gateway — BisaBikinWeb','Dashboard transaksi DOKU, status pembayaran, rekonsiliasi, dan monitoring checkout merchandise.']
};
for(const city of cityLandingPages){pages['/wilayah/'+city.slug]=[city.title,city.description];}
for(const province of provincePages){pages[province.path]=[province.title,province.description];}
for(const locality of localityPages){pages[locality.path]=[locality.title,locality.description];}
for(const [kind,prefix] of [['services','jasa'],['portfolio','portfolio'],['products','merch']]){
 for(const p of defaults[kind]){
  const name=String(p.name||p.title||'').trim();
  const title=kind==='services'?'Layanan '+name:kind==='portfolio'?'Studi Kasus Website '+name:'Merchandise '+name;
  const description=kind==='services'?name+': '+(p.description||'')+' Fitur yang tersedia: '+(p.features||[]).slice(0,3).join(', ')+'.':kind==='portfolio'?'Studi kasus '+name+'. '+(p.goal||p.description||'')+' '+(p.solution||''):'Lihat '+name+' di katalog merchandise BisaBikinWeb. '+(p.description||p.summary||'');
  pages['/'+prefix+'/'+p.id]=[title,description];
 }
}
// Halaman toko online menjadi tujuan layanan tersendiri, bukan sekadar judul umum "Online Store".
pages['/jasa/ecommerce']=[
 'Jasa Pembuatan Toko Online Profesional',
 'Buat website toko online untuk brand dan UMKM: katalog produk, varian, keranjang, pembayaran sesuai integrasi, dan pengelolaan pesanan.'
];
for(const article of buildArticles){
 const firstParagraph=Array.isArray(article.body)?article.body.find(line=>typeof line==='string'&&line.trim()&&!/^#+\\s/.test(line)):null;
 pages['/artikel/'+article.id]=[article.title,article.summary||firstParagraph||'Baca artikel '+article.title+' dari '+(article.author_store_name||'redaksi BisaBikinWeb')+'.'];
}
for(const [path,metadata] of Object.entries(englishPages)){
  pages[englishHref(path).slice(0,-1)]=metadata;
}
const articleByPath=new Map(buildArticles.map(article=>['/artikel/'+article.id,article]));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const jsonLd=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const buildDate=new Date().toISOString().slice(0,10);
const plain=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const snippet=s=>{const value=plain(s);return value.length>160?value.slice(0,157).trimEnd()+'…':value};
const isoDate=value=>{if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};
const dateOnly=value=>isoDate(value)?.slice(0,10)||buildDate;
const safeHttpsUrl=value=>{try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}};
const organization={
  '@context':'https://schema.org','@type':'Organization','@id':origin+'/#organization',name:brand,url:origin+'/',logo:{'@type':'ImageObject',url:logo},image:logo,email,telephone:phone,
  description:'Jasa pembuatan website profesional untuk UMKM, bisnis, personal brand, toko online, dan perusahaan.',
  contactPoint:{'@type':'ContactPoint',telephone:phone,email,contactType:'customer service',areaServed:'ID',availableLanguage:['id','en']}
};
const website={'@context':'https://schema.org','@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:brand,alternateName:'BisaBikinWeb',inLanguage:'id-ID',publisher:{'@id':origin+'/#organization'}};
const adsenseClient='ca-pub-9568884120945028';
const adsenseScriptUrl='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+adsenseClient;
function protectHtml(html){
 const hasAdsense=html.includes(adsenseScriptUrl);
 const adScripts=hasAdsense?' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com':'';
 const adConnections=hasAdsense?' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com':'';
 const adFrames=hasAdsense?' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google':'';
 const hashes=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m=>m[1].trim()).map(m=>"'sha256-"+createHash('sha256').update(m[1]).digest('base64')+"'");
 const policy=["default-src 'none'","base-uri 'none'","object-src 'none'","script-src 'self' "+hashes.join(' ')+adScripts,"script-src-attr 'none'","style-src 'self' 'unsafe-inline'","img-src 'self' data: https:","font-src 'self' data:","connect-src 'self' https://kdlrobdzlxpjlkxbvzsd.supabase.co"+adConnections,"frame-src https://www.instagram.com https://instagram.com https://berbeda.co.id https://www.berbeda.co.id https://karpenter.co.id https://www.karpenter.co.id https://mejaviskincare.co.id https://www.mejaviskincare.co.id https://gooninks.co.id https://www.gooninks.co.id https://gojogjatravel.web.id https://www.gojogjatravel.web.id"+adFrames,"media-src 'self'","form-action 'none'","upgrade-insecure-requests"].join('; ');
 return html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"/><meta name="referrer" content="no-referrer"/>');
}
const template=await readFile('site-dist/index.html','utf8');
for(const [path,[name,description]] of Object.entries(pages)){
  const english=path==='/en'||path.startsWith('/en/');
  const locale=english?'en':'id';
  const language=english?'en':'id-ID';
  const equivalentPath=english?path.slice(3)||'/':path;
  const homePath=english?'/en/':'/';
  const article=articleByPath.get(path);
  const title=article?(article.title.length<=55?article.title+' | '+brand:article.title):(path==='/'?name:(name.toLowerCase().includes('bisabikinweb')?name:name+' | '+brand));
  const url=origin+(path==='/'?'/':path+'/');
  const isService=equivalentPath.startsWith('/jasa/');
  const cityPage=cityLandingPages.find(city=>path==='/wilayah/'+city.slug);
  const geoProvince=path.startsWith('/wilayah/provinsi/')&&path.split('/').length===4?provinceBySlug[path.split('/')[3]]:null;
  const geoLocality=localityByPath[path]||null;
  const noindex=Boolean(geoLocality)||path==='/cart'||path==='/checkout'||path==='/payment'||path==='/track-order'||path==='/account'||path==='/seller'||path==='/layanan-digital'||path.startsWith('/admin');
  const metaDescription=snippet(description);
  const articleImage=safeHttpsUrl(article?.image);
  const imageUrl=articleImage||origin+'/og.svg';
  const publishedAt=isoDate(article?.published_at);
  const modifiedAt=isoDate(article?.updated_at||article?.published_at);
  // Prerender adalah satu-satunya sumber JSON-LD agar tidak bentrok dengan React.
  const schemas=[];
  if(!noindex){
    if(path==='/'||path==='/tentang')schemas.push(organization);
    if(path==='/')schemas.push(website);
    if(path==='/'||path==='/wilayah')schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#nationwide-web-development',name:'Jasa Bikin Website Seluruh Indonesia',serviceType:'Jasa pembuatan website',description:metaDescription,url,provider:{'@id':origin+'/#organization'},areaServed:{'@type':'Country',name:'Indonesia'},availableLanguage:['id','en']});
    const section=article?(isNewsArticle(article)?'/berita':'/artikel'):(cityPage||geoProvince||geoLocality)?'/wilayah':path.startsWith('/jasa/')?'/jasa':path.startsWith('/portfolio/')?'/portfolio':path.startsWith('/merch/')?'/merch':null;
    const crumbs=equivalentPath==='/'?[]:[{name:english?'Home':'Beranda',url:origin+homePath}];
    if(english&&isService)crumbs.push({name:'Services',url:origin+englishHref('/jasa')});
    if(section)crumbs.push({name:pages[section][0],url:origin+section+'/'});
    if(geoLocality)crumbs.push({name:geoLocality.province,url:origin+geoLocality.provincePath+'/'});
    if(equivalentPath!=='/')crumbs.push({name:section?name:pages[path][0],url});
    const breadcrumbId=url+'#breadcrumb';
    const pageType=(['/jasa','/portfolio','/artikel','/berita','/merch','/wilayah'].includes(path)||geoProvince)?'CollectionPage':'WebPage';
    schemas.push({'@context':'https://schema.org','@type':pageType,'@id':url+'#webpage',url,name:title,description:metaDescription,inLanguage:language,isPartOf:{'@id':origin+'/#website'},publisher:{'@id':origin+'/#organization'},...(crumbs.length>1?{breadcrumb:{'@id':breadcrumbId}}:{})});
    if(crumbs.length>1)schemas.push({'@context':'https://schema.org','@type':'BreadcrumbList','@id':breadcrumbId,itemListElement:crumbs.map((crumb,i)=>({'@type':'ListItem',position:i+1,name:crumb.name,item:crumb.url}))});
    if(isService)schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#service',name,description:metaDescription,url,provider:{'@id':origin+'/#organization'},areaServed:{'@type':'Country',name:'Indonesia'},serviceType:name});
    if(cityPage)schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#service',name:'Jasa Pembuatan Website '+cityPage.city,description:metaDescription,url,provider:{'@id':origin+'/#organization'},serviceType:'Website Development',areaServed:{'@type':'City',name:cityPage.city,containedInPlace:{'@type':'AdministrativeArea',name:cityPage.province}}});
    if(geoProvince)schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#service',name:'Jasa Website '+geoProvince.name,description:metaDescription,url,provider:{'@id':origin+'/#organization'},serviceType:'Website Development',areaServed:{'@type':'AdministrativeArea',name:geoProvince.name}});
    if(geoLocality)schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#service',name:'Jasa Website '+geoLocality.city,description:metaDescription,url,provider:{'@id':origin+'/#organization'},serviceType:'Website Development',areaServed:{'@type':'Place',name:geoLocality.city,containedInPlace:{'@type':'AdministrativeArea',name:geoLocality.province}}});
  }
  if(article&&!noindex){
    const words=[article.title,article.summary,...(Array.isArray(article.body)?article.body:[])].join(' ').trim().split(/\s+/).filter(Boolean).length;
    const articleSchema={'@context':'https://schema.org','@type':isNewsArticle(article)?'NewsArticle':'BlogPosting','@id':url+'#article',mainEntityOfPage:{'@id':url+'#webpage'},headline:article.title,description:metaDescription,url,author:article.author_type==='seller'&&article.author_store_name?{'@type':'Organization',name:article.author_store_name}: {'@type':'Organization','@id':origin+'/#organization',name:brand},publisher:{'@id':origin+'/#organization'},inLanguage:'id-ID',articleSection:article.category,wordCount:words};
    if(articleImage)articleSchema.image=[articleImage];
    if(publishedAt)articleSchema.datePublished=publishedAt;
    if(modifiedAt)articleSchema.dateModified=modifiedAt;
    const minutes=Number(String(article.read||'').match(/\d+/)?.[0]||0);
    if(minutes>0)articleSchema.timeRequired='PT'+minutes+'M';
    schemas.push(articleSchema);
  }
  const structured=schemas.map(s=>'<script type="application/ld+json">'+jsonLd(s)+'</script>').join('');
  const canonicalMarkup=noindex?'':'<link rel="canonical" href="'+esc(url)+'"/><link rel="sitemap" type="application/xml" href="'+origin+'/sitemap.xml"/>';
  const alternates=hasEnglishPage(equivalentPath)
    ? '<link rel="alternate" hreflang="id" href="'+origin+(equivalentPath==='/'?'/':equivalentPath+'/')+'"/><link rel="alternate" hreflang="en" href="'+origin+englishHref(equivalentPath)+'"/>'
    : '';
  const articleMeta=article?(publishedAt?'<meta property="article:published_time" content="'+esc(publishedAt)+'"/>':'')+(modifiedAt?'<meta property="article:modified_time" content="'+esc(modifiedAt)+'"/>':''):'';
  const seo=`<title>${esc(title)}</title><meta name="description" content="${esc(metaDescription)}"/><meta name="application-name" content="${brand}"/><meta name="author" content="${brand}"/><meta name="robots" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/><meta name="googlebot" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/>${canonicalMarkup}${alternates}<meta property="og:type" content="${article?'article':'website'}"/><meta property="og:locale" content="${english?'en_US':'id_ID'}"/><meta property="og:site_name" content="${brand}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(metaDescription)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${esc(imageUrl)}"/><meta property="og:image:alt" content="${esc(article?.title||(english?'BisaBikinWeb — professional website development':'Bisabikinweb — jasa pembuatan website profesional'))}"/>${articleMeta}<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(metaDescription)}"/><meta name="twitter:image" content="${esc(imageUrl)}"/>${structured}`;
 const monetized=path==='/'||path==='/artikel'||path==='/berita'||(article&&article.author_type!=='seller');
 const adsense=monetized?'<meta name="google-adsense-account" content="'+adsenseClient+'"/><script async src="'+adsenseScriptUrl+'" crossorigin="anonymous"></script>':'';
 const html=template.replace('<html lang="id">','<html lang="'+locale+'">').replace('<!--SEO-->',seo+adsense).replace('<!--APP-->',render(path,buildData));
 const dir='site-dist'+(path==='/'?'':path);await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',protectHtml(html));
}
await writeFile('site-dist/404.html',protectHtml(template.replace('<!--SEO-->','<title>Halaman Tidak Ditemukan | Bisabikinweb</title><meta name="robots" content="noindex,nofollow"/>').replace('<!--APP-->',render('/404',buildData))));
const legacyNews='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Berita BisaBikinWeb</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://bisabikinweb.site/berita/"><meta http-equiv="refresh" content="0;url=/berita/"></head><body><p>Berita sudah pindah. <a href="/berita/">Buka berita terbaru</a>.</p></body></html>';
await writeFile('site-dist/berita.html',protectHtml(legacyNews));
const coverPart1=await readFile('.article-image-parts/gojogja-cover-1.b64','utf8');
const coverPart2=await readFile('.article-image-parts/gojogja-cover-2.b64','utf8');
const coverBytes=Buffer.from(coverPart1+coverPart2,'base64');
const coverHash=createHash('sha256').update(coverBytes).digest('hex');
if(coverHash!=='1fbaee73e936ba6064cc24c86137184f7ae165be32d7845f5e1c5d06b64ca662')throw new Error('GoJogja collaboration cover integrity check failed');
await writeFile('site-dist/bisabikinweb-gojogja-travel-collaboration.webp',coverBytes);
await writeFile('site-dist/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n${freshNewsArticles.length?`Sitemap: ${origin}/news-sitemap.xml\n`:''}`);
const excludedRoutes=new Set(['/cart','/checkout','/payment','/track-order','/seller','/account','/layanan-digital']);
const sitemapEntries=Object.keys(pages).filter(path=>!excludedRoutes.has(path)&&!localityByPath[path]&&!path.startsWith('/admin')&&!path.startsWith('/seller/')).map(path=>{
 const article=articleByPath.get(path);
 const loc=origin+(path==='/'?'/':path+'/');
 const lastmod=article?isoDate(article.updated_at||article.published_at)?.slice(0,10):null;
 return `  <url><loc>${esc(loc)}</loc>${lastmod?'<lastmod>'+lastmod+'</lastmod>':''}</url>`;
});
await writeFile('site-dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemapEntries.join('\n')+'\n</urlset>\n');
// Avoid exposing an empty News sitemap. Google's parser can report missing <url> tags.
// A future hourly build will recreate and advertise this file when genuine fresh news exists.
if(freshNewsArticles.length){
  await writeFile('site-dist/news-sitemap.xml',makeNewsSitemap(freshNewsArticles,{origin,publicationName:brand}));
}else{
  console.log('No editorial news in the past 48 hours; News Sitemap omitted.');
}
// Auto Artikel dashboard: public, read-only editorial metadata generated on every deploy.
await mkdir('site-dist/auto-artikel',{recursive:true});
const publicEditorial=buildArticles.filter(article=>article.author_type!=='seller').map(article=>{
 const body=Array.isArray(article.body)?article.body:[];
 return {
  slug:String(article.id||''),title:String(article.title||''),category:String(article.category||''),
  publishedAt:article.published_at||null,updatedAt:article.updated_at||null,
  image:String(article.image||article.cover_image_url||''),news:isNewsArticle(article),
  sourceRecorded:body.some(line=>/sumber gambar asli\s*:/i.test(String(line)))
 };
}).filter(article=>/^[a-z0-9][a-z0-9_-]{0,159}$/.test(article.slug)&&article.title);
await writeFile('site-dist/auto-artikel/content.json',JSON.stringify({schema:1,generatedAt:new Date().toISOString(),source:'GitHub Pages editorial build',targetDaily:20,articles:publicEditorial},null,2));
// Strict site CSP with a narrowly-scoped read-only connection to the public GitHub API.
const monitorHtml=protectHtml(await readFile('site-dist/auto-artikel/index.html','utf8'));
const monitorGithubApi=monitorHtml.replace('connect-src \'self\' https://kdlrobdzlxpjlkxbvzsd.supabase.co','connect-src \'self\' https://kdlrobdzlxpjlkxbvzsd.supabase.co https://api.github.com');
if(monitorGithubApi===monitorHtml)throw new Error('Auto Artikel CSP connection rule not found');
await writeFile('site-dist/auto-artikel/index.html',monitorGithubApi);

await writeFile('site-dist/ads.txt','google.com, pub-9568884120945028, DIRECT, f08c47fec0942fa0\n');
await writeFile('site-dist/.nojekyll','');await writeFile('site-dist/CNAME','bisabikinweb.site\n');
// Apply the same security policy to the retained standalone invitation demo.
const invitationPath='site-dist/undangan-jawa-tengah/index.html';
const invitationHtml=protectHtml(await readFile(invitationPath,'utf8'))
  .replace("style-src 'self' 'unsafe-inline'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
  .replace("font-src 'self' data:","font-src 'self' data: https://fonts.gstatic.com");
await writeFile(invitationPath,invitationHtml);
console.log('Prerendered',Object.keys(pages).length,'pages with SEO metadata and structured data, including',buildArticles.length,'published articles.');