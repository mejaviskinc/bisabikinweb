import {createHash} from 'node:crypto';
import {build} from 'vite';
import {isNewsArticle,makeNewsSitemap,getFreshNewsArticles} from './static-source/lib/news.mjs';
import {mergeEditorialPosts} from './static-source/lib/editorial-posts.mjs';
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
  '/':['Jasa Pembuatan Website Jogja untuk Bisnis & UMKM','Bisabikinweb adalah jasa pembuatan website di Yogyakarta untuk UMKM, bisnis, personal brand, toko online, dan perusahaan di seluruh Indonesia. Website modern, cepat, mobile-friendly, dan siap SEO.'],
  '/jasa':['Jasa Pembuatan Website Jogja & Indonesia','Jasa pembuatan website profesional di Yogyakarta untuk landing page, company profile, toko online, portfolio, dan web application. Melayani bisnis di Jogja dan seluruh Indonesia.'],
  '/harga':['Harga Jasa Pembuatan Website','Lihat paket dan harga jasa pembuatan website Bisabikinweb mulai Rp800 ribuan untuk landing page, company profile, toko online, dan kebutuhan website bisnis.'],
  '/portfolio':['Portfolio Jasa Pembuatan Website','Jelajahi portfolio website Bisabikinweb: Berbeda, Karpenter Indonesia, Mejavi Skin+, GoO Ninks, dan GoJogja Travel.'],
  '/layanan-digital':['Layanan Digital — Pulsa, Paket Data, Token & Travel','Kenali rencana layanan digital BisaBikinWeb: pulsa, paket data, token listrik, voucher game, pembayaran tagihan, dan tiket pesawat serta hotel. Segera hadir.'],
  '/merch':['Merch Bisabikinweb','Jelajahi konsep koleksi merch Bisabikinweb. Produk segera hadir.'],
  '/tentang':['Tentang Bisabikinweb — Web Studio Yogyakarta','Kenali Bisabikinweb, studio pembuatan website untuk bisnis dan UMKM di Yogyakarta yang melayani project dari seluruh Indonesia.'],
  '/kontak':['Konsultasi Jasa Website','Konsultasikan pembuatan website bisnis dengan Bisabikinweb melalui WhatsApp 0882003740969 atau email bisabikinw3b@gmail.com.'],
  '/artikel':['Artikel Website & Bisnis Digital','Panduan SEO, website bisnis, desain web, dan strategi digital dari Bisabikinweb.'],
  '/berita':['Berita Terbaru: Politik, Ekonomi, Bisnis & Teknologi','Berita aktual pilihan redaksi BisaBikinWeb tentang ekonomi, politik, nasional, internasional, dan teknologi.'],
  '/redaksi':['Tentang Redaksi dan Kebijakan Berita BisaBikinWeb','Informasi transparansi publikasi berita, koreksi, dan kontak redaksi BisaBikinWeb.'],
  '/privacy':['Kebijakan Privasi','Informasi penggunaan data Bisabikinweb.'],
  '/terms':['Syarat & Ketentuan','Ketentuan layanan Bisabikinweb.'],
  '/refund':['Kebijakan Pengembalian','Ketentuan pengembalian Bisabikinweb.'],
  '/shipping':['Informasi Pengiriman','Informasi pengiriman merch Bisabikinweb.'],
  '/cart':['Keranjang','Tinjau wishlist dan produk Anda.'],
  '/checkout':['Checkout Merchandise','Selesaikan detail pengiriman dan lanjutkan pembayaran merchandise Bisabikinweb.'],
  '/track-order':['Lacak Pesanan Merchandise','Periksa status pembayaran dan pengiriman pesanan Bisabikinweb.'],
  '/account':['Akun Pembeli — BisaBikinWeb','Login pembeli, profil, riwayat pesanan, dan status pembayaran merchandise BisaBikinWeb.'],
  '/admin':['Admin Bisabikinweb','Panel admin Bisabikinweb untuk lead, portfolio, dan pengaturan website.'],
  '/admin/sellers':['Seller Operations — Bisabikinweb','Panel admin untuk menyetujui seller, meninjau produk marketplace, dan mengelola permintaan withdraw.'],
  '/seller':['Seller Dashboard — Bisabikinweb','Dashboard seller untuk mengelola produk, pesanan, saldo penjualan, dan permintaan pencairan.'],
  '/admin/iklan':['Ads Manager Bisabikinweb','Panel admin untuk mengatur iklan homepage Bisabikinweb.'],
  '/admin/payments':['Payment Gateway — BisaBikinWeb','Dashboard transaksi Midtrans, status pembayaran, rekonsiliasi, dan monitoring checkout merchandise.']
};
for(const [kind,prefix] of [['services','jasa'],['portfolio','portfolio'],['products','merch']])for(const p of defaults[kind])pages['/'+prefix+'/'+p.id]=[p.title||p.name,p.summary||p.description];
for(const article of buildArticles)pages['/artikel/'+article.id]=[article.title,article.summary||'Artikel seputar website, bisnis, dan strategi digital.'];
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
 const policy=["default-src 'none'","base-uri 'none'","object-src 'none'","script-src 'self' "+hashes.join(' ')+adScripts,"script-src-attr 'none'","style-src 'self' 'unsafe-inline'","img-src 'self' data: https:","font-src 'self' data:","connect-src 'self' https://iyhwephcrxeqwiemhppw.supabase.co"+adConnections,"frame-src https://berbeda.co.id https://www.berbeda.co.id https://karpenter.co.id https://www.karpenter.co.id https://mejaviskincare.co.id https://www.mejaviskincare.co.id https://gooninks.co.id https://www.gooninks.co.id https://gojogjatravel.web.id https://www.gojogjatravel.web.id"+adFrames,"media-src 'self'","form-action 'none'","upgrade-insecure-requests"].join('; ');
 return html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"/><meta name="referrer" content="no-referrer"/>');
}
const template=await readFile('site-dist/index.html','utf8');
for(const [path,[name,description]] of Object.entries(pages)){
  const article=articleByPath.get(path);
  const title=article?(article.title.length<=55?article.title+' | '+brand:article.title):(path==='/'?brand+' | '+name:name+' | '+brand);
  const url=origin+(path==='/'?'/':path+'/');
  const isService=path==='/'||path==='/jasa'||path==='/harga'||path.startsWith('/jasa/');
  const noindex=path==='/cart'||path==='/checkout'||path==='/track-order'||path==='/account'||path==='/seller'||path.startsWith('/admin');
  const metaDescription=snippet(description);
  const articleImage=safeHttpsUrl(article?.image);
  const imageUrl=articleImage||origin+'/og.svg';
  const publishedAt=isoDate(article?.published_at);
  const modifiedAt=isoDate(article?.updated_at||article?.published_at);
  const schemas=[organization,website];
  if(isService)schemas.push({'@context':'https://schema.org','@type':'Service','@id':url+'#service',name:path==='/'?'Jasa Pembuatan Website':name,description:metaDescription,url,provider:{'@id':origin+'/#organization'},areaServed:[{'@type':'City','name':'Yogyakarta'},{'@type':'Country','name':'Indonesia'}],serviceType:'Website development and web design'});
  if(article){
    const words=[article.title,article.summary,...(Array.isArray(article.body)?article.body:[])].join(' ').trim().split(/\s+/).filter(Boolean).length;
    const articleSchema={'@context':'https://schema.org','@type':isNewsArticle(article)?'NewsArticle':'BlogPosting','@id':url+'#article',mainEntityOfPage:{'@type':'WebPage','@id':url},headline:article.title,description:metaDescription,url,author:article.author_type==='seller'&&article.author_store_name?{'@type':'Organization',name:article.author_store_name}: {'@type':'Organization','@id':origin+'/#organization',name:brand},publisher:{'@id':origin+'/#organization'},inLanguage:'id-ID',articleSection:article.category,wordCount:words};
    if(articleImage)articleSchema.image=[articleImage];
    if(publishedAt)articleSchema.datePublished=publishedAt;
    if(modifiedAt)articleSchema.dateModified=modifiedAt;
    const minutes=Number(String(article.read||'').match(/\d+/)?.[0]||0);
    if(minutes>0)articleSchema.timeRequired='PT'+minutes+'M';
    schemas.push(articleSchema);
  }
  const structured=schemas.map(s=>'<script type="application/ld+json">'+jsonLd(s)+'</script>').join('');
  const articleMeta=article?(publishedAt?'<meta property="article:published_time" content="'+esc(publishedAt)+'"/>':'')+(modifiedAt?'<meta property="article:modified_time" content="'+esc(modifiedAt)+'"/>':''):'';
  const seo=`<title>${esc(title)}</title><meta name="description" content="${esc(metaDescription)}"/><meta name="application-name" content="${brand}"/><meta name="author" content="${brand}"/><meta name="robots" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/><meta name="googlebot" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/><link rel="canonical" href="${url}"/><link rel="sitemap" type="application/xml" href="${origin}/sitemap.xml"/><meta property="og:type" content="${article?'article':'website'}"/><meta property="og:locale" content="id_ID"/><meta property="og:site_name" content="${brand}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(metaDescription)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${esc(imageUrl)}"/><meta property="og:image:alt" content="${esc(article?.title||'Bisabikinweb — jasa pembuatan website profesional')}"/>${articleMeta}<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(metaDescription)}"/><meta name="twitter:image" content="${esc(imageUrl)}"/>${structured}`;
 const monetized=path==='/'||path==='/artikel'||path==='/berita'||(article&&article.author_type!=='seller');
 const adsense=monetized?'<meta name="google-adsense-account" content="'+adsenseClient+'"/><script async src="'+adsenseScriptUrl+'" crossorigin="anonymous"></script>':'';
 const html=template.replace('<!--SEO-->',seo+adsense).replace('<!--APP-->',render(path,buildData));
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
await writeFile('site-dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /seller/\nDisallow: /account/\nDisallow: /checkout/\nDisallow: /track-order/\nDisallow: /cart/\n\nSitemap: ${origin}/sitemap.xml\n${freshNewsArticles.length?`Sitemap: ${origin}/news-sitemap.xml\n`:''}`);
const excludedRoutes=new Set(['/cart','/checkout','/track-order','/seller','/account']);
const sitemapEntries=Object.keys(pages).filter(path=>!excludedRoutes.has(path)&&!path.startsWith('/admin')&&!path.startsWith('/seller/')).map(path=>{
 const article=articleByPath.get(path);
 const loc=origin+(path==='/'?'/':path+'/');
 const lastmod=article?dateOnly(article.updated_at||article.published_at):buildDate;
 return `  <url><loc>${esc(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
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
const monitorGithubApi=monitorHtml.replace('connect-src \'self\' https://iyhwephcrxeqwiemhppw.supabase.co','connect-src \'self\' https://iyhwephcrxeqwiemhppw.supabase.co https://api.github.com');
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