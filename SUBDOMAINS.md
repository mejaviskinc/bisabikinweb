# Rencana subdomain BisaBikinWeb

## Struktur

| Hostname | Fungsi | Status |
| --- | --- | --- |
| bisabikinweb.site | Jasa website, portfolio, harga, konsultasi, artikel, berita, merch dan checkout | Tetap aktif |
| app.bisabikinweb.site | Portal admin dan seller, tetap memakai autentikasi Supabase | Build terpisah disiapkan pada branch ini |
| media.bisabikinweb.site | Artikel dan berita | Tahap kedua: migrasi SEO dan otomatisasi konten |
| shop.bisabikinweb.site | Merchandise | Tahap berikutnya: audit checkout dan keranjang |

Jangan pindahkan checkout atau artikel sekarang. Browser storage untuk keranjang/session tidak otomatis berpindah antar-subdomain. Konten editorial sudah memiliki canonical dan publikasi otomatis.

## Yang sudah disiapkan

- Portal Admin/Seller pada subdomains/app/index.html
- Build khusus dengan npm run build:app, membuat folder app-dist dari build utama dan hanya menyalin halaman admin, seller, dan aset tampilan
- Tidak menyalin CNAME, sitemap, checkout, blog, atau berita website utama
- X-Robots-Tag noindex,nofollow untuk area dashboard
- Redirect alamat publik yang tidak relevan kembali ke website utama
- Tes otomatis tests/app-subdomain.test.mjs

## Aktivasi di Netlify (setelah branch digabungkan)

1. Buat site Netlify BARU, berbeda dari site utama bisabikinweb.site. Hubungkan repo GitHub mejaviskinc/bisabikinweb branch main.
2. Build command: npm run build:app. Publish directory: app-dist. Node.js: 22. File netlify.app.toml berisi konfigurasi yang setara; untuk menggunakannya, pilih config file path netlify.app.toml. Jangan ubah pengaturan build site utama.
3. Deploy dan baca hostname default Netlify yang benar-benar diterbitkan, contoh POLA: nama-site-baru.netlify.app. Jangan mengasumsikan target sebelum ada hasil deploy.
4. Pada site Netlify yang baru, masuk Domain management lalu tambahkan app.bisabikinweb.site.
5. Pada penyedia DNS aktif domain bisabikinweb.site, buat record:
   - Type: CNAME
   - Host/Name: app
   - Value/Target: hostname Netlify BARU pada langkah 3, tanpa https://
   - TTL: Auto/default
   Jangan mengubah @, www, MX, TXT, nameserver, atau membuat wildcard *.bisabikinweb.site.
6. Setelah HTTPS/SSL aktif, uji https://app.bisabikinweb.site/ lalu /admin/ dan /seller/. Pastikan https://bisabikinweb.site/checkout/ tetap berfungsi.
7. Karena localStorage dipisahkan per-origin, user admin/seller perlu login sekali lagi di subdomain. Pertahankan autentikasi dan RLS Supabase.
8. Sesudah semua tes berhasil, baru perbarui tombol Admin/Seller website utama dan redirect URL lama. Jangan menghapus halaman lama lebih dulu.

## Pengujian

npm ci
npm test
npm run build:app

## Lanjutan

Untuk media.bisabikinweb.site perlu pisahkan build editorial, canonical, redirect permanen URL lama, sitemap, Search Console, serta otomatisasi posting. Untuk shop.bisabikinweb.site perlu audit localStorage keranjang, return URL Midtrans, checkout dan tracking order.

Status: perubahan branch ini belum menerbitkan subdomain; site hosting baru dan DNS CNAME tetap harus dibuat.
