# Bisabikinweb

Website publik di https://bisabikinweb.site, diterbitkan melalui GitHub Pages.

## Pengembangan

Node.js 22 atau lebih baru. Jalankan `npm install` lalu `npm run build`. Hasil statis ada di `site-dist/`, termasuk HTML yang sudah dirender untuk SEO dan setiap rute. Push ke main menjalankan GitHub Actions Pages.

Konten di `static-source/lib/data.ts`; visual di `static-source/components/Visuals.tsx`; gaya di `static-source/styles.css`.

Konsultasi publik memakai draf WhatsApp; pesan baru terkirim setelah pengguna menekan Kirim. Checkout dan pelacakan merchandise tetap di domain utama agar keranjang browser terbaca pada seluruh alur. Pembuatan order dan pembayaran diproses oleh Supabase Edge Functions dan Midtrans; fungsi pembayaran membutuhkan secret MIDTRANS_SERVER_KEY di Supabase dan secret tersebut tidak boleh dimasukkan ke frontend. Halaman Admin dan akun tetap diarahkan ke aplikasi backend terpisah. GitHub Pages sendiri tidak menyimpan order atau menjalankan database.
