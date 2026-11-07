# Audit konten SEO wilayah — BisaBikinWeb
Tanggal pembaruan: 7 November 2026

## Apa yang telah diperbaiki
- Sebelumnya halaman wilayah memilih jenis website menggunakan rumus aritmetika berdasarkan urutan wilayah. Pendekatan tersebut tidak mempertimbangkan kebutuhan bisnis tempat tertentu.
- Sekarang tersedia konteks editorial berbeda untuk seluruh **38 provinsi**, dan brief praktis untuk **189 kota/kawasan** pada direktori. Sebanyak 16 kota prioritas telah memiliki halaman sendiri, dan **174 kota/kawasan tambahan** memakai brief baru tersebut.
- Brief kota mencakup satu skenario calon pelanggan, jenis website, serta minimal tiga materi bisnis yang perlu disiapkan. Ini contoh ilustratif untuk membantu perencanaan, bukan survei prevalensi industri, daftar cabang, atau bukti pekerjaan lokal.
- Halaman provinsi menampilkan fokus, konteks, perjalanan calon pelanggan, keputusan desain, dan tautan ke wilayah terkait.
- Empat penanganan visual berbasis layout dipakai pada panel editorial wilayah agar tampil lebih beragam tanpa mengganti identitas utama BisaBikinWeb.
- Deskripsi meta lokal menggunakan skenario yang ditulis khusus untuk kota tersebut.
- Pengujian integritas mengharuskan seluruh 38 provinsi dan 189 kota memiliki data lengkap, tidak berulang.

## Kebijakan pengindeksan
- 38 halaman provinsi dan 16 halaman kota prioritas tetap diizinkan diindeks.
- **14 halaman kota tambahan** dengan skenario tersendiri dan tautan publikasi BPS tingkat provinsi kini diizinkan diindeks serta disertakan dalam sitemap hasil build.
- **160 halaman kota tambahan** tetap `noindex` sampai studi kasus, data wilayah, atau manfaat spesifik halamannya semakin siap diperiksa.
- **600 halaman direktori keyword** masih `noindex`. Rancangan visual berbeda tidak otomatis menjadikan halaman duplikatif layak masuk indeks. Konten ini perlu peninjauan editorial berdasarkan niat pencarian yang berbeda dan bukti layanan nyata.

Ke-14 halaman kota tambahan adalah: Cirebon, Karawang, Surakarta (Solo), Pekalongan, Badung, Ubud, Gianyar, Samarinda, Bontang, Maros, Parepare, Bulukumba, Sentani, dan Biak.

## Sumber wilayah yang telah ditautkan
BPS \"Dalam Angka 2026\" dipakai sebagai rujukan latar regional, bukan klaim bahwa kategori bisnis tertentu mendominasi kota atau bahwa BisaBikinWeb telah melayani pelanggan di sana.
- Jawa Barat: https://jabar.bps.go.id/id/publication/2026/02/27/2f027354da10870634aa1648/jawa-barat-province-in-figures-2026.html
- Jawa Tengah: https://jateng.bps.go.id/id/publication/2026/02/27/c15d76de2a762acd2303c346/jawa-tengah-province-in-figures-2026.html
- Bali: https://bali.bps.go.id/id/publication/2026/02/27/b7ef0fae187792c2500000ad/provinsi-bali-dalam-angka-2026.html
- Kalimantan Timur: https://kaltim.bps.go.id/id/publication/2026/02/27/04aee2d8df20c43097e76658/provinsi-kalimantan-timur-dalam-angka-2026.html
- Sulawesi Selatan: https://sulsel.bps.go.id/id/publication/2026/02/27/fa1adde42bea0a82c4e86dcb/sulawesi-selatan-province-in-figures-2026.html
- Papua: https://papua.bps.go.id/id/publication/2026/02/27/ac12875807a8c65468227dfe/provinsi-papua-dalam-angka-2026.html

## Pengujian sebelum rilis
Jalankan `npm test` lalu `npm run build && npm run test:output`. GitHub Actions pada branch `main` menjalankan perintah tersebut saat deploy. Status workflow dan akses situs publik harus diverifikasi terpisah; commit pada repository tidak dengan sendirinya membuktikan deploy berhasil.

## Kegiatan berikutnya
1. Periksa GitHub Actions terkini dan akses `/sitemap.xml` pada domain publik.
2. Audit lima sampai sepuluh contoh halaman kota aktif menggunakan penilaian manusia dan sumber lokal yang nyata.
3. Tambahkan sumber primer (BPS kabupaten/kota, instansi lokal, dokumen klien berizin) pada kandidat halaman berikutnya.
4. Prioritaskan kejelasan layanan nasional dan portofolio asli, bukan halaman daerah yang hanya mengarahkan ke formulir konsultasi.
5. Lihat laporan pengindeksan Search Console setelah sitemap publik dapat diambil; tidak ada jaminan indeks atau peringkat.
