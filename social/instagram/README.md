# Auto-post Instagram BisaBikinWeb — GitHub Actions

## Status per 4 November 2026
GitHub Actions menjadi jalur publikasi **utama dan terjadwal langsung ke Meta Instagram Graph API** untuk @bisabikinweb.id. Jadwal otomatis Metricool untuk 4–12 November telah dipindah ke **draft + autoPublish=false** agar tidak berbenturan. Penerbitan pertama melalui GitHub pernah berhasil pada 3 November (dicatat di `state.json`), tetapi keberhasilan **jadwal baru** harus diperiksa pada halaman Actions setelah slot terdekat berjalan.

## Jadwal konten (WIB / UTC+7)
10 slot setiap hari: 08:00, 09:30, 11:00, 12:30, 14:00, 15:30, 17:00, 18:30, 20:00, 21:30. GitHub cron disimpan dalam waktu UTC, dan skrip mengambil tanggal dari `Asia/Jakarta`.

Antrean saat migrasi berisi **90 quotes satir orisinal** beserta caption dan poster JPG yang mempertahankan tipografi sesuai referensi Canva: `social/instagram/queue.json`. Aset berasal dari `social/instagram/rendered/fontmatched-2026-11-04-to-12/`. Dari tanggal 4 November, lima slot yang sudah lewat dipindah ke 13 November agar tak hilang. Antrean quote selesai 13 November; tanpa tambahan konten, slot lain otomatis dilewati, bukan mengulang.

## Alur
1. `.github/workflows/instagram-publish.yml` dipicu oleh 10 jadwal harian, atau manual `workflow_dispatch`.
2. Workflow memeriksa apakah **tepat satu** item `approved` ada untuk tanggal dan slot tersebut. Jika kosong, workflow skip aman.
3. `scripts/instagram_autopost.py` memeriksa kelengkapan data, token Meta dan Instagram User ID, hak pakai, kesesuaian akun tujuan, dan `social/instagram/state.json`.
4. Sebelum memanggil endpoint publikasi, skrip merekam item sebagai `claimed` untuk mencegah duplikat. Setelah berhasil, dicatat `published` beserta media ID.
5. Jika muncul `claimed` tetapi gagal, **jangan retry otomatis**: periksa manual kemungkinan konten sudah terbit.

## Kontrol dan keamanan
- Jalur utama **aktif dalam kode** untuk branch `main`; bisa dihentikan dengan menambahkan repository variable GitHub `IG_AUTOPUBLISH_PAUSED=true`.
- Autentikasi membutuhkan GitHub Actions Secrets `IG_ACCESS_TOKEN` dan `IG_USER_ID` yang sudah digunakan pada tes 3 November. Token **tidak ditaruh di kode**, dan status / usia token perlu dicek jika publikasi gagal.
- Seluruh konten harus asli atau berhak pakai dan telah diberi `status=approved`. Jangan memasukkan foto pihak ketiga atau berita yang belum diverifikasi.
- `GITHUB_TOKEN` hanya diberikan izin `contents: write`, dipakai untuk catatan anti-duplikasi.
- Jika GitHub Action terlambat, item tanggal/slot yang lewat **tidak** diulang otomatis. Jadwalkan ulang konten yang terlewat sesudah memeriksa riwayat penerbitan.
- Untuk menghentikan seluruh posting, gunakan pause switch sebelum mengubah antrean. Jangan memindahkan konten kembali ke Metricool tanpa mematikan GitHub terlebih dulu.

## Pantau hasil
- [Workflow Auto Publish](https://github.com/mejaviskinc/bisabikinweb/actions/workflows/instagram-publish.yml)
- [Daftar antrean](https://github.com/mejaviskinc/bisabikinweb/blob/main/social/instagram/queue.json)
- [Catatan publikasi dan anti-duplikat](https://github.com/mejaviskinc/bisabikinweb/blob/main/social/instagram/state.json)

## Catatan tambahan
Skrip evergreen lama masih tersedia sebagai alat terpisah untuk membuat konten edukasi website, **tetapi workflow terjadwal saat ini mengambil quotes dari antrean, bukan evergreen**. Untuk melanjutkan setelah antrean selesai, persiapkan konten baru dan tanggal yang belum dipakai. Jadwal tidak memublikasikan berita terkini atau foto Instagram pihak ketiga secara otomatis.
