import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const kind = process.argv[2];
if (!['media','shop'].includes(kind)) throw new Error('Gunakan: node scripts/build-subdomain.mjs media|shop');
const root = process.cwd();
const source = resolve(root,process.env.BBWEB_SITE_DIST||'site-dist');
const target = resolve(root,process.env.BBWEB_OUTPUT_DIST||kind+'-dist');
const local = join(root,'subdomains',kind);
if (source === target || target === local) throw new Error('Output harus terpisah dari folder sumber.');
await access(join(source,'index.html'));
await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});

async function copyFromBuild(entry,required=true){
  const from=join(source,entry);
  try{await access(from);}
  catch{if(required)throw new Error('Build belum memuat: '+entry);return;}
  await cp(from,join(target,entry),{recursive:true});
}
for(const entry of ['assets','brand','favicon.ico','favicon.svg','apple-touch-icon.png','og.svg']){
  await copyFromBuild(entry,entry==='assets');
}
if(kind==='media'){
  for(const entry of ['artikel','berita','redaksi'])await copyFromBuild(entry);
  // Editor dan SEO lama tetap di website utama sampai cutover resmi.
  const robots='User-agent: *\nAllow: /\n';
  await writeFile(join(target,'robots.txt'),robots);
}else{
  for(const entry of ['merch','cart','checkout','track-order','account'])await copyFromBuild(entry);
  // Toko seller dinamis memakai React client pada URL /toko/:slug.
  await copyFromBuild('index.html');
  await cp(join(source,'index.html'),join(target,'_spa.html'));
  // Halaman preview memberi noindex pada HTML; robots tidak boleh memblokir crawler membacanya.
  await writeFile(join(target,'robots.txt'),'User-agent: *\nAllow: /\n');
}
for(const entry of ['index.html','404.html','_headers','_redirects']){
  await cp(join(local,entry),join(target,entry));
}
// Jangan pernah menyalin domain CNAME utama, sitemap utama, serta halaman admin.
for(const forbidden of ['CNAME','sitemap.xml','news-sitemap.xml','admin','seller','auto-artikel']){
  const contents=await readdir(target);
  if(contents.includes(forbidden))throw new Error('Output subdomain memiliki file terlarang: '+forbidden);
}
// Inject conservative noindex across secondary origins until SEO cutover is verified.
// Do not alter their original canonical URLs (all stay on the main domain).
async function prepareHtml(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=join(directory,entry.name);
    if(entry.isDirectory()){await prepareHtml(file);continue;}
    if(!entry.isFile()||!entry.name.endsWith('.html'))continue;
    let html=await readFile(file,'utf8');
    html=html.replace(/<meta\s+name="robots"[^>]*>/gi,'');
    html=html.replace(/<meta\s+name="googlebot"[^>]*>/gi,'');
    html=html.replace(/<head([^>]*)>/i,'<head$1><meta name="robots" content="noindex,nofollow"><meta name="googlebot" content="noindex,nofollow">');
    html=html.replace(/<\/body>/i,'<script src="/subdomain-navigation.js" defer></script></body>');
    await writeFile(file,html);
  }
}
await cp(join(root,'subdomains/navigation.js'),join(target,'subdomain-navigation.js'));
await prepareHtml(target);
console.log('Subdomain '+kind+' -> '+target);
