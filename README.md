# BisaBikinWeb — Website Profesional

Website production-ready untuk **BisaBikinWeb** di **https://bisabikinweb.site/**. Dibuat dengan HTML, CSS, dan JavaScript tanpa build step agar mudah dikelola melalui GitHub dan di-deploy ke Hostinger.

## Struktur

- `index.html` — struktur halaman + SEO metadata
- `style-base.css` — foundation, navbar, hero, device mockup
- `style-components.css` — section, cards, pricing, portfolio, FAQ, form, footer
- `style-responsive.css` — responsive breakpoints
- `script.js` — layanan, harga, portfolio, testimonial, FAQ, form, animasi, WhatsApp
- `assets/favicon.svg` — favicon
- `assets/og-image.svg` — Open Graph preview
- `robots.txt` — crawler rules
- `sitemap.xml` — sitemap domain
- `.htaccess` — HTTPS, security headers, cache static assets

## Menjalankan secara lokal

Buka `index.html` langsung di browser, atau gunakan local server:

```bash
python3 -m http.server 8080
```

## Mengubah nomor WhatsApp

Buka `script.js` lalu isi `whatsappNumber` dengan format internasional tanpa `+`.

```js
const CONFIG = {
  whatsappNumber: '6281234567890',
  instagram: 'https://instagram.com/bisabikinweb',
  tiktok: '#'
};
```

Jika nomor dikosongkan, tombol WhatsApp tetap membuka WhatsApp dengan pesan siap kirim, tetapi user memilih penerima sendiri.

## Mengubah konten

Data `services`, `advantages`, `pricing`, `portfolios`, `testimonials`, dan `faqs` berada di `script.js` agar mudah diedit tanpa mengubah struktur halaman. Statistik utama dapat diubah melalui atribut `data-count` di `index.html`.

## SEO

Domain production sudah diarahkan ke `https://bisabikinweb.site/` pada canonical URL, Open Graph, Schema.org, `robots.txt`, dan `sitemap.xml`. Setelah website online, submit sitemap berikut di Google Search Console:

`https://bisabikinweb.site/sitemap.xml`

## Deploy GitHub → Hostinger

1. Repository GitHub: `mejaviskinc/bisabikinweb`.
2. Di hPanel Hostinger, buka website untuk `bisabikinweb.site`.
3. Masuk ke **Advanced → Git** atau menu **Git** yang tersedia pada paket hosting.
4. Hubungkan repository GitHub `https://github.com/mejaviskinc/bisabikinweb.git`.
5. Branch: `main`.
6. Target/deployment path: folder root domain, biasanya `public_html` untuk domain utama.
7. Karena project static HTML/CSS/JS, tidak ada build command dan tidak ada dependency install.
8. Jalankan deploy/pull.
9. Aktifkan SSL/HTTPS untuk `bisabikinweb.site` pada hPanel.
10. Buka domain dan test navbar, portfolio, FAQ, form, dan tombol WhatsApp.

Jika fitur auto-deploy/webhook Git tersedia pada paket Hostinger, aktifkan agar setiap push ke branch `main` dapat diterapkan lebih cepat.

## Checklist production

- Isi nomor WhatsApp asli di `script.js`.
- Isi link TikTok.
- Ganti link project portfolio yang masih `#` dengan URL project asli.
- Ganti testimonial contoh dengan testimonial customer asli.
- Tambahkan Google Analytics ID bila digunakan.
- Verifikasi domain di Google Search Console dan submit sitemap.
- Test tampilan 320px, 375px, 430px, 768px, 1024px, dan 1440px+.

## Keamanan

Jangan pernah menyimpan API key rahasia, service-role key, password, atau credential private di repository frontend. Gunakan environment variables/backend untuk integrasi yang membutuhkan secret.
