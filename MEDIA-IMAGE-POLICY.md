# Kebijakan gambar Media BisaBikinWeb

Berlaku untuk konten di `media.bisabikinweb.site` yang berasal dari repository utama ini.

## Berita aktual Indonesia

- Gunakan **foto dokumentasi asli** yang relevan dengan peristiwa dan judul, bukan gambar generatif yang diperlakukan sebagai bukti peristiwa.
- Utamakan foto milik lembaga/penyelenggara atau fotografer yang secara jelas mengizinkan penggunaan ulang **di situs bisnis**. Gambar dari detikcom, Kompas, ANTARA, atau media lain **tidak otomatis bebas pakai**.
- Sebelum disalin ke repository atau CMS, pastikan secara spesifik pemilik hak, cakupan izin/lisensi, tanggal akses, URL asli, dan kredit yang diwajibkan. Atribusi saja tidak menggantikan izin.
- Jika foto tidak memiliki izin penggunaan, jangan mengunggah, hotlink, mengakali pembatasan, atau menerbitkan foto itu; cari alternatif legal yang benar-benar cocok atau ganti kandidat beritanya.
- Foto harus cocok dengan peristiwa, tanggal, lokasi, dan tokoh; jangan menampilkan foto peristiwa lain seolah dokumentasi dari berita tersebut.
- Simpan metadata sumber, izin/lisensi dan bukti izin dalam arsip editorial. Tampilkan kredit di bawah gambar atau bagian sumber jika persyaratan lisensi mewajibkan.
- Tidak ada teks `AI` atau `Ilustrasi` yang ditanamkan pada piksel foto.

## Artikel edukasi dan SEO

- Buat gambar orisinal untuk masing-masing judul menggunakan generator gambar yang benar-benar tersedia, bukan menggunakan foto berita tanpa lisensi.
- Gunakan tampilan fotorealistis, spesifik sesuai isi, rasio horizontal, file terkompresi dan alt text yang sesuai.
- Jangan menambahkan tulisan `AI`, `Ilustrasi`, judul, atau watermark pada piksel gambar.
- Rekam asal-usul pembuatan pada metadata editorial dengan jujur. Jangan mengaku gambar hasil generasi sebagai foto kejadian asli.
- Generator `scripts/generate-editorial-covers.mjs` hanya boleh memproses artikel **nonberita**. Perlu API key gambar tersendiri jika workflow GitHub Actions digunakan; jangan membuat klaim sukses jika key/akses tidak tersedia.

## Publikasi dan pemeriksaan

- Jangan ubah judul, isi, atau URL artikel saat memperbarui gambar.
- Pastikan slug unik, URL gambar HTTPS, tidak ada file rusak, dan gambar utama muncul pada kartu, detail, serta metadata SEO jika tersedia.
- Perhatikan bahwa data Supabase dapat mengesampingkan artikel bawaan dan subdomain Media dibangun ulang dari repository utama.
- Catat status faktual secara terpisah: gambar disiapkan, committed, deployed, dan terverifikasi live.
