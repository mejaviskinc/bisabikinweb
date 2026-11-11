# BisaBikinWeb Affiliate Partner — Peluncuran MVP

**Status:** implementasi di cabang pengembangan. Belum aktif secara publik sampai skema database diterapkan, kedua Edge Function dipublikasikan, build lulus, lalu perubahan digabungkan dan di-deploy ke GitHub Pages.

## Skema program yang diusulkan
- Mitra: orang atau bisnis dengan akun BisaBikinWeb (Supabase Auth) yang emailnya terverifikasi. Pendaftaran gratis dan memerlukan persetujuan admin.
- Komisi: **10% dari nilai jasa website untuk pelanggan baru**, setelah menyesuaikan pajak, domain, hosting dan biaya pihak ketiga. Angka 10% merupakan rancangan bisnis awal.
- Kode: unik per mitra, aktif hanya bila `status=active`; bisa dibagikan melalui `https://bisabikinweb.site/beli-website/?ref=BBW...`.
- Atribusi: kode referral browser disimpan lokal selama **30 hari**, terakhir digunakan menang, dikirim hanya saat pemesanan; tidak ada klaim jumlah klik/pengunjung. Tanpa kode order yang tercatat, tidak ada komisi otomatis.
- Satu transaksi dengan kode valid hanya menghasilkan satu baris komisi. Referral untuk akun sendiri, pelanggan yang sudah pernah membayar pesanan website sebelumnya, pesanan palsu, refund dan transaksi selain **DOKU production** tidak dihitung.
- Pada pembayaran sah, komisi awal tersimpan sebagai `pending`. Ini **belum menjadi utang pencairan final** sampai admin meninjau invoice, biaya jasa, kesesuaian sumber referral, risiko penyalahgunaan, dan periode 14 hari berlalu.
- Admin menyetujui komisi setelah validasi, dapat menyesuaikan nilai jasa bersih, atau membatalkan komisi. Refund membatalkan komisi yang belum dibayar.
- Pencairan: komisi disetujui minimal **Rp100.000**, siklus bulanan. Transfer dilakukan manual, sesudah pemilik rekening divalidasi lewat saluran privat. Admin baru boleh klik “Tandai sudah ditransfer” jika transfer **benar-benar selesai** dan memiliki referensi.
- Untuk komisi yang telah ditransfer sebelum refund terjadi, tim keuangan harus menangani pengembalian/penyesuaian secara manual.
- Komisi affiliate dapat menjadi objek PPh dan kewajiban administrasi perpajakan. Sistem tidak boleh menjanjikan jumlah bersih tanpa menghitung potongan sah. Lihat panduan resmi DJP: https://www.pajak.go.id/index.php/id/artikel/affiliator-cuan-jalan-pajak-aman

## Aturan perilaku mitra
- Tidak boleh spam, mencatut merek/akun resmi, menjanjikan fitur/garansi yang tidak disetujui, melakukan self-referral atau pembelian fiktif.
- Jika memberi rekomendasi berbayar/berkomisi secara publik, mitra harus mengungkapkan hubungan afiliasinya dengan jelas.
- Mitra tetap pihak independen, bukan karyawan atau wakil berwenang untuk menandatangani kontrak atas nama BisaBikinWeb.
- Komisi dapat dibatalkan/ditunda jika ditemukan indikasi fraud atau pelanggaran.
- Jangan membagikan data pelanggan tanpa persetujuan; permintaan data calon pelanggan harus transparan dan relevan.

## Data pribadi yang disimpan
- Nama mitra, user ID akun, nomor WhatsApp, saluran promosi, kode/status referral, riwayat komisi dan bukti referensi transfer. Semua data keanggotaan hanya diakses Edge Function yang mewajibkan akun sah atau admin resmi.
- Browser menyimpan **kode referral saja** di localStorage dengan durasi maksimal 30 hari. Tidak ada pencatatan alamat IP atau fingerprint untuk klik.
- Detail rekening ditangani lewat jalur privat. Jangan memasukkan nomor rekening, NPWP atau dokumen pribadi ke GitHub.
- Tambahkan penjelasan spesifik affiliate pada kebijakan privasi dan sediakan jalur permintaan penghapusan data sesuai kewajiban retensi.

## Rute & implementasi
- `/affiliate/` — penawaran program, formulir pendaftaran, dashboard mitra.
- `/admin/affiliates/` — persetujuan mitra, verifikasi komisi, rekonsiliasi transfer.
- `/beli-website/?ref=... ` — tautan afiliasi.
- `/pesan-website/` — membawa kode ke Edge Function order; hanya backend yang mengaitkan kode ke akun mitra.
- `docs/affiliate-schema.sql` — RLS tertutup, tabel, indeks, payment-status trigger dengan filter **DOKU production**.
- `supabase/functions/bbweb-affiliate/index.ts` — API terautentikasi mitra dan admin.
- `supabase/functions/bbweb-website-store/index.ts` — memvalidasi kode referral pada pembuatan order, bukan menerima komisi dari browser.

## Urutan deployment dan verifikasi
1. Pastikan kebijakan harga 10% disetujui pemilik dan biaya jasa bersih terdefinisi di invoice. Tetapkan pihak yang meninjau pajak dan transfer.
2. Jalankan `docs/affiliate-schema.sql` pada project **kdlrobdzlxpjlkxbvzsd**, setelah backup/skema review. Tidak mengubah tabel GoO Ninks.
3. Deploy `bbweb-affiliate` dengan verifikasi JWT dalam fungsi dan `verify_jwt=false` hanya karena fungsi ini memverifikasi bearer ke `/auth/v1/user` sendiri menggunakan publishable key. Jika JWT gateway mendukung token pengunjung yang digunakan, opsi gateway bisa diaktifkan setelah pengujian.
4. Deploy versi baru `bbweb-website-store` dengan kode referral; jangan mengubah DOKU webhook yang sedang berjalan.
5. Build `BBWEB_OFFLINE_BUILD=1 npm run build`, jalankan `npm test` dan `npm run test:output`, lalu cek `site-dist/affiliate/index.html`.
6. **Tes sandbox**: pengajuan, persetujuan, klik referral, order, checkout, webhook `sandbox paid` (tidak ada komisi), status refund, invalid code dan self-referral. Lakukan uji DOKU production hanya pada transaksi nyata yang sah.
7. Lakukan pilot 3–5 mitra, audit rekonsiliasi dan pajak, lalu umumkan pendaftaran secara publik.
8. Catat bahwa **transfer bukan fungsi pembayaran otomatis**, dan komisi produksi tidak terbentuk jika DOKU masih di sandbox.

## Pengukuran awal
Sasaran 30 hari: 10 mitra terverifikasi, 20 prospek layak, 3 closing, laporan total komisi pending/disetujui/dibayar. Ini **target, bukan hasil yang sudah terjadi**.
