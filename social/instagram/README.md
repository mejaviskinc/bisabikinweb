# Instagram BisaBikinWeb: GitHub Actions auto-post (NONAKTIF)

**Keamanan:** Branch ini hanya menyiapkan sistem, tidak memublikasikan apa pun. Alur preview hanya manual. File jadwal bernama instagram-publish.yml.disabled sehingga GitHub tidak akan menjalankannya. Queue produksi kosong.

## File
- .github/workflows/instagram-preview.yml: pengujian manual tanpa token, tanpa Meta API.
- .github/workflows/instagram-publish.yml.disabled: konfigurasi lima jadwal WIB yang BELUM AKTIF.
- scripts/instagram_autopost.py: Python standard library, mode dry-run/publish; default tidak memublikasikan.
- social/instagram/queue.json: antrean kosong; hanya entry approved yang valid bisa dipublikasikan setelah aktivasi.
- social/instagram/state.json: catatan klaim/publikasi; klaim dibuat sebelum panggilan Meta agar tidak menggandakan post saat terjadi kegagalan.
- social/instagram/examples/sample_queue.json: hanya simulasi, tidak boleh dipublikasikan.

## Cara menguji (tanpa publikasi)
Setelah PR di-merge, buka GitHub repo → Actions → Instagram BisaBikinWeb Preview Aman → Run workflow. Tidak ada akses token atau panggilan ke Meta. Secara lokal:
python3 -m unittest discover -s tests -p test_instagram_autopost.py -v
python3 scripts/instagram_autopost.py --dry-run --queue social/instagram/examples/sample_queue.json --date 2026-11-04 --slot 09:00

## Simpan token Meta ke GitHub Secrets
Buka repository mejaviskinc/bisabikinweb → Settings → Secrets and variables → Actions → tab Secrets → New repository secret:
1. IG_ACCESS_TOKEN: token dari Meta Developers, jangan dikirim ke chat atau dimasukkan ke kode.
2. IG_USER_ID: ID numerik akun Instagram profesional @bisabikinweb.id (bukan username, Facebook App ID atau Business Portfolio ID).

Di tab Variables, atur:
- IG_AUTOPUBLISH_ENABLED = false (biarkan tetap false sampai pengujian live sukses dan kamu meminta aktivasi).
- IG_GRAPH_BASE = https://graph.facebook.com atau https://graph.instagram.com, sesuai tipe token dan endpoint yang ditampilkan Meta untuk aplikasi Unified Login.
- IG_GRAPH_VERSION = v26.0 (konfirmasi pada Meta Developers).

GitHub Actions menyediakan GITHUB_TOKEN sendiri untuk menandai state. Saat nanti diaktifkan, workflow memerlukan permission contents: write. Jangan pernah mencetak token di output log.

## Format antrean produksi
Tambahkan tepat satu entri per tanggal dan slot di queue.json. Contoh STRUKTUR saja (URL ini placeholder dan tidak siap terbit):

{"items":[{"id":"bbweb-20261106-0900-website","date":"2026-11-06","slot":"09:00","status":"approved","fact_checked":true,"rights_verified":true,"rights_note":"Original asset milik BisaBikinWeb","source_url":"https://bisabikinweb.site/","image_url":"https://DOMAIN-GAMBAR-PUBLIK/contoh.jpg","caption":"Konten edukasi website yang telah diperiksa."}]}

Slot waktu: 09:00, 10:30, 12:30, 16:30, 18:30 (WIB). URL JPEG harus publik dan dapat diambil oleh server Meta. Semua berita harus diverifikasi; hak pakai gambar harus ada. Hasil desain Canva memerlukan tahap ekspor JPG dan hosting publik terlebih dahulu—otomatisasi Canva/riset AI belum menjadi bagian modul ini.

## Sebelum aktivasi
1. Verifikasi token dan izin publish sesuai jalur login Meta (misalnya instagram_content_publish pada Unified Login atau instagram_business_content_publish pada Instagram Login).
2. Verifikasi IG_USER_ID dan respons GET profil username yang benar.
3. Isi Secrets/Variables, tetap IG_AUTOPUBLISH_ENABLED=false.
4. Siapkan satu konten asli dengan gambar JPEG publik dari Canva; jalankan preview lokal dan Actions.
5. Setelah ada persetujuan eksplisit, lakukan satu uji publikasi LIVE yang diawasi pada akun Instagram dan pastikan statusnya benar.
6. Setelah tes berhasil, lakukan perubahan PR TERPISAH untuk mengubah .disabled menjadi .yml, lalu set variable IG_AUTOPUBLISH_ENABLED=true.
7. Konten berstatus claimed pada state.json tidak boleh diulang otomatis. Cek akun Instagram dan hasil Meta dahulu apabila terjadi error setelah claim.
8. Token bisa kedaluwarsa/dirotasi; buat prosedur pembaruan token secara aman.

Catatan: GitHub schedule berjalan pada branch default dan dapat terlambat. Five-slot scheduling sudah disiapkan tetapi belum dieksekusi.

Dokumentasi: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
Meta resmi: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
