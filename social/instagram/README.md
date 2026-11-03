# Instagram BisaBikinWeb: GitHub Actions auto-publish

**Status kode:** workflow jadwal terpasang tetapi pekerjaan publikasi tetap **terkunci** hingga GitHub variable `IG_AUTOPUBLISH_ENABLED=true` dan dua Instagram Secrets dipasang. Tidak ada token Meta dalam repo. Tidak ada postingan sungguhan yang diuji saat pengembangan.

## Proses setiap hari (Asia/Jakarta)
- Lima slot: 09:00, 10:30, 12:30, 16:30, 18:30 WIB.
- GitHub Actions menjalankan `.github/workflows/instagram-publish.yml` di `main`.
- `scripts/instagram_prepare.py` memilih konten manual yang `approved` dari `queue.json`, atau konten orisinal dari `evergreen_bank.json`.
- Untuk konten evergreen, Pillow membentuk poster **JPEG 1080 × 1350** dengan teks dan bentuk asli, lalu menyimpannya pada branch publik `instagram-assets`. Tidak ada foto pihak ketiga atau scraping berita.
- Sistem memeriksa URL gambar publik, kelengkapan caption, hak pakai, fakta, dan ID akun tujuan sebelum memanggil Meta.
- `scripts/instagram_autopost.py` menulis status **claimed** ke `state.json` di `main` sebelum membuat media container Meta; kemudian menunggu `FINISHED`, memanggil `media_publish`, dan menyimpan ID postingan.
- Jika terjadi error setelah status `claimed`, **jangan mengulang otomatis**: periksa akun Instagram dan status media secara manual agar tidak ada duplikasi.

## Konten awal
- `social/instagram/evergreen_bank.json` berisi **70 konten edukasi dan promosi orisinal** untuk **4–17 November 2026** (14 hari × 5 slot).
- Topik: bisnis digital, tips website, SEO/teknologi, solusi website, dan BisaBikinWeb. Bukan berita aktual dan tidak memakai foto Instagram orang lain.
- Setelah 17 November 2026, sistem **skip**, tidak mengarang/mengulang konten. Tambahkan lebih banyak hari ke kategori bank, atau masukkan konten berlisensi ke `queue.json`. Jika ada konten manual berstatus `draft` di slot tertentu, sistem **skip** dan tidak menimpanya dengan evergreen.
- Desain visual dibuat skrip Pillow, **bukan** ekspor dari template Canva; penghubung Canva belum tersedia.

## Aktivasi awal (dilakukan pemilik akun)
1. Pastikan Pull Request #20 telah di-merge dan GitHub Actions diaktifkan untuk repository.
2. Masuk ke [Actions Secrets](https://github.com/mejaviskinc/bisabikinweb/settings/secrets/actions) → **New repository secret**:
   - `IG_ACCESS_TOKEN`: token Meta yang dapat mengakses profil dan memublikasikan konten sesuai konfigurasi login.
   - `IG_USER_ID`: ID numerik Instagram profesional **@bisabikinweb.id** (bukan username, App ID, atau Business Portfolio ID).
3. Di **Actions → Variables**:
   - `IG_GRAPH_BASE=https://graph.facebook.com` untuk Unified Login (ubah hanya jika Meta memberikan base endpoint lain);
   - `IG_GRAPH_VERSION=v26.0`, sesuaikan dengan versi API pada aplikasi Meta;
   - **`IG_AUTOPUBLISH_ENABLED=false`** selama tahap verifikasi.
4. Di tab **Actions**, jalankan secara manual **Instagram BisaBikinWeb Check Connection (Read Only)**. Pastikan hasil `CONNECTION_OK` dan akun yang terbaca benar. Pemeriksaan ini **tidak menguji izin publish**.
5. Jalankan **Instagram BisaBikinWeb Preview Aman**. Ia merender gambar dan validasi antrean **tanpa Meta API/token**.
6. Bila kamu setuju publikasi otomatis dan semua kredensial/izin terbukti tepat, ubah GitHub Variable `IG_AUTOPUBLISH_ENABLED=true`. Dengan izin ini, GitHub mulai melakukan publikasi pada slot berikutnya. Mulai dari **satu slot manual** di Actions untuk uji publikasi nyata sebelum mengandalkan jadwal harian.
7. Pantau [Actions](https://github.com/mejaviskinc/bisabikinweb/actions) dan `social/instagram/state.json`.

**PENTING:** Pengaturan secret tidak dapat dilakukan melalui koneksi GitHub ini; pemilik repository harus mengisinya sendiri. Jangan kirim token ke chat. Publikasi tidak terjadi sampai semua langkah di atas selesai.

## Pengujian pengembangan
```sh
python3 -m unittest discover -s tests -p 'test_instagram_autopost.py' -v
python3 -m pip install Pillow==12.0.0
python3 scripts/instagram_prepare.py --dry-run --date 2026-11-04 --slot 09:00
python3 scripts/instagram_autopost.py --dry-run --queue social/instagram/.runtime/runtime_queue.json --date 2026-11-04 --slot 09:00
```

## Format override manual
```json
{
  "items": [{
    "id": "bbweb-20261106-0900-example",
    "date": "2026-11-06",
    "slot": "09:00",
    "status": "draft",
    "fact_checked": true,
    "rights_verified": true,
    "rights_note": "Aset dibuat sendiri oleh BisaBikinWeb",
    "source_url": "https://bisabikinweb.site/",
    "image_url": "https://public-example.com/owned-image.jpg",
    "caption": "Caption orisinal untuk akun BisaBikinWeb."
  }]
}
```
Status `draft` akan **dilewati**. Ubah ke `approved` hanya setelah gambar HTTPS JPEG publik, informasi, hak pakai, dan caption diperiksa. Jangan memasukkan placeholder ke antrean produksi.

## Batasan
- Penjadwalan GitHub Actions bisa terlambat/terlewat saat platform sibuk; tidak ada jaminan tepat menit.
- Token Meta bisa kedaluwarsa dan wajib dirotasi sesuai aturan Meta. Publisher memakai mekanisme Instagram Graph API dua tahap: media container → media_publish.
- Otomatisasi tidak mencakup riset berita real-time, pengambilan foto Instagram pihak ketiga, AI berbayar, atau template Canva. Evergreen awal dimaksudkan sebagai konten aman untuk menguji sistem.
- Asset branch `instagram-assets` harus ada dan tetap publik; ia sudah dibuat pada repo publik BisaBikinWeb.
- State commit di `main` bisa memicu deploy website GitHub Pages yang sudah ada. Tidak ada file website yang ditimpa secara langsung oleh modul ini.

Rujukan: [Meta Instagram API official Postman](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) dan [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
