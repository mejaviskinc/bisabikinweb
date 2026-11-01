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
  const robots='User-agent: *\nDisallow: /\n';
  await writeFile(join(target,'robots.txt'),robots);
}else{
  for(const entry of ['merch','cart','checkout','track-order','account'])await copyFromBuild(entry);
  // Toko seller dinamis memakai React client pada URL /toko/:slug.
  await copyFromBuild('index.html');
  await cp(join(source,'index.html'),join(target,'_spa.html'));
  // Mencegah crawler mengindeks checkout atau toko sebelum payment + CORS diverifikasi.
  await writeFile(join(target,'robots.txt'),'User-agent: *\nDisallow: /\n');
}
for(const entry of ['index.html','404.html','_headers','_redirects']){
  await cp(join(local,entry),join(target,entry));
}
// Jangan pernah menyalin domain CNAME utama, sitemap utama, serta halaman admin.
for(const forbidden of ['CNAME','sitemap.xml','news-sitemap.xml','admin','seller','auto-artikel']){
  const contents=await readdir(target);
  if(contents.includes(forbidden))throw new Error('Output subdomain memiliki file terlarang: '+forbidden);
}
console.log('Subdomain '+kind+' -> '+target);
