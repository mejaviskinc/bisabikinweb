# Digital Store — form pembelian terintegrasi
Frontend: `/layanan-digital/`; admin: `/admin/digital-store/`.
Tipe: game, pulsa, data, pln, voucher. Customer memilih kategori lalu mengisi form layanan sesuai tujuan.
Form ini menyimpan **permintaan pembelian** ke tabel `bbweb_digital_orders`. Tidak ada pembayaran/top up otomatis sebelum integrasi DOKU dan supplier berhasil diuji.
- Customer harus login menggunakan Supabase Auth, email terverifikasi, lalu setuju syarat.
- User ID/nomor tujuan divalidasi di server. Harga tidak ditentukan dari browser.
- Maksimal 3 permintaan per jam per akun, idempotency key per form, RLS dengan akses server-only.
- Admin melihat permintaan via `/admin/digital-store/`; admin memerlukan allowlist akun.
- Jangan hubungkan ke `bbweb_orders`, `bbweb_website_orders`, atau tabel Gooninks.
Aktivasi pembayaran dan pemenuhan supplier memerlukan katalog SKU & harga nyata, DOKU server checkout/webhook yang terverifikasi, idempotensi transfer ke supplier, cek status pending, rekonsiliasi, refund dan uji sandbox.
