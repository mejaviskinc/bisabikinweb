import {createHash} from 'node:crypto';
import {build} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const configFile=new URL('./vite.pages.mjs',import.meta.url).pathname;
await build({configFile});
await build({configFile,publicDir:false,build:{ssr:'render.tsx',outDir:'../.pages-ssr',emptyOutDir:true}});
const {render,defaults}=await import('./.pages-ssr/render.js');
const origin='https://bisabikinweb.site';
const brand='Bisabikinweb';
const logo=origin+'/brand/bisabikinweb-logo-compact.svg';
const phone='+62882003740969';
const email='bisabikinw3b@gmail.com';
const pages={
  '/':['Jasa Pembuatan Website Jogja untuk Bisnis & UMKM','Bisabikinweb adalah jasa pembuatan website di Yogyakarta untuk UMKM, bisnis, personal brand, toko online, dan perusahaan di seluruh Indonesia. Website modern, cepat, mobile-friendly, dan siap SEO.'],
  '/jasa':['Jasa Pembuatan Website Jogja & Indonesia','Jasa pembuatan website profesional di Yogyakarta untuk landing page, company profile, toko online, portfolio, dan web application. Melayani bisnis di Jogja dan seluruh Indonesia.'],
  '/harga':['Harga Jasa Pembuatan Website','Lihat paket dan harga jasa pembuatan website Bisabikinweb mulai Rp800 ribuan untuk landing page, company profile, toko online, dan kebutuhan website bisnis.'],
  '/portfolio':['Portfolio Jasa Pembuatan Website','Lihat portfolio website Bisabikinweb untuk Berbeda, Karpenter Indonesia, Mejavi Skin+, serta project bisnis lainnya.'],
  '/merch':['Merch Bisabikinweb','Jelajahi konsep koleksi merch Bisabikinweb. Produk segera hadir.'],
  '/tentang':['Tentang Bisabikinweb — Web Studio Yogyakarta','Kenali Bisabikinweb, studio pembuatan website untuk bisnis dan UMKM di Yogyakarta yang melayani project dari seluruh Indonesia.'],
  '/kontak':['Konsultasi Jasa Website','Konsultasikan pembuatan website bisnis dengan Bisabikinweb melalui WhatsApp 0882003740969 atau email bisabikinw3b@gmail.com.'],
  '/artikel':['Artikel Website & Bisnis Digital','Panduan SEO, website bisnis, desain web, dan strategi digital dari Bisabikinweb.'],
  '/privacy':['Kebijakan Privasi','Informasi penggunaan data Bisabikinweb.'],
  '/terms':['Syarat & Ketentuan','Ketentuan layanan Bisabikinweb.'],
  '/refund':['Kebijakan Pengembalian','Ketentuan pengembalian Bisabikinweb.'],
  '/shipping':['Informasi Pengiriman','Informasi pengiriman merch Bisabikinweb.'],
  '/cart':['Keranjang','Tinjau wishlist dan produk Anda.'],
  '/admin':['Admin Bisabikinweb','Panel admin Bisabikinweb untuk lead, portfolio, dan pengaturan website.']
};
for(const [kind,prefix] of [['services','jasa'],['portfolio','portfolio'],['products','merch'],['articles','artikel']])for(const p of defaults[kind])pages['/'+prefix+'/'+p.id]=[p.title||p.name,p.summary||p.description];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonLd=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const organization={
  '@context':'https://schema.org',
  '@type':'Organization',
  '@id':origin+'/#organization',
  name:brand,
  url:origin+'/',
  logo:{'@type':'ImageObject',url:logo},
  image:logo,
  email,
  telephone:phone,
  description:'Jasa pembuatan website profesional untuk UMKM, bisnis, personal brand, toko online, dan perusahaan.',
  contactPoint:{'@type':'ContactPoint',telephone:phone,email,contactType:'customer service',areaServed:'ID',availableLanguage:['id','en']}
};
const website={
  '@context':'https://schema.org',
  '@type':'WebSite',
  '@id':origin+'/#website',
  url:origin+'/',
  name:brand,
  alternateName:'Bisa Bikin Web',
  inLanguage:'id-ID',
  publisher:{'@id':origin+'/#organization'}
};
function protectHtml(html){
 const hashes=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m=>m[1].trim()).map(m=>"'sha256-"+createHash('sha256').update(m[1]).digest('base64')+"'");
 const policy=["default-src 'none'","base-uri 'none'","object-src 'none'","script-src 'self' "+hashes.join(' '),"script-src-attr 'none'","style-src 'self' 'unsafe-inline'","img-src 'self' data:","font-src 'self' data:","connect-src 'self' https://iyhwephcrxeqwiemhppw.supabase.co","frame-src https://berbeda.co.id https://www.berbeda.co.id https://karpenter.co.id https://www.karpenter.co.id https://mejaviskincare.co.id https://www.mejaviskincare.co.id","media-src 'self'","form-action 'none'","upgrade-insecure-requests"].join('; ');
 return html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"/><meta name="referrer" content="no-referrer"/>');
}
const template=await readFile('site-dist/index.html','utf8');
for(const [path,[name,description]] of Object.entries(pages)){
 const title=name+' | '+brand,url=origin+(path==='/'?'/':path+'/');
 const isService=path==='/'||path==='/jasa'||path==='/harga'||path.startsWith('/jasa/');
 const noindex=path==='/cart'||path==='/admin';
 const schemas=[organization,website];
 if(isService)schemas.push({
   '@context':'https://schema.org',
   '@type':'Service',
   '@id':url+'#service',
   name:path==='/'?'Jasa Pembuatan Website':name,
   description,
   url,
   provider:{'@id':origin+'/#organization'},
   areaServed:[{'@type':'City','name':'Yogyakarta'},{'@type':'Country','name':'Indonesia'}],
   serviceType:'Website development and web design'
 });
 const structured=schemas.map(s=>'<script type="application/ld+json">'+jsonLd(s)+'</script>').join('');
 const seo=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta name="application-name" content="${brand}"/><meta name="author" content="${brand}"/><meta name="robots" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/><meta name="googlebot" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"/><link rel="canonical" href="${url}"/><link rel="sitemap" type="application/xml" href="${origin}/sitemap.xml"/><meta property="og:type" content="website"/><meta property="og:locale" content="id_ID"/><meta property="og:site_name" content="${brand}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${origin}/og.svg"/><meta property="og:image:alt" content="Bisabikinweb — jasa pembuatan website profesional"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(description)}"/><meta name="twitter:image" content="${origin}/og.svg"/>${structured}`;
 const html=template.replace('<!--SEO-->',seo).replace('<!--APP-->',render(path));
 const dir='site-dist'+(path==='/'?'':path);await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',protectHtml(html));
}
for(const path of ['account','checkout','track-order']){const target='https://bisabikinweb-studio.bisabikinw3b.chatgpt.site/'+path;await mkdir('site-dist/'+path,{recursive:true});await writeFile('site-dist/'+path+'/index.html',protectHtml(`<!doctype html><html lang="id"><head><meta name="robots" content="noindex,nofollow"/><meta http-equiv="refresh" content="0;url=${target}"/><title>Bisabikinweb</title></head><body><p>Membuka layanan Bisabikinweb. <a href="${target}">Lanjutkan</a></p></body></html>`))}
await writeFile('site-dist/404.html',protectHtml(template.replace('<!--SEO-->','<title>Halaman Tidak Ditemukan | Bisabikinweb</title><meta name="robots" content="noindex,nofollow"/>').replace('<!--APP-->',render('/404'))));
await writeFile('site-dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /account/\nDisallow: /checkout/\nDisallow: /track-order/\nDisallow: /cart/\n\nSitemap: ${origin}/sitemap.xml\n`);
const lastmod=new Date().toISOString().slice(0,10);
await writeFile('site-dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+Object.keys(pages).filter(x=>x!='/cart'&&x!='/admin').map(x=>`  <url><loc>${origin}${x==='/'?'/':x+'/'}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')+'\n</urlset>\n');
await writeFile('site-dist/.nojekyll','');await writeFile('site-dist/CNAME','bisabikinweb.site\n');
console.log('Prerendered',Object.keys(pages).length,'pages with SEO metadata and structured data.');
