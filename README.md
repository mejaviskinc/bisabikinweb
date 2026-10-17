# Bisabikinweb

Website publik di https://bisabikinweb.site, diterbitkan melalui GitHub Pages.

## Pengembangan

Node.js 22 atau lebih baru. Jalankan `npm install` lalu `npm run build`. Hasil statis ada di `site-dist/`, termasuk HTML yang sudah dirender untuk SEO dan setiap rute. Push ke main menjalankan GitHub Actions Pages.

Konten di `static-source/lib/data.ts`; visual di `static-source/components/Visuals.tsx`; gaya di `static-source/styles.css`.

Konsultasi publik memakai draf WhatsApp; pesan baru terkirim setelah pengguna menekan Kirim. Merch belum tersedia untuk transaksi publik. Admin, akun, checkout, dan pelacakan tetap diarahkan ke aplikasi backend yang terpisah dan memiliki akses sendiri. GitHub Pages tidak menyimpan inquiry atau menjalankan database.
