# BisaBikinWeb — Subdomain di GitHub Pages

**Hosting aktif yang dipakai untuk subdomain: GitHub Pages (bukan Netlify).**

## Repository

| Domain | Repository GitHub |
| --- | --- |
| bisabikinweb.site | mejaviskinc/bisabikinweb |
| app.bisabikinweb.site | mejaviskinc/bisabikinweb-app |
| media.bisabikinweb.site | mejaviskinc/bisabikinweb-media |
| shop.bisabikinweb.site | mejaviskinc/bisabikinweb-shop |

Satu source utama digunakan untuk mengembangkan aplikasi. Ketiga repository subdomain memiliki workflow .github/workflows/deploy-pages.yml yang secara berkala checkout source dari mejaviskinc/bisabikinweb branch main, menjalankan tes dan build spesifik subdomain, lalu deploy GitHub Pages. Modifikasi aplikasi dilakukan di source utama.

## Aktivasi awal Pages (wajib sekali per repo)

1. Buka GitHub repo subdomain > Settings > Pages.
2. Di Build and deployment ubah Source menjadi **GitHub Actions**.
3. Buka Actions > Deploy BisaBikinWeb (app/media/shop) to GitHub Pages > Run workflow. Pastikan job build dan deploy berhasil.
4. Kembali ke Settings > Pages. Masukkan Custom domain yang sesuai (app/media/shop.bisabikinweb.site) dan Save.
5. Di pengelola DNS domain, masukkan masing-masing CNAME:
   - app → mejaviskinc.github.io
   - media → mejaviskinc.github.io
   - shop → mejaviskinc.github.io
   Jangan menyentuh root (@), www, MX, TXT atau nameserver.
6. Setelah sertifikat terbit, aktifkan Enforce HTTPS di Settings > Pages dan uji masing-masing domain.

Jika GitHub Pages belum diaktifkan pada repository, job configure-pages akan gagal dengan 'Get Pages site failed / Not Found'. Ini bukan kegagalan build source.

## Migrasi bertahap dan keamanan

- Website utama tetap aktif untuk jasa, portfolio, artikel SEO, merch, checkout, dan link transaksi sampai semua subdomain sudah lolos verifikasi.
- Media masih diberi noindex dan canonical alamat lama agar konten tidak terduplikasi. Setelah cutover baru pindahkan canonical, sitemap dan Search Console serta jadwal publikasi.
- App hanya berisi admin dan seller, namun pembatasan akses tetap harus dilakukan oleh Supabase; subdomain bukan pengganti autentikasi atau RLS.
- Shop terpisah origin sehingga localStorage keranjang/akun berbeda dari domain utama. Fungsi Supabase Checkout, Status, Customer dan Seller perlu izin CORS untuk origin baru dan harus dideploy ke **project yang dipakai live**, bukan project lain; uji order Midtrans terlebih dulu sebelum tautan belanja publik dipindahkan.
- Dynamic /toko/:slug di GitHub Pages menggunakan 404 fallback sementara; respons HTTP 404 belum SEO-friendly dan butuh prerender slug setelah cutover.
- Files _headers dan _redirects khusus Netlify tidak dipakai sebagai konfigurasi aktif pada GitHub Pages. Paket pages-* tidak menyertakannya.

Untuk detail dan perintah build lokal, lihat GITHUB-PAGES-SUBDOMAINS.md.
