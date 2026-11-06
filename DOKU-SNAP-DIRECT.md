# DOKU SNAP Direct API — BisaBikinWeb (7 November 2026)

## Implementasi saat ini
Website checkout menampilkan opsi **QRIS langsung**, **Virtual Account BCA**, dan **Virtual Account BRI** hanya bila kemampuan server siap. Opsi **DOKU Checkout** tetap tersedia sebagai cadangan. QR dan nomor VA dibuat oleh DOKU melalui SNAP API, tidak pernah ditentukan oleh browser.

Halaman pembayaran: `https://bisabikinweb.site/payment/?id=<order-number>`. Status disajikan lewat `bbweb-payment-status`, hanya kepada pemegang token checkout yang benar; token tidak diletakkan di URL. QR dibentuk langsung di browser dengan Nayuki QR encoder berlisensi MIT, bukan layanan QR pihak ketiga.

Sumber implementasi:
- `supabase/functions/_shared/doku-snap.ts`: B2B token (RSA-SHA256), signed HMAC-SHA512 SNAP APIs, QRIS generate/query, VA BCA/BRI create, verifikasi signature callback.
- `supabase/functions/bbweb-merch-checkout/index.ts`: validasi pesanan, klaim pembayaran eksklusif, penerbitan SNAP, fail-closed, capabilities.
- `supabase/functions/bbweb-payment-status/index.ts`: status order bertoken + QRIS reconciliation terjadwal.
- `supabase/functions/bbweb-snap-webhook/index.ts`: VA payment notification, signature HMAC, invoice/amount/VA match, transaksi idempoten.
- `supabase/migrations/20261107010000_bbweb_doku_snap_direct.sql`: skema dan atomic database functions untuk SNAP.
- `supabase/migrations/20261107013000_bbweb_fix_ledger_trigger.sql`: perbaikan trigger saldo seller yang sebelumnya gagal saat status paid.
- `tests/doku-snap.test.mjs`: pengujian signature, response, dan keamanan webhook dengan kunci dummy.

## Supabase secrets — wajib diisi di proyek `kdlrobdzlxpjlkxbvzsd`
Buka https://supabase.com/dashboard/project/kdlrobdzlxpjlkxbvzsd/functions/secrets

**Jangan pernah commit atau kirim kunci rahasia ke chat.**
- `DOKU_SNAP_ENABLED` = `true` (setelah seluruh konfigurasi siap)
- `DOKU_SNAP_ENV` = `sandbox` (awal)
- `DOKU_SNAP_CLIENT_ID` = client/partner ID SNAP DOKU
- `DOKU_SNAP_CLIENT_SECRET` = client secret SNAP DOKU
- `DOKU_SNAP_PRIVATE_KEY` = RSA PKCS#8 PEM private key **milik merchant**; public key pasang ke DOKU sesuai instruksi mereka
- `DOKU_SNAP_QRIS_MERCHANT_ID` = QRIS merchant ID / mall ID dari DOKU
- `DOKU_SNAP_QRIS_TERMINAL_ID` = terminal ID yang terdaftar
- `DOKU_SNAP_QRIS_POSTAL_CODE` = kode pos QRIS merchant (5 digit)
- `DOKU_SNAP_VA_BCA_PARTNER_SERVICE_ID` = company/BIN code VA BCA dari DOKU jika kanal BCA diaktifkan
- `DOKU_SNAP_VA_BRI_PARTNER_SERVICE_ID` = company/BIN code VA BRI dari DOKU jika kanal BRI diaktifkan

Tidak perlu mengaktifkan BCA/BRI sekaligus; opsi tidak akan tampil sampai tiap BIN diisi. Nilai credentials tidak boleh dibuat-buat. Mode production juga mensyaratkan `DOKU_SNAP_ENV=production` dan `DOKU_SNAP_PRODUCTION_CONFIRMED=true` secara eksplisit, **hanya sesudah sandbox lolos**.

## Callback DOKU
Atur URL VA SNAP payment notification pada dashboard merchant:
`https://kdlrobdzlxpjlkxbvzsd.supabase.co/functions/v1/bbweb-snap-webhook`

Callback harus mengirim header `X-PARTNER-ID`, `X-TIMESTAMP`, `X-SIGNATURE`, `Authorization: Bearer <token>`, dengan body VA SNAP resmi. Signature dihitung dari raw JSON body dan path callback sesuai kontrak SNAP. DOKU harus diarahkan untuk menandatangani **path yang terdaftar**, bukan path default contoh dokumentasi.

QRIS dikonfirmasi menggunakan query langsung ke DOKU oleh server `bbweb-payment-status`, bukan berdasarkan tombol atau screenshot pembeli. Status **paid** hanya setelah kecocokan invoice, mata uang IDR, nominal, autentikasi SNAP, dan transaksi commit di server.

## Validasi / peluncuran
- Backend migrations untuk SNAP telah di-apply ke Supabase baru; GoO ninks `gn_*` tidak diubah.
- Edge Functions `bbweb-merch-checkout`, `bbweb-payment-status`, `bbweb-snap-webhook` telah dideploy berstatus ACTIVE.
- Unit test SNAP RSA, HMAC, QRIS, VA, callback dijalankan dalam GitHub CI.
- SQL transaction rollback smoke test lulus: eksklusivitas claim, anti double-payment dan idempotensi stok/paid.
- **Belum ada bukti transaksi DOKU SNAP sandbox yang berhasil dari kredensial merchant sebenarnya.** Jangan menganggap produksi aktif sebelum QRIS ditransaksikan, VA dinotifikasi, rekening/callback diverifikasi, refund/expired diuji, dan seluruh status direkonsiliasi.
- GitHub Pages deployment bersifat terpisah dari aktivasi kunci API. Lihat workflow runs sebelum mengklaim halaman terbaru sudah live.

Dokumentasi resmi:
- https://developers.doku.com/accept-payments/direct-api/snap/integration-guide/get-token-api/b2b
- https://developers.doku.com/accept-payments/direct-api/snap/integration-guide/qris
- https://developers.doku.com/accept-payments/direct-api/snap/integration-guide/virtual-account/bca-virtual-account
- https://developers.doku.com/get-started-with-doku-api/signature-component/snap/symmetric-signature
