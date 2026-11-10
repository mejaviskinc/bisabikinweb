# BisaBikinWeb Instagram — Editorial Campuran

## Jalur publikasi

Tetap menggunakan **GitHub Actions → Instagram Graph API (Meta)** melalui `scripts/instagram_autopost.py`. Kredensial di GitHub Secrets, state anti-duplikasi di `social/instagram/state.json`. **Tanpa Metricool, Welder atau sistem publisher baru**.

Workflow `.github/workflows/instagram-25-per-day.yml` dialihkan dari batch 25 quote untuk memilih maksimal **3 konten terkurasi per hari**. Pemantauan berjalan setiap 30 menit UTC, sedangkan slot unggah WIB pada 10.20, 12.30, 18.30 (hanya bila ada item yang disetujui, sumber belum kedaluwarsa, dan kuota tersedia). Tidak ada postingan otomatis untuk tanggal di luar daftar terverifikasi.

## Arsip lama dan pengaman

- `social/instagram/queue.json` (95 entri) dan `social/instagram/state.json` **tidak dihapus atau diubah**. 90 quote satir disimpan sebagai arsip, bukan lagi input jadwal aktif.
- Workflow quote lima item sebelumnya sudah memiliki jadwal bertanggal 9 November saja; jangan memicu manual tanpa audit state.
- ID, tanggal+slot, judul, dan caption harus unik. Status approved dan metadata fact_checked/rights_verified wajib; status claimed/published pada state lama tetap menjadi blokir.
- Berita sumber lebih tua dari 72 jam tidak boleh masuk kategori news. Analisis kebijakan lama ditulis sebagai konteks, **bukan breaking news**.
- Viral tanpa bukti tidak dianggap berita; boleh menjadi konten literasi cek fakta, disebut terang-terangan.
- Gambar adalah tipografi/bentuk orisinal 1080×1350 JPEG. Jangan gunakan foto orang, screenshot berita, logo pihak ketiga, atau sumber tanpa hak.
- Jika API, kuota, renderer, atau penyimpanan JPEG publik gagal, proses berhenti sebelum penerbitan; jangan mengulang item berstatus claimed.
- Pratinjau semua enam gambar dibuat offline saat pull request dan disimpan sebagai artifact GitHub Actions untuk QA.

## Komposisi dan sumber awal

| WIB | Kategori | Sumber |
| --- | --- | --- |
| 11 Nov 10.20 | Pemerintah | Komdigi 5 Nov (analisis) |
| 11 Nov 12.30 | Teknologi | Reuters 9–10 Nov (berita) |
| 11 Nov 18.30 | Edukasi website | Naskah orisinal |
| 12 Nov 10.20 | Ekonomi / UMKM | ANTARA 5 Nov (analisis) |
| 12 Nov 12.30 | Tren / viral | Literasi digital, Komdigi 23 Okt |
| 12 Nov 18.30 | Promosi | Layanan resmi BisaBikinWeb |

Perbarui `content.json` dengan item baru yang sudah diperiksa sumber, tanggal, hak visual, dan kualitas. `reviewed_on` serta `expires_on` harus sesuai. Jika tidak ada konten layak, **lebih aman tidak memposting** daripada memakai arsip kutipan berulang.

## Operasional

Saat pull request: jalankan quality gate, test dan render preview. Setelah merge: GitHub Actions otomatis memilih konten sesuai slot, membuat JPEG orisinal di cabang `instagram-assets`, memeriksa URL publik, dan memublikasikan melalui Meta. Periksa `state.json` dan log `PUBLISHED ... media_id=...` sebelum mengklaim tayang. Jika ada commit GitHub Actions yang lebih baru, bandingkan state terbaru sebelum mengubah antrean.

