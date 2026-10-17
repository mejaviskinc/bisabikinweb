import {build} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const configFile=new URL('./vite.pages.mjs',import.meta.url).pathname;
await build({configFile});
await build({configFile,publicDir:false,build:{ssr:'render.tsx',outDir:'../.pages-ssr',emptyOutDir:true}});
const {render,defaults}=await import('./.pages-ssr/render.js');
const origin='https://bisabikinweb.site';
const pages={'/':['Jasa Pembuatan Website untuk Bisnis & UMKM','Bisabikinweb membantu bisnis dan UMKM membuat landing page, company profile, dan toko online. Lihat portfolio dan konsultasikan kebutuhan website Anda.'],'/jasa':['Jasa Website','Layanan landing page, company profile, toko online, dan aplikasi web.'],'/harga':['Harga & Paket Website','Bandingkan paket website Bisabikinweb mulai Rp800.000 dan hitung estimasi kebutuhan bisnis Anda.'],'/portfolio':['Portfolio Website','Lihat portfolio Berbeda, Karpenter Indonesia, dan Mejavi Skin+.'],'/merch':['Merch Bisabikinweb','Jelajahi konsep koleksi merch Bisabikinweb. Produk segera hadir.'],'/tentang':['Tentang Bisabikinweb','Kenali studio Bisabikinweb untuk website bisnis dan UMKM.'],'/kontak':['Konsultasi Website','Hubungi Bisabikinweb melalui WhatsApp 0882003740969 atau bisabikinw3b@gmail.com.'],'/artikel':['Artikel & Insights','Panduan website dan bisnis digital dari Bisabikinweb.'],'/privacy':['Kebijakan Privasi','Informasi penggunaan data Bisabikinweb.'],'/terms':['Syarat & Ketentuan','Ketentuan layanan Bisabikinweb.'],'/refund':['Kebijakan Pengembalian','Ketentuan pengembalian Bisabikinweb.'],'/shipping':['Informasi Pengiriman','Informasi pengiriman merch Bisabikinweb.'],'/cart':['Keranjang','Tinjau wishlist dan produk Anda.']};
for(const [kind,prefix] of [['services','jasa'],['portfolio','portfolio'],['products','merch'],['articles','artikel']])for(const p of defaults[kind])pages['/'+prefix+'/'+p.id]=[p.title||p.name,p.summary||p.description];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template=await readFile('site-dist/index.html','utf8');
for(const [path,[name,description]] of Object.entries(pages)){
 const title=name+' | Bisabikinweb',url=origin+(path==='/'?'/':path+'/');
 const seo=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><link rel="canonical" href="${url}"/><meta name="robots" content="${path==='/cart'?'noindex,nofollow':'index,follow'}"/><meta property="og:type" content="website"/><meta property="og:locale" content="id_ID"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${origin}/og.svg"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(description)}"/>`;
 const html=template.replace('<!--SEO-->',seo).replace('<!--APP-->',render(path));
 const dir='site-dist'+(path==='/'?'':path);await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);
}
for(const path of ['admin','account','checkout','track-order']){const target='https://bisabikinweb-studio.bisabikinw3b.chatgpt.site/'+path;await mkdir('site-dist/'+path,{recursive:true});await writeFile('site-dist/'+path+'/index.html',`<!doctype html><html lang="id"><head><meta name="robots" content="noindex,nofollow"/><meta http-equiv="refresh" content="0;url=${target}"/><title>Bisabikinweb</title></head><body><p>Membuka layanan Bisabikinweb. <a href="${target}">Lanjutkan</a></p></body></html>`)}
await writeFile('site-dist/404.html',template.replace('<!--SEO-->','<title>Halaman Tidak Ditemukan | Bisabikinweb</title><meta name="robots" content="noindex"/>').replace('<!--APP-->',render('/404')));
await writeFile('site-dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /account/\nDisallow: /checkout/\nDisallow: /track-order/\nDisallow: /cart/\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('site-dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(pages).filter(x=>x!='/cart').map(x=>'<url><loc>'+origin+(x==='/'?'/':x+'/')+'</loc></url>').join('')+'</urlset>');
await writeFile('site-dist/.nojekyll','');await writeFile('site-dist/CNAME','bisabikinweb.site\n');
console.log('Prerendered',Object.keys(pages).length,'pages.');
