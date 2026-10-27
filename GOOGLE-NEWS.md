# Google News — BisaBikinWeb

Website dibangun sebagai static site GitHub Pages. Build `npm run build` mengambil artikel berstatus `published` dan `is_active=true` dari Supabase `bbweb_articles`. Workflow `.github/workflows/pages.yml` berjalan pada commit dan setiap jam (UTC menit 17), sehingga perubahan konten tidak tampil seketika. Setelah build terpasang, halaman yang dapat dirayapi ada di `/berita/`, `/artikel/<slug>/`, `/news-sitemap.xml`, dan `/sitemap.xml`.

## Cara mengirim berita
1. Masuk ke dashboard `/admin/` → Articles.
2. Tambahkan judul, slug yang stabil, ringkasan, isi orisinal, sumber terverifikasi, dan cover image yang berhak digunakan.
3. Isi kategori `Berita`, `Berita: Ekonomi`, `Berita: Teknologi`, `Berita Politik`, `Politik`, `Ekonomi`, `Nasional`, atau `Internasional`. Kategori edukasi biasa jangan memakai penanda berita. Konten seller tidak pernah masuk sitemap berita.
4. Pilih status `published`, aktifkan tampil di website, kemudian simpan. `published_at` hanya diisi saat pertama kali dipublikasikan, dan dipertahankan pada revisi.
5. Tunggu jadwal build berikutnya atau jalankan workflow Deploy GitHub Pages dari GitHub Actions.

Sitemap berita berisi hanya artikel redaksi yang dipublikasikan dalam 48 jam terakhir. Berita lebih lama tetap muncul di katalog berita dan sitemap reguler. Tanggal harus tanggal penerbitan sebenarnya; jangan mengubahnya hanya untuk memperpanjang masa tampil.

## Google Search Console
Tambahkan properti `https://bisabikinweb.site/`, lalu kirim sitemap `https://bisabikinweb.site/news-sitemap.xml` di menu Sitemaps, setelah deployment. Periksa URL dan laporan indeks. Sitemap memudahkan penemuan, **tidak menjamin** indeks maupun tampil di Google News. Publisher Center tidak menyediakan pendaftaran manual untuk halaman publikasi Google News sejak 2025.

Redaksi dan kontak editorial ada di `/redaksi/`. Untuk kualitas berita, sertakan sumber dalam tulisan, kredensial penulis yang benar, dan prosedur koreksi yang jelas.

## Penanganan Google Search Console: "Tidak ada tag XML"

Jangan mendaftarkan `news-sitemap.xml` sebelum ada berita redaksi terbaru (kurang dari 48 jam) yang layak. Saat belum ada, generator **tidak membuat file News Sitemap** dan `robots.txt` hanya mengiklankan `sitemap.xml`. Ini menghindari sitemap kosong yang oleh sebagian pemroses XML dapat dilaporkan sebagai ketiadaan elemen `<url>`.

Jika sebelumnya sudah didaftarkan, hapus entri `news-sitemap.xml` dari laporan Sitemaps melalui menu tiga titik **Hapus peta situs**; sitemap utama tetap aktif. Ini tidak menghapus artikel. Publikasikan berita aktual yang orisinal, tunggu proses build selesai, periksa keberadaan file beserta tag `<news:news>`, kemudian daftarkan kembali. Jangan salah menggolongkan artikel promosi sebagai berita atau mengubah tanggal publikasi hanya agar sitemap terisi.
