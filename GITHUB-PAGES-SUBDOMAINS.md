# BisaBikinWeb — GitHub Pages Multi-Subdomain

## Arsitektur

Domain utama tetap diterbitkan dari repository `mejaviskinc/bisabikinweb` dan GitHub Pages-nya sendiri. Tiga subdomain memakai repository publik TERPISAH:

| Repo tujuan | Domain | Isi |
| --- | --- | --- |
| `mejaviskinc/bisabikinweb-app` | `app.bisabikinweb.site` | Admin dan Seller |
| `mejaviskinc/bisabikinweb-media` | `media.bisabikinweb.site` | Artikel, berita, redaksi |
| `mejaviskinc/bisabikinweb-shop` | `shop.bisabikinweb.site` | Merch, cart, checkout, account, tracking |

Jangan memindahkan CNAME `bisabikinweb.site` dari repo utama. GitHub Pages hanya mengelola satu custom-domain untuk setiap site/repository. Workflow sumber di repo utama **membuat tiga artifact terpisah**; tidak otomatis menerbitkan ketiga repo.

## Build di GitHub Actions

Workflow: `.github/workflows/pages-subdomains.yml` → **Build three GitHub Pages subdomain packages**.

1. Buka repo utama → Actions → workflow → Run workflow (branch main).
2. Unduh artifact `pages-app`, `pages-media`, `pages-shop`.
3. Ekstrak masing-masing ZIP. **Isi folder hasil ekstrak**, bukan ZIP itu sendiri, harus ada di root repository subdomain yang sesuai, termasuk `index.html`, `CNAME`, `assets/`, `.nojekyll`.
4. Ketiga repo harus public untuk GitHub Pages publik di paket GitHub yang sesuai.

Untuk rebuild lokal: `npm ci && npm run build:all-subdomains && node scripts/prepare-pages-subdomains.mjs`.
Output: `pages-app/`, `pages-media/`, dan `pages-shop/`.

## Aktifkan GitHub Pages di tiap repo

1. Buat repo PUBLIC `bisabikinweb-app`, `bisabikinweb-media`, dan `bisabikinweb-shop` pada akun `mejaviskinc`.
2. Isi branch `main` dari paket artifact yang cocok (commit dan push semua file di root).
3. Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch `main`, folder `/(root)` → Save.
4. Di Settings → Pages → Custom domain, masukkan subdomain yang benar untuk repo, lalu Save.
5. Di DNS provider aktif `bisabikinweb.site`, buat tepat tiga CNAME berikut tanpa menyentuh record `@`, `www`, MX, TXT, atau nameserver:

| Type | Host | Value/Target | TTL |
| --- | --- | --- | --- |
| CNAME | app | mejaviskinc.github.io | Auto |
| CNAME | media | mejaviskinc.github.io | Auto |
| CNAME | shop | mejaviskinc.github.io | Auto |

**Penting:** Jangan gunakan target `mejaviskinc.github.io/bisabikinweb-app` atau alamat Netlify. GitHub Pages CNAME harus ke hostname `mejaviskinc.github.io`, tanpa nama repo atau `https://`. Jangan menambahkan wildcard DNS.

6. Setelah DNS terdeteksi, cek opsi **Enforce HTTPS** dan verifikasi sertifikat. Verifikasi homepage, artikel, admin/seller, produk, dan halaman checkout.

Docs: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Keamanan, SEO & syarat aktivasi

- Versi media dan shop dipublikasikan sebagai **preview noindex**. Jangan langsung mengubah canonical dan sitemap situs utama.
- Semua artikel masih mengarah canonical ke domain utama. Migrasi SEO selesai hanya bila redirect HTTP 301 dari URL lama ke baru sudah tersedia, canonical diperbarui, sitemaps benar, Search Console diperbarui, dan otomatisasi artikel dikirim ke domain/repo baru. GitHub Pages sendiri tidak menyediakan aturan server-side HTTP 301 yang fleksibel, sehingga perlu proxy/hosting redirect saat cutover. Ini bukan alasan mengubah URL produksi sekarang.
- **Checkout di shop belum boleh diumumkan live** sebelum mengonfirmasi deploy Supabase Edge Functions dengan CORS `https://shop.bisabikinweb.site`; perubahan CORS sudah disiapkan di source. Alamat Supabase di source saat ini `iyhwephcrxeqwiemhppw.supabase.co`, sedangkan project koneksi lain tidak cocok. Jangan deploy ke project yang tidak cocok.
- Supabase Auth redirect allowlist perlu mengizinkan `https://shop.bisabikinweb.site/account/` untuk signup/reset; admin/seller mungkin perlu login ulang karena localStorage per-origin.
- Callback pembayaran Midtrans masih memakai `https://bisabikinweb.site/track-order` — sengaja dipertahankan sampai seluruh transaksi dan tracking shop terverifikasi.
- Shopping cart tidak otomatis terbagi antara `bisabikinweb.site` dan `shop.bisabikinweb.site`; lakukan transaksi awal hingga akhir pada satu origin.
- Seller storefront `/toko/:slug` menggunakan 404 SPA fallback pada GitHub Pages, **HTTP status tetap 404**. Biarkan storefront resmi tetap di domain utama sampai slug dapat diprerender atau menggunakan hosting rewrite yang mendukung HTTP 200.
- GitHub Actions di repo utama hanya menghasilkan artifact. Agar update konten otomatis masuk ke tiga repo dibutuhkan workflow push cross-repo dengan kredensial yang dibatasi, atau import artifact berkala. Jangan menaruh PAT di source code.
- Subdomain bukan pengganti autentikasi, verifikasi role, RLS, atau Midtrans webhook verification.

## Periksa status

- `https://app.bisabikinweb.site/` = Portal, `/admin/`, `/seller/`.
- `https://media.bisabikinweb.site/` = Media, `/artikel/`, `/berita/`.
- `https://shop.bisabikinweb.site/` = Shop, `/merch/`, `/cart/`.
- `https://bisabikinweb.site/` = domain utama tidak berubah.

Sampai pengujian DNS, SSL, login, dan Midtrans selesai, **semua URL checkout produksi, otomatisasi, SEO, dan sitemap tetap di domain utama**.
