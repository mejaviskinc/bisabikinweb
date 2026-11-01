# BisaBikinWeb — GitHub Pages untuk 3 Subdomain

**Sumber utama:** https://github.com/mejaviskinc/bisabikinweb (branch `main`)

## Arsitektur aktif

| Domain | Repository | Konten |
| --- | --- | --- |
| bisabikinweb.site | `mejaviskinc/bisabikinweb` | Jasa, portfolio, konten, checkout produksi |
| app.bisabikinweb.site | `mejaviskinc/bisabikinweb-app` | Portal admin dan seller |
| media.bisabikinweb.site | `mejaviskinc/bisabikinweb-media` | Artikel, berita dan redaksi |
| shop.bisabikinweb.site | `mejaviskinc/bisabikinweb-shop` | Merchandise, keranjang, akun pembeli, tracking |

**GitHub Pages**, bukan Netlify, adalah target deploy untuk ketiga repo subdomain.

## Bagaimana deployment otomatis bekerja

Setiap repository subdomain sudah memiliki `.github/workflows/deploy-pages.yml` yang:

1. Checkout source `mejaviskinc/bisabikinweb@main` (read-only).
2. Install dependencies terkunci dan jalankan `npm test`.
3. Menjalankan `npm run build:app`, `build:media` atau `build:shop`.
4. Menyiapkan `pages-app`, `pages-media`, atau `pages-shop` dengan `CNAME`, `.nojekyll`, aset dan halaman yang hanya sesuai subdomain.
5. Memvalidasi paket, mengupload Pages artifact, dan deploy via GitHub Actions.
6. Rebuild pada push ke repo subdomain, melalui manual `workflow_dispatch`, dan secara berkala setiap jam agar perubahan source utama dan artikel terbaru ikut terbit.

Tidak perlu upload ZIP atau copy file build secara manual. Perubahan kode dan konten cukup dilakukan dari repo sumber utama.

## Yang perlu diaktifkan sekali pada masing-masing repo

Workflow telah diuji: proses `build` sukses, tetapi proses `deploy` masih gagal dengan `Get Pages site failed: Not Found` jika Pages belum aktif.

Gunakan tautan berikut dan pada **Settings → Pages → Build and deployment → Source** pilih **GitHub Actions**:

- https://github.com/mejaviskinc/bisabikinweb-app/settings/pages
- https://github.com/mejaviskinc/bisabikinweb-media/settings/pages
- https://github.com/mejaviskinc/bisabikinweb-shop/settings/pages

Kemudian buka Actions pada masing-masing repo, pilih workflow `Deploy BisaBikinWeb ... to GitHub Pages`, lalu `Run workflow`. Setelah job `deploy` sukses, verifikasi GitHub Pages URL default dan lanjutkan custom domain.

Hal ini tidak dapat diselesaikan dengan menambahkan `enablement: true` dan `GITHUB_TOKEN` biasa; GitHub mensyaratkan token lain yang punya izin administration/pages write, atau konfigurasi melalui Settings.

## DNS dan domain

Pada **Settings → Pages → Custom domain** dari repo yang sesuai, set:

- `app.bisabikinweb.site`
- `media.bisabikinweb.site`
- `shop.bisabikinweb.site`

Di pengelola DNS aktif domain `bisabikinweb.site`, tambahkan:

| Type | Host | Target |
| --- | --- | --- |
| CNAME | app | mejaviskinc.github.io |
| CNAME | media | mejaviskinc.github.io |
| CNAME | shop | mejaviskinc.github.io |

Jangan ubah `@`, `www`, `MX`, `TXT`, nameserver, atau CNAME utama. Setelah DNS valid, aktifkan **Enforce HTTPS** pada masing-masing repo. File CNAME di artifact bukan pengganti pengaturan Custom domain di Settings.

## Peraturan sebelum migrasi final

- **Admin/seller**: autentikasi Supabase dan kontrol role tetap wajib. Login per-subdomain menggunakan localStorage terpisah. Izin CORS untuk endpoint seller/admin harus aktif pada Supabase **project live**.
- **Media**: subdomain masih noindex, sedangkan canonical dan sitemap artikel berada di domain utama. Jangan ubah SEO/publikasi otomatis sampai rencana redirect dan Search Console tuntas. GitHub Pages tidak mendukung server-side 301 fleksibel.
- **Shop**: checkout di alamat baru belum dirilis sebagai transaksi produksi sampai CORS endpoint checkout/status/customer, Auth redirect URL, checkout Midtrans dan tracking teruji. Supabase URL dalam source saat ini memakai project `iyhwephcrxeqwiemhppw`, sedangkan akun Supabase yang terhubung melalui konektor tidak menunjukkan project yang sama; jangan deploy function ke project yang salah.
- **Seller storefront**: URL dinamis `/toko/:slug` memakai 404 SPA fallback di GitHub Pages. Visual masih dapat dirender, tetapi HTTP status 404 membuatnya belum cocok untuk migrasi SEO penuh.
- **Keranjang**: data localStorage main-domain dan shop-domain tidak dibagikan otomatis. Semua checkout nyata tetap di `https://bisabikinweb.site/checkout/` sampai uji migrasi selesai.

Referensi GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
