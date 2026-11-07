# Peta 600 Keyword Jasa Bikin Web — BisaBikinWeb.id

Domain utama: https://bisabikinweb.site/
600 keyword unik, dipetakan ke **61 halaman tujuan**. Daftar ini rencana target pencarian, bukan data volume atau laporan peringkat Google.

| Kelompok | Keyword | Tujuan |
|---|---:|---|
| Nasional | 40 | Beranda untuk jasa umum; harga untuk kueri biaya |
| Jenis website | 144 | Halaman layanan; harga untuk kueri biaya |
| Industri | 160 | Solusi industri yang memiliki contoh portofolio, studi kasus untuk pencarian contoh, atau layanan yang relevan |
| Lokasi | 216 | Kota prioritas dan provinsi yang sudah indexable |
| Fitur | 40 | Layanan sesuai kebutuhan; harga untuk kueri biaya |
| Total | 600 | 61 URL utama dalam domain yang sama |

## Penerapan

- Beranda fokus jasa bikin web nasional dan variasi yang memiliki kebutuhan sama.
- Semua kueri dengan intent biaya diarahkan ke `/harga/`, termasuk biaya fitur. Pemetaan ini mengarahkan optimasi; Google tetap memilih URL dan posisi hasil pencarian.
- Fashion, skincare, dan travel memiliki halaman `/industri/` berisi alur bisnis, persiapan materi, FAQ, serta contoh portofolio yang sudah tercatat.
- Pencarian contoh pada tiga industri tersebut diarahkan ke studi kasus proyek yang sesuai.
- `/solusi/` menjadi direktori pilihan layanan, harga, studi kasus dan wilayah. Pencarian/filter mengenali 600 variasi kata, tetapi kartu langsung menuju 61 tujuan utama. Semua kartu tersedia sebagai tautan HTML pada hasil render awal.
- URL brief `/solusi/NNN-.../` lama tetap tersedia dan noindex. Tidak mengklaim redirect 301: GitHub Pages tidak menyediakan konfigurasi redirect HTTP per rute. Tautan utama dan terkait dari brief diarahkan ke tujuan relevan.
- Status editorial wilayah yang sudah ada dipertahankan; tidak membuka indeks halaman lokal yang masih draft secara massal.

## Pembaruan data

Sumber pemetaan: `keyword-targets-600.json`. Setelah mengubah target, jalankan:

```sh
node scripts/sync-seo-targets.mjs
npm test
npm run build
npm run test:output
```

Script menyelaraskan CSV, data runtime, dan `target-summary.json` tanpa mengubah URL brief lama. Tes memeriksa jumlah, keunikan, konsistensi data, tujuan indexable, serta konten dan metadata halaman industri.

## Tindak lanjut

Pantau kueri, impresi, klik, CTR, serta konsultasi masuk melalui data aktual. Tambahkan industri atau daerah ketika kebutuhan dan materi pendukungnya tersedia. Desain berbeda saja bukan alasan menerbitkan halaman untuk setiap variasi keyword.
