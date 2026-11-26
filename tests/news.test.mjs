import test from 'node:test';
import assert from 'node:assert/strict';
import {isNewsArticle,isFreshNewsArticle,getFreshNewsArticles,makeNewsSitemap} from '../static-source/lib/news.mjs';
import {assessEditorialQuality} from '../static-source/lib/editorial-quality.mjs';

const now=Date.parse('2026-10-27T12:00:00Z');
const news={id:'contoh-kabar',title:'Kabar ekonomi & bisnis <Indonesia>',category:'Berita: Ekonomi',author_type:'editorial',published_at:'2026-10-27T10:00:00Z'};
test('berita redaksi dan kategori berita diidentifikasi dengan tepat',()=>{
  assert.equal(isNewsArticle(news),true);
  assert.equal(isNewsArticle({...news,category:'Website Bisnis'}),false);
  assert.equal(isNewsArticle({...news,author_type:'seller'}),false);
});
test('hanya berita terbit 48 jam terakhir yang masuk sitemap',()=>{
  assert.equal(isFreshNewsArticle(news,now),true);
  assert.equal(isFreshNewsArticle({...news,published_at:'2026-10-24T10:00:00Z'},now),false);
  assert.equal(isFreshNewsArticle({...news,published_at:'2026-10-28T10:00:00Z'},now),false);
  assert.equal(isFreshNewsArticle({...news,published_at:null},now),false);
});
test('format sitemap news aman dan tidak memuat seller atau artikel edukasi',()=>{
 const xml=makeNewsSitemap([news,{...news,id:'seller',author_type:'seller'},{...news,id:'panduan',category:'SEO'},{...news,id:'lama',published_at:'2026-10-22T10:00:00Z'}],{origin:'https://bisabikinweb.site',now});
 assert.match(xml,/xmlns:news="http:\/\/www.google.com\/schemas\/sitemap-news\/0.9"/);
 assert.match(xml,/<news:language>id<\/news:language>/);
 assert.match(xml,/2026-10-27T10:00:00.000Z/);
 assert.match(xml,/Kabar ekonomi &amp; bisnis &lt;Indonesia&gt;/);
 assert.match(xml,/https:\/\/bisabikinweb.site\/artikel\/contoh-kabar\//);
 assert.doesNotMatch(xml,/seller|panduan|lama/);
});

test('only eligible news articles cause a News Sitemap to be published',()=>{
 const nonNews={id:'seo',title:'Jasa pembuatan website',category:'Bisnis dan Teknologi',published_at:'2026-10-27T10:00:00Z'};
 assert.equal(getFreshNewsArticles([nonNews],now).length,0);
 assert.equal(getFreshNewsArticles([news,nonNews],now).length,1);
 assert.equal(getFreshNewsArticles([{...news,published_at:'2026-10-24T10:00:00Z'}],now).length,0);
});

const meaningfulParagraphs=[
  "Pemilik usaha perlu menentukan tujuan website sebelum membeli layanan pengembangan. Jika tujuan utamanya menerima pesanan, catat informasi yang diperlukan pelanggan sebelum memesan, metode pembayaran yang tersedia, serta siapa yang akan menindaklanjuti pertanyaan. Pisahkan kebutuhan wajib dari fitur tambahan agar biaya dapat dibandingkan secara wajar. Buat contoh alur pelanggan mulai dari halaman produk hingga konfirmasi pesanan, kemudian bahas bagian yang belum jelas bersama pengembang.",
  "Setelah tujuan ditentukan, siapkan materi yang dibutuhkan untuk setiap halaman. Kumpulkan deskripsi produk, foto yang memiliki izin penggunaan, identitas usaha, dan informasi kontak yang benar. Tentukan siapa yang dapat memperbarui harga dan stok setelah website diluncurkan. Periksa juga apakah biaya domain, hosting, pemeliharaan, dan perubahan desain telah dijelaskan secara terpisah dalam penawaran. Dengan begitu, pemilik usaha dapat memahami kewajiban jangka panjang sebelum menyetujui proyek.",
  "Sebelum menerima hasil pekerjaan, lakukan uji coba melalui perangkat ponsel dan komputer. Coba membuka katalog, mengirim formulir, menggunakan navigasi, serta membaca kebijakan privasi tanpa harus masuk akun. Jika ada transaksi, gunakan lingkungan uji agar pelanggan tidak terkena tagihan nyata. Dokumentasikan masalah yang ditemukan, tentukan penanggung jawab perbaikan, dan lakukan pengujian ulang setelah perubahan diterapkan. Simpan akses administrasi dengan aman untuk menjaga kelangsungan operasional usaha."
];
const reviewedArticle={
  id:'panduan-bisnis-lengkap',
  title:'Panduan menyiapkan website bisnis yang jelas',
  category:'Bisnis',
  summary:'Uraian praktis tentang kebutuhan website, dokumen usaha, alur pesanan dan biaya yang harus dibandingkan.',
  body:meaningfulParagraphs,
  published_at:'2026-11-10T08:00:00+07:00',
  author_type:'editorial'
};
test('artikel dengan penjelasan substantif lolos gerbang indeks awal',()=>{
  const quality=assessEditorialQuality(reviewedArticle,Date.parse('2026-11-20T00:00:00Z'));
  assert.equal(quality.indexReady,true,quality.issues.join(', '));
});
test('berita singkat tetap terbaca tetapi tidak diindeks atau dimonetisasi sebelum revisi',()=>{
  const short={...reviewedArticle,category:'Berita Bisnis',body:[
    'Kegiatan dihadiri pelaku usaha dan pemerintah daerah. Informasi acara tersedia di rilis resmi, tetapi laporan ini belum menyajikan konteks tambahan bagi pembaca.',
    'Pihak penyelenggara mengumumkan langkah dan rencana kerja berikutnya. Detail hasil pelaksanaan belum bisa disimpulkan berdasarkan pengumuman awal.',
    'Pelaku usaha perlu memeriksa persyaratan resmi dan membedakan rencana program dari kegiatan yang telah diselesaikan.',
    'Sumber: https://example.org/siaran-pers'
  ]};
  const quality=assessEditorialQuality(short,Date.parse('2026-11-20T00:00:00Z'));
  assert.equal(quality.indexReady,false);
  assert.ok(quality.issues.some(issue=>issue.includes('terlalu singkat')));
});
test('berita tanpa sumber dan artikel terjadwal belum siap masuk indeks',()=>{
  const newsNoSource={...reviewedArticle,category:'Berita Bisnis'};
  assert.equal(assessEditorialQuality(newsNoSource,Date.parse('2026-11-20T00:00:00Z')).indexReady,false);
  const newsWithSource={...newsNoSource,source_urls:['https://example.org/berita']};
  assert.equal(assessEditorialQuality(newsWithSource,Date.parse('2026-11-20T00:00:00Z')).indexReady,true);
  assert.equal(assessEditorialQuality({...newsWithSource,published_at:'2026-11-25T08:00:00Z'},Date.parse('2026-11-20T00:00:00Z')).indexReady,false);
});
