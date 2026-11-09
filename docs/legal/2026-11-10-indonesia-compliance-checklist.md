# Audit penerapan kebijakan hukum Indonesia — 10 November 2026
Status: DRAFT IMPLEMENTASI / REVIEW DIBUTUHKAN. Ini daftar penyesuaian operasional, bukan sertifikat kepatuhan.

## Sumber hukum yang diverifikasi
- UU No. 8 Tahun 1999 tentang Perlindungan Konsumen, khususnya Pasal 4, 7, 18: https://jdih.kemenkeu.go.id/api/download/fulltext/1999/8TAHUN~1999UU.htm
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi: https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/
- PP No. 80 Tahun 2019 tentang PMSE, khususnya Pasal 25, 27, 67–69: https://jdih.kemendag.go.id/peraturan/peraturan-pemerintah-nomor-80-tahun-2019-tentang-perdagangan-melalui-sistem-elektronik
- PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik: https://peraturan.bpk.go.id/Details/122030/pp-no-71-tahun-2019
- Permendag No. 19 Tahun 2026 (BERLAKU, sejak 8 Juni 2026; menggantikan Permendag 31 Tahun 2023): https://jdih.kemendag.go.id/peraturan/peraturan-menteri-perdagangan-republik-indonesia-nomor-19-tahun-2026-tentang-penyelenggaraan-usaha-perdagangan-melalui-sistem-elektronik
- UU ITE sebagaimana perubahan terakhir UU No. 1 Tahun 2024, jika relevan pada transaksi elektronik.

## Perbaikan teks yang dilakukan
1. /terms/ -> cakupan jualan jasa web, commerce, digital dan merchandise; proses kontrak; biaya pihak ketiga; hak konsumen; jalur sengketa.
2. /privacy/ -> jenis data, dasar pemrosesan, vendor, cookie, transfer lintas batas, retensi, hak PDP, respons insiden.
3. /refund/ -> hak penukaran/pembatalan PP 80/2019 minimal 2 hari kerja untuk kondisi Pasal 69; refund proyek pra/proses/pasca pengerjaan; barang dan produk digital.
4. Navigasi kebijakan antarhalaman, tanggal pembaruan, jalur kontak, dan nama halaman berbahasa Indonesia.
5. Tes konten legal ditambahkan.

## STOP-SHIP / PENYESUAIAN OPERASIONAL PENTING
- [ ] Verifikasi identitas pelaku usaha yang benar: nama badan usaha/perseorangan, alamat usaha, email resmi untuk pengaduan/privacy, nomor identifikasi usaha/NIB bila wajib; tambahkan detail yang tervalidasi di kebijakan & invoice. Jangan menebak PT atau NIB dari riwayat percakapan.
- [ ] Periksa apakah BisaBikinWeb bertindak sebagai pedagang, PPMSE/marketplace, atau PSP pada tiap produk. Kewajiban izin, identitas penjual, data kontrak, penyimpanan catatan, pengelolaan penjual dan moderasi berbeda menurut peran. Permendag 19/2026 berlaku sejak 8 Juni 2026.
- [ ] Validasi checkbox persetujuan kontrak di checkout dan kemampuan mengunduh/menyimpan ringkasan pesanan serta versi ketentuan saat transaksi. Jangan anggap kalimat pasif 'dengan memesan kamu setuju' cukup untuk semua tindakan.
- [ ] Audit CookieYes/tag manager, pengaktifan cookie non-esensial, consent dan withdrawal pada kenyataan. Kebijakan tertulis saja tidak membuktikan pemblokiran cookie otomatis.
- [ ] Buat inventaris pemrosesan PDP: jenis data, tujuan, dasar hukum, pihak pemroses, lokasi, retensi yang konkret per kategori, penghapusan, pelaporan insiden. Lihat PP 80 Pasal 25 jika memenuhi kualifikasi PPMSE (10 tahun data transaksi keuangan; 5 tahun data transaksi non-keuangan); jangan menerapkannya otomatis ke setiap peran.
- [ ] Validasi proses praktik refund: siapa menerima aduan, kriteria bukti, rekonsiliasi pembayaran melalui provider nyata, log pengaduan, tenggat pelayanan, pilihan penyelesaian, biaya retur, dan SOP pengembalian dana.
- [ ] Cocokkan DOKU/Midtrans dan provider digital aktif dengan produk nyata serta pengungkapan kepada pembeli. Verifikasi kontrak vendor dan alur gagal/double payment.
- [ ] Periksa permintaan data pribadi: akses/koreksi/penarikan persetujuan/penghapusan dan eskalasi 3 x 24 jam untuk kasus yang relevan dalam UU PDP. Siapkan petugas penanggung jawab.
- [ ] Tinjau oleh penasihat hukum yang memahami PMSE, jasa digital dan transaksi konsumen sebelum klaim 'sepenuhnya sesuai hukum' atau publikasi kebijakan sebagai final.

## Batas perubahan ini
Konten publik diperbaiki, tetapi tidak ada migrasi database, penetapan identitas usaha, perubahan payment gateway, pembayaran refund, pengaturan cookie vendor, atau perubahan SLA yang dilakukan oleh PR ini.
