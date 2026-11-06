# Arsitektur SEO BisaBikinWeb

## Domain kanonis

**Semua URL publik yang saat ini diindeks tetap menggunakan `https://bisabikinweb.site/`.** Jangan memindahkan artikel, berita, atau transaksi ke subdomain hanya karena subdomain baru sudah berhasil dibuat. Perpindahan URL memerlukan redirect permanen di sisi server, perbaikan canonical + sitemap, update publikasi otomatis, dan validasi Search Console.

| Area | URL kanonis | Tujuan pencarian |
| --- | --- | --- |
| Beranda | `/` | Jasa bikin web profesional di seluruh Indonesia |
| Jasa | `/jasa/` | Pilihan layanan: landing page, company profile, ecommerce, web app |
| Wilayah | `/wilayah/` | Cakupan layanan online di 38 provinsi dan kota/kabupaten utama Indonesia |
| Detail jasa | `/jasa/:slug/` | Kebutuhan spesifik setiap jenis website |
| Harga | `/harga/` | Daftar paket dan transparansi biaya |
| Portofolio | `/portfolio/` | Karya dan pengalaman proyek |
| Detail portofolio | `/portfolio/:slug/` | Studi kasus brand/proyek tertentu |
| Tentang | `/tentang/` | Identitas studio dan cara kerja |
| Kontak | `/kontak/` | Konsultasi dan pengajuan project |
| Artikel | `/artikel/` | Panduan SEO, website, bisnis digital non-berita |
| Berita | `/berita/` | Indeks berita politik, ekonomi, teknologi dan bisnis |
| Detail konten | `/artikel/:slug/` | Satu URL artikel untuk panduan **dan** berita, tidak diduplikasi di /berita/:slug |
| Redaksi | `/redaksi/` | Kebijakan editorial, koreksi, transparansi |
| Merchandise | `/merch/` | Katalog produk |
| Detail merchandise | `/merch/:slug/` | Produk masing-masing |
| Kebijakan | `/privacy/`, `/terms/`, `/refund/`, `/shipping/` | Privasi dan transparansi transaksi |
| Persiapan layanan digital | `/layanan-digital/` | Tetap bisa dibuka namun **noindex** sampai fitur siap |
| Halaman privat/transaksi | `/admin/`, `/seller/`, `/account/`, `/cart/`, `/checkout/`, `/track-order/` | **noindex**, tidak ada di sitemap |

## Pencegahan tumpang tindih

- Judul dan deskripsi masing-masing menu memiliki fokus berbeda. Artikel yang belum memiliki deskripsi mengambil ringkasan dari isi, bukan deskripsi generik yang identik.
- Setiap URL indexable punya satu `rel=canonical` ke diri sendiri, satu `WebPage` atau `CollectionPage`, serta satu jalur `BreadcrumbList` untuk halaman selain beranda.
- JSON-LD dikonsolidasikan pada build SSR, bukan disalin lagi pada React Client.
- `Service` hanya diberikan pada halaman detail jasa, bukan beranda/harga sekaligus.
- Berita dan artikel edukatif dipisah sebagai **daftar** yang berbeda, tetapi URL detail berita tetap `/artikel/:slug/` untuk mencegah kehilangan indeks lama.
- Sitemap hanya memuat URL utama yang indexable, dengan `lastmod` pada artikel ketika benar-benar ada tanggal perubahan (jangan mengesankan semua halaman diperbarui setiap jam).
- `robots.txt` membolehkan crawler membaca tag `noindex`. Tidak boleh memakai `Disallow` untuk menghalangi Google melihat `noindex`.

## Subdomain

- `app.bisabikinweb.site`: dashboard admin/seller; noindex, bukan hasil pencarian.
- `media.bisabikinweb.site`: salinan tampilan artikel/berita dari database dan source utama; **noindex** selama migrasi. Homepage mengarah ke `/artikel/`; tidak menjadi CMS independen.
- `shop.bisabikinweb.site`: salinan toko untuk verifikasi checkout; **noindex** selama migrasi serta integrasi CORS, Auth, dan Midtrans belum diuji.
- Build GitHub Pages subdomain tidak menyertakan sitemap domain utama. Jangan publikasikan sitemap ganda untuk konten yang sama.

## Pengujian

```sh
npm ci
npm test
npm run build
npm run test:output
npm run build:all-subdomains
```

`tests/seo-output.test.mjs` memeriksa title/description tiap menu, canonical, structured data JSON-LD, noindex, dan URL sitemap.

## Tindak lanjut di Google Search Console

1. Periksa properti `https://bisabikinweb.site/` (dan domain property jika tersedia).
2. Kirim `https://bisabikinweb.site/sitemap.xml`.
3. Periksa halaman terindeks: Beranda, Jasa, Harga, Portofolio, Artikel, Berita, dan detail artikel utama.
4. Pantau laporan **Page indexing**: Duplicate without user-selected canonical, Crawled - currently not indexed, Not found (404), serta perangkat dan Core Web Vitals.
5. Jangan mengklaim peringkat/traffic meningkat hanya dari perubahan metadata; ukur impresi, klik, CTR, dan kueri 2–4 minggu setelah Google merayapi ulang.

Rujukan: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls dan https://developers.google.com/search/docs/appearance/title-link

## SEO nasional dan nama daerah

- Homepage menargetkan "jasa bikin web" secara nasional; halaman `/jasa/` fokus kategori layanan.
- Halaman `/wilayah/` menyebut 38 provinsi dan contoh kota/kabupaten; daftar berasal dari `static-source/lib/service-areas.mjs` agar tidak berbeda antara halaman dan pengujian.
- Tidak membuat ratusan halaman kota serupa tanpa studi kasus, testimoni, atau informasi layanan yang benar-benar spesifik. Halaman seperti itu berisiko masuk kebijakan doorway abuse Google.
- Lokasi-lokasi yang tercantum adalah **jangkauan layanan jarak jauh**, bukan lokasi kantor atau cabang yang tidak diverifikasi.
- URL kanonis tetap `https://bisabikinweb.site/`; "BisaBikinWeb.id" adalah identitas brand yang ditampilkan, bukan klaim bahwa domain .id adalah URL kanonis.
