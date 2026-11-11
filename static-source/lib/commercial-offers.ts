// Public commercial terms for website packages. Keep backend checkout totals authoritative.
export const maintenancePlans=[
 {id:'website-care',name:'Website Care',price:299000,desc:'Pemeliharaan website ringan tiap bulan.',features:['Monitoring dan backup terjadwal','Bantuan dan perubahan kecil maksimal 1 jam/bulan','Tidak termasuk fitur baru atau hosting']},
 {id:'business-care',name:'Business Care',price:699000,desc:'Dukungan operasional untuk website bisnis.',features:['Maintenance, backup, dan pemantauan','Pembaruan konten maksimal 3 jam/bulan','Laporan bulanan ringkas']},
 {id:'seo-growth',name:'SEO Growth',price:1490000,desc:'Peningkatan konten dan SEO secara rutin.',features:['Optimasi hingga 2 URL per bulan','1 artikel SEO original per bulan','Riset keyword dan laporan Search Console']}
] as const;
export const priceAddons=[
 ['Tambahan 1 halaman standar',300000],
 ['Setup CMS sederhana',1500000],
 ['Dashboard khusus',4500000],
 ['Integrasi payment gateway di luar paket',1500000],
 ['Fitur booking sederhana',1500000],
 ['Tambahan 1 bahasa',1000000],
 ['Copywriting per halaman',200000],
 ['Audit SEO satu kali',750000],
 ['Dukungan darurat di luar paket (per jam)',150000]
] as const;
export const commercialRules=[
 'Domain, hosting, lisensi, biaya transaksi gateway, biaya pihak ketiga, dan perpanjangan tidak termasuk harga awal.',
 'Paket standar dibayar penuh melalui checkout DOKU sesuai nominal yang tampil. Untuk proyek dengan termin pembayaran, nilai uang muka dan pelunasan ditentukan dalam penawaran tertulis sebelum pembayaran.',
 'Revisi hanya mencakup ruang lingkup yang sudah disepakati. Fitur, halaman, atau integrasi baru dikenakan biaya tambahan.',
 'Garansi 30 hari berlaku untuk bug dari implementasi awal; tidak mencakup fitur baru, perubahan materi besar, atau gangguan pihak ketiga.',
 'Pengerjaan dimulai setelah materi, akses, dan konfirmasi pembayaran diterima. Estimasi waktu adalah target, bukan tanggal yang dijamin.',
 'Layanan bulanan dibayar di muka. Kuota jam tidak otomatis terakumulasi dan tidak termasuk pekerjaan di luar scope.'
] as const;
