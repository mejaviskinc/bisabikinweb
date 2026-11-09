# Integrasi IP Statis Digiflazz Buyer — BisaBikinWeb

**Status saat ini:** endpoint admin di Supabase aktif; gateway Node.js sudah dibuat dan diuji secara lokal. IP statis dari VPS, kredensial Buyer, dan whitelist Digiflazz **belum** dipasang. Gateway hanya mendukung **daftar harga (read-only)**, tidak memproses top-up berbayar.

## Arsitektur
`bisabikinweb.site` (GitHub Pages) -> Supabase `bbweb-digiflazz-admin` (admin-authenticated) -> HTTPS gateway di VPS dengan public static outbound IPv4 -> `https://api.digiflazz.com/v1/price-list`.

**IP yang harus didaftarkan:** IPv4 **keluar** VPS, bukan IP GitHub Pages, bukan IP Supabase Edge, bukan IP laptop. Supabase Edge Functions tidak memiliki fixed egress IP. IP `52.74.250.133` di panduan Digiflazz adalah alamat Digiflazz, **bukan** alamat VPS BisaBikinWeb.

## Yang perlu disediakan oleh pemilik server

1. VPS Node.js 22+ dengan public IPv4 tetap (Hostinger VPS atau penyedia lain; memerlukan akun, pembelian, dan akses SSH).
2. Subdomain (contoh `egress.bisabikinweb.site`) dengan DNS A menuju VPS dan HTTPS valid.
3. Digiflazz Buyer Username dan **Development API Key**. Simpan sebagai secret di server saja, **jangan** tempel di chat, GitHub, atau browser/frontend.

## Konfigurasi VPS

Jalankan `node services/digiflazz-egress/server.mjs` di VPS melalui service manager (systemd), dengan environment berikut yang hanya disimpan pada VPS:

```env
BBWEB_EGRESS_SHARED_SECRET=ISI_RANDOM_MIN_32_KARAKTER
DIGIFLAZZ_USERNAME=ISI_USERNAME_BUYER
DIGIFLAZZ_API_KEY=ISI_DEVELOPMENT_API_KEY
PORT=8787
```

Buat secret dengan `openssl rand -hex 32` dan simpan misalnya di `/etc/bbweb/digiflazz.env` dengan permission `chmod 600`. Server aplikasi **hanya listen 127.0.0.1:8787** sehingga tidak boleh diekspos langsung ke publik. Gunakan Caddy/Nginx sebagai HTTPS reverse proxy di port 443.

Contoh konfigurasi Caddy (setelah DNS siap):

```caddy
egress.bisabikinweb.site {
    reverse_proxy 127.0.0.1:8787
}
```

Dari SSH VPS, verifikasi outbound IP:

```bash
curl -4 https://api.ipify.org
curl -i http://127.0.0.1:8787/health
```

Lalu daftarkan **IP yang dihasilkan perintah pertama** di Digiflazz **Buyer Area > Pengaturan Koneksi API > Development IP**. Lengkapi OTP dan verifikasi secara langsung di akun Digiflazz. Setelah testing lulus dan production dipersiapkan, daftarkan juga di Production IP.

## Hubungkan Supabase

Supabase project: `kdlrobdzlxpjlkxbvzsd`; Edge Function: `bbweb-digiflazz-admin` (sudah deployed). Di Dashboard > Edge Functions > Secrets, isi:

```text
DIGIFLAZZ_PROXY_URL=https://egress.bisabikinweb.site
DIGIFLAZZ_PROXY_TOKEN=<harus sama dengan BBWEB_EGRESS_SHARED_SECRET di VPS>
```

Endpoint hanya menerima **admin terautentikasi dalam `bbweb_admin_allowlist`** dengan Bearer JWT. Pengujian melalui POST ke `/functions/v1/bbweb-digiflazz-admin` (header `apikey` publishable Supabase, header `Authorization: Bearer <token_admin>`):

```json
{"action":"status"}
```

atau (hanya daftar harga; tidak melakukan top-up):

```json
{"action":"price_list","cmd":"prepaid"}
```

Jangan membuka endpoint untuk publik; jangan menyimpan Digiflazz API Key di Supabase frontend.

## Verifikasi

```bash
node --test tests/digiflazz-egress.test.mjs
```

Tiga uji mencakup fail-closed, autentikasi dan blokir perintah yang tidak diperbolehkan, serta fixed endpoint dan signature MD5 Digiflazz.

**Penting:** menghubungkan transaksi berbayar dilakukan dalam pekerjaan terpisah hanya setelah status pembayaran DOKU diverifikasi server-side, nominal dan order valid, idempotensi dijamin, serta ada rekonsiliasi fulfillment. Fungsi `bbweb-digital-orders` saat ini hanya mencatat request.

Referensi: [Persiapan Buyer](https://developer.digiflazz.com/api/buyer/persiapan/), [Daftar Harga](https://developer.digiflazz.com/api/buyer/daftar-harga/), [Supabase fixed egress](https://supabase.com/kb/troubleshooting/why-supabase-edge-functions-cannot-provide-static-egress-ips-for-whitelisting-3d78b0).
