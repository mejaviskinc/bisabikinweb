// Online coverage examples, not addresses or proof of completed local projects.
import {serviceAreaGroups} from './service-areas.mjs';
import {cityLandingPages} from './city-pages.mjs';
import {provinceEditorial,provinceSources} from './geo-editorial.mjs';
import {cityEditorial} from './locality-editorial.mjs';
export const slugify=value=>String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const priorNames=new Set(cityLandingPages.map(city=>city.city));
export const projectTypes=[
 {name:'company profile',audience:'usaha jasa dan perusahaan',benefit:'mengenalkan pengalaman dan layanan secara jelas',deliverable:'profil bisnis, kategori layanan, portofolio, dan formulir penawaran',steps:['Ringkas profil bisnis, layanan utama, dan cara kerja.','Siapkan materi foto serta studi kasus yang memiliki izin.','Bedakan pertanyaan umum dengan formulir permintaan proposal.','Tampilkan CTA konsultasi di halaman penting.'],faq:'Apakah profil perusahaan bisa dikelola sendiri?',answer:'Bisa, melalui pengelolaan konten yang disesuaikan dengan kebutuhan.'},
 {name:'toko online',audience:'pemilik brand dan penjual produk',benefit:'menerima pesanan melalui katalog yang lebih terstruktur',deliverable:'kategori produk, varian, keranjang, dan alur checkout yang disepakati',steps:['Klasifikasikan produk berdasarkan kebutuhan pembeli.','Siapkan foto, ukuran, harga, dan varian secara akurat.','Tentukan pengelolaan stok dan alur konfirmasi pesanan.','Jelaskan pembayaran, pengiriman, dan kebijakan pembatalan.'],faq:'Apakah sistem checkout selalu termasuk?',answer:'Tidak. Fitur pembayaran bergantung paket dan kesiapan integrasi yang disepakati.'},
 {name:'website wisata',audience:'penyedia pengalaman perjalanan dan penginapan',benefit:'memudahkan calon tamu membandingkan fasilitas dan paket',deliverable:'halaman paket, galeri, ketentuan kunjungan, dan formulir booking',steps:['Buat halaman paket terpisah menurut kebutuhan tamu.','Tuliskan fasilitas termasuk dan tidak termasuk.','Tampilkan dokumentasi yang memiliki izin penggunaan.','Tentukan cara konfirmasi jadwal sebelum menerima pembayaran.'],faq:'Bisakah website menampilkan jadwal reservasi?',answer:'Bisa jika alur ketersediaan telah ditentukan dan fitur kalender masuk ruang lingkup.'},
 {name:'katalog B2B',audience:'produsen, grosir, dan distributor',benefit:'menyajikan spesifikasi dan alur permintaan harga yang rapi',deliverable:'kategori produk, detail spesifikasi, dan formulir RFQ',steps:['Susun katalog berdasarkan penggunaan atau jenis produk.','Cantumkan spesifikasi teknis dan dokumen yang valid.','Pisahkan permintaan penawaran dari kontak umum.','Terangkan persyaratan pembelian yang memang berlaku.'],faq:'Haruskah harga grosir tampil terbuka?',answer:'Tidak. Pembeli dapat diarahkan ke formulir permintaan penawaran.'},
 {name:'landing page',audience:'bisnis dengan satu kampanye produk atau layanan',benefit:'mengarahkan pengunjung pada satu tindakan yang jelas',deliverable:'halaman kampanye dengan penjelasan manfaat dan CTA',steps:['Tentukan satu penawaran utama dan audiensnya.','Tuliskan manfaat dan batasan tanpa klaim berlebihan.','Letakkan CTA pada posisi yang mudah ditemukan.','Evaluasi klik dan pertanyaan yang diterima untuk penyempurnaan.'],faq:'Apa beda landing page dengan company profile?',answer:'Landing page fokus pada satu penawaran, sedangkan company profile lebih luas menjelaskan bisnis.'},
 {name:'website kursus',audience:'lembaga pelatihan dan pengajar',benefit:'membantu peserta memahami program dan cara mendaftar',deliverable:'halaman program, materi, jadwal, dan formulir pendaftaran',steps:['Pisahkan program berdasarkan tingkat atau kebutuhan peserta.','Tuliskan materi, format belajar, durasi, dan biaya.','Buat jadwal yang dapat diperbarui pengelola.','Siapkan formulir pendaftaran dengan informasi seperlunya.'],faq:'Bisakah jadwal kelas diperbarui?',answer:'Bisa dengan modul konten yang dapat diakses pengelola.'},
 {name:'website portofolio',audience:'kreator, freelancer, dan studio',benefit:'mempresentasikan karya dan layanan secara terkurasi',deliverable:'galeri proyek, profil, testimoni berizin, dan formulir brief',steps:['Pilih karya yang relevan dengan jenis klien tujuan.','Jelaskan kontribusi dan cakupan setiap proyek bila diizinkan.','Optimalkan gambar untuk pengalaman mobile.','Sediakan formulir brief yang mudah diisi.'],faq:'Apakah foto harus diunggah dengan ukuran besar?',answer:'Tidak. Foto dapat dikompresi agar halaman tetap cepat tanpa menghilangkan konteks karya.'},
 {name:'website kuliner',audience:'restoran, kedai, dan katering',benefit:'menjelaskan menu, pemesanan, dan ketentuan layanan',deliverable:'menu digital, profil usaha, informasi operasional, dan kontak',steps:['Kelompokkan menu secara sederhana dan informatif.','Tampilkan harga serta informasi produk yang benar.','Tentukan jalur pemesanan dan konfirmasi.','Jelaskan aturan pengiriman atau pengambilan bila tersedia.'],faq:'Apakah menu bisa diubah tanpa coding?',answer:'Bisa dengan sistem manajemen menu bila masuk paket website.'},
 {name:'website kontraktor',audience:'penyedia pekerjaan teknis dan layanan proyek',benefit:'menjelaskan ruang lingkup pekerjaan kepada calon klien',deliverable:'profil kompetensi, layanan, studi kasus berizin, dan form konsultasi',steps:['Pisahkan layanan berdasarkan jenis pekerjaan.','Tampilkan bukti kerja yang telah disetujui pemiliknya.','Gunakan sertifikat hanya jika valid dan boleh dipublikasikan.','Sediakan formulir kebutuhan proyek untuk estimasi awal.'],faq:'Bolehkah sertifikat perusahaan dimuat?',answer:'Bisa jika dokumen valid dan tidak memuat informasi yang harus dirahasiakan.'},
 {name:'website organisasi',audience:'komunitas, yayasan, dan organisasi',benefit:'memudahkan publik memahami program dan kegiatan',deliverable:'profil organisasi, agenda, artikel kegiatan, dan kontak',steps:['Jelaskan tujuan dan program aktif organisasi.','Pisahkan agenda mendatang dan arsip kegiatan.','Pastikan dokumentasi kegiatan memiliki izin.','Tentukan editor yang bertanggung jawab atas pembaruan.'],faq:'Apakah artikel dapat diunggah oleh beberapa pengelola?',answer:'Bisa, dengan hak akses yang dibatasi sesuai peran.'}
];
// Match each province to relevant website types; do not assign SEO topics by iteration order.
const provinceTopicIndexes={
 'Aceh':[3,2,1],'Sumatera Utara':[0,2,7],'Sumatera Barat':[7,1,2],
 'Riau':[0,3,8],'Kepulauan Riau':[3,2,0],'Jambi':[3,1,0],
 'Sumatera Selatan':[7,0,8],'Kepulauan Bangka Belitung':[2,1,7],
 'Bengkulu':[3,2,1],'Lampung':[3,2,7],
 'Jakarta':[0,6,3],'Banten':[8,3,0],'Jawa Barat':[1,3,7],
 'Jawa Tengah':[1,3,2],'Daerah Istimewa Yogyakarta':[2,5,1],'Jawa Timur':[3,5,2],
 'Bali':[2,1,6],'Nusa Tenggara Barat':[2,1,7],'Nusa Tenggara Timur':[2,1,3],
 'Kalimantan Barat':[3,7,0],'Kalimantan Tengah':[0,2,3],'Kalimantan Selatan':[3,1,0],
 'Kalimantan Timur':[0,3,8],'Kalimantan Utara':[3,0,2],
 'Sulawesi Utara':[2,7,3],'Gorontalo':[1,7,5],'Sulawesi Tengah':[3,0,7],
 'Sulawesi Barat':[3,1,0],'Sulawesi Selatan':[0,3,2],'Sulawesi Tenggara':[2,3,0],
 'Maluku':[2,3,1],'Maluku Utara':[2,3,1],
 'Papua':[0,2,9],'Papua Barat':[3,2,0],'Papua Barat Daya':[2,0,3],
 'Papua Selatan':[3,0,9],'Papua Tengah':[8,0,2],'Papua Pegunungan':[9,1,0]
};
// These pages have both a hand-written specific scenario and a verified BPS
// publication for regional context. Other city drafts remain navigable but noindex.
export const indexableLocalityNames=new Set([
 'Cirebon','Karawang','Surakarta (Solo)','Pekalongan','Badung','Ubud','Gianyar',
 'Samarinda','Bontang','Maros','Parepare','Bulukumba','Sentani','Biak'
]);
const provinceFocus=name=>{
 const data=provinceEditorial[name],ids=provinceTopicIndexes[name];
 if(!data||!ids||ids.length!==3)throw new Error('Missing province editorial review: '+name);
 return {data,topics:ids.map(id=>projectTypes[id])};
};
export const provincePages=serviceAreaGroups.flatMap((group,g)=>group.provinces.map((province,i)=>{
 const {data,topics}=provinceFocus(province.name);
 return {
 slug:slugify(province.name),name:province.name,group:group.region,locations:province.places,
 path:'/wilayah/provinsi/'+slugify(province.name),
 topic:topics[0],topics,editorial:data,source:provinceSources[province.name]||null,
 layoutVariant:(g+i)%4,
 title:'Jasa Website '+province.name+' | BisaBikinWeb.id',
 description:'Panduan website untuk '+province.name+': '+data.focus+'. Contoh fitur dan konsultasi pembuatan website secara online.'
 };
}));
export const provinceBySlug=Object.fromEntries(provincePages.map(item=>[item.slug,item]));
export const localityPages=serviceAreaGroups.flatMap(group=>group.provinces.flatMap(province=>
 province.places.filter(city=>!priorNames.has(city)).map((city,i)=>{
 const brief=cityEditorial[city],parent=provinceFocus(province.name);
 if(!brief||!brief.scenario||brief.assets.length<3)throw new Error('Missing unique locality brief for '+city);
 const primary=projectTypes[brief.topicIndex];
 const secondary=parent.topics.find(t=>t.name!==primary.name)||projectTypes[0];
 return {
 city,slug:slugify(city),province:province.name,provinceSlug:slugify(province.name),group:group.region,
 path:'/wilayah/provinsi/'+slugify(province.name)+'/'+slugify(city),
 provincePath:'/wilayah/provinsi/'+slugify(province.name),
 neighbors:province.places.filter(other=>other!==city).slice(0,5),
 topic:primary,secondary,editorial:brief,provinceEditorial:parent.data,
 source:provinceSources[province.name]||null,
 indexReady:indexableLocalityNames.has(city)&&Boolean(provinceSources[province.name]),
 layoutVariant:brief.topicIndex%4,
 title:'Jasa Bikin Website '+city+' | BisaBikinWeb.id',
 description:'Jasa website '+city+': '+brief.scenario+' Konsultasi dan pengerjaan website dilakukan secara online.'
 };
 })));
export const localityByPath=Object.fromEntries(localityPages.map(item=>[item.path,item]));
export const placeLink=(city,province)=>{const priority=cityLandingPages.find(item=>item.city===city);return priority?'/wilayah/'+priority.slug+'/':'/wilayah/provinsi/'+slugify(province)+'/'+slugify(city)+'/';};
