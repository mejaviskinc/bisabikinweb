# Arsitektur SEO BisaBikinWeb

## Domain kanonis

**Semua URL publik yang saat ini diindeks tetap menggunakan `https://bisabikinweb.site/`.** Jangan memindahkan artikel, berita, atau transaksi ke subdomain hanya karena subdomain baru sudah berhasil dibuat. Perpindahan URL memerlukan redirect permanen di sisi server, perbaikan canonical + sitemap, update publikasi otomatis, dan validasi Search Console.

| Area | URL kanonis | Tujuan pencarian |
| --- | --- | --- |
| Beranda | `/` | Jasa bikin web profesional di seluruh Indonesia |
| Jasa | `/jasa/` | Pilihan layanan: landing page, company profile, ecommerce, web app |
| Wilayah | `/wilayah/` | Cakupan layanan online di 38 provinsi dan kota/kabupaten utama Indonesia |
| Kota prioritas | `/wilayah/:kota/` | Panduan kebutuhan website yang spesifik per kota, FAQ, layanan terkait, kontak |
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

## Halaman kota prioritas (2026-11-07)

- 16 halaman berisi informasi kebutuhan bisnis yang berbeda untuk Jakarta, Bandung, Surabaya, Yogyakarta, Semarang, Medan, Tangerang, Bekasi, Bogor, Depok, Malang, Denpasar, Batam, Palembang, Balikpapan, dan Makassar.
- Sumber konten terstruktur: `static-source/lib/city-pages.mjs`. Kategorinya ilustrasi kebutuhan, bukan bukti proyek atau cabang fisik di kota tersebut.
- URL mengikuti `/wilayah/:kota/`, ditautkan langsung dari `/wilayah/`, serta menyertakan tautan ke halaman jasa, harga, portofolio, dan kota terkait.
- Meta title, meta description, H1, skenario, checklist, catatan praktis dan FAQ spesifik setiap kota berbeda.
- Structured data `Service` menunjukkan wilayah yang dapat dilayani secara online, tidak menambahkan `PostalAddress`, `LocalBusiness`, cabang, peta, atau testimoni palsu.
- SEO multi-kota harus diperluas secara bertahap hanya setelah ada data Search Console, kebutuhan unik, dan bukti layanan yang relevan. Jangan menggandakan halaman dengan mengganti nama lokasi.

## Direktori wilayah nasional tambahan
- `/wilayah/` memiliki direktori responsif dengan pencarian untuk 38 provinsi dan 189 contoh lokasi, serta 16 kota dengan panduan khusus.
- 38 halaman `/wilayah/provinsi/:provinsi/` berisi contoh jasa, tautan seluruh lokasi tercantum, proses proyek, dan FAQ.
- 174 halaman `/wilayah/provinsi/:provinsi/:lokasi/` melengkapi 15 lokasi yang sudah masuk 16 halaman prioritas. Kota Jakarta adalah halaman prioritas yang terpisah dari 189 lokasi dalam direktori.
- Metadata, canonical, sitemap, BreadcrumbList, dan Service schema ditambahkan untuk seluruh URL. Semua mengacu ke `https://bisabikinweb.site/`, bukan mengganti domain.
- Konten baru adalah contoh penerapan website, bukan bukti proyek lokal. Jangan menganggap banyaknya halaman otomatis meningkatkan ranking; tambahkan studi kasus nyata dan informasi spesifik setelah verifikasi.
- UI dirancang dengan tipografi premium, ringkasan cakupan, pencarian wilayah, daftar tautan daerah, CTA, dan tampilan responsif.

## Pengamanan indeksasi untuk halaman kota otomatis

- Seluruh 174 halaman lokasi tambahan tetap tersedia dan bisa dibuka dari direktori wilayah.
- Sebelum ditambahkan studi kasus atau informasi lokal unik yang terverifikasi, halaman-halaman tersebut memiliki tag `noindex,nofollow` dan tidak dimasukkan sitemap. Ini mencegah direktori template menjadi ratusan landing page serupa yang dioptimasi terutama untuk mesin pencari.
- Halaman beranda, /wilayah/, 38 halaman provinsi, dan 16 halaman kota prioritas tetap indexable dengan canonical dan sitemap.
- Google Search Console perlu digunakan untuk memilih lokasi yang punya permintaan nyata, kemudian memperkaya konten lokal dan mengubah indeksasi melalui review editorial yang disengaja.

## Direktori 600 halaman solusi dan SEO
- URL publik `/solusi/` memuat pencarian dan filter 600 kebutuhan pembuatan website.
- Masing-masing keyword di `seo/keyword-targets-600.json` diberi halaman profesional `/solusi/NNN-judul-kata-kunci/` dengan contoh kegunaan, checklist, pilihan fitur, FAQ, dan CTA konsultasi.
- Halaman dibuat dari `static-source/lib/seo-solutions.mjs` dan `static-source/features/SeoSolutions.tsx`, dengan desain responsif yang sama seperti website utama.
- **Seluruh 600 halaman detail sengaja noindex dan tidak masuk sitemap**, karena banyak variasi frasa berintensi serupa. Hanya direktori `/solusi/` dan halaman jasa asli yang diindeks sampai ada konten unik dan bukti proyek yang ditinjau secara editorial.
- Pengujian `tests/seo-landing-pages.test.mjs` memeriksa 600 file SSR, metadata, tautan, dan status noindex.

## Cerita dan ciri khas di seluruh 600 halaman SEO (7 November 2026)
- Setiap URL /solusi/ kini mempunyai tujuh bagian naratif: judul cerita, situasi, masalah, keputusan rancangan, detail khas, manfaat yang dituju, dan pertanyaan untuk brief.
- Data cerita per keyword tersimpan pada `static-source/lib/seo-story-content.mjs` dan dipasangkan ke halaman secara deterministik lewat ID.
- Cerita merupakan **ilustrasi hipotetis**, bukan proyek, klien, hasil atau testimoni yang diklaim nyata. Tiap halaman menampilkan penjelasan tersebut.
- Templat desain menggunakan kolom editorial, panel ciri khas dan bagian hasil + pertanyaan brief dengan tampilan mobile responsif.
- Test produksi memeriksa tujuh komponen naratif unik pada setiap satu dari 600 halaman SSR dan memastikan tidak ada bagian cerita yang sama persis antarkonten.
- Detail 600 halaman tetap `noindex` sampai ada pengayaan editorial berupa pengalaman/proyek asli dan verifikasi klaim.
