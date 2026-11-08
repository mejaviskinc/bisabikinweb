# Basis Pengetahuan Riset BisaBikinWeb

Arsip editorial untuk menunjang riset berulang, berita aktual, dan artikel edukatif di https://bisabikinweb.site/. File di sini adalah **catatan riset**, bukan klaim berita sudah diterbitkan. Website pengguna hanya menayangkan materi yang telah melewati verifikasi fakta, izin/lisensi visual, serta pemeriksaan editorial.

## 15 kategori yang dipantau
1. Briket & Energi
2. Digitalisasi & Website
3. Furniture & Kayu
4. Kakao & Coklat
5. Kelapa & Turunannya
6. Kopi
7. Logistik & Pengiriman
8. Manajemen Risiko
9. Peluang Usaha
10. Pertanian & Buah
11. Regulasi & Sertifikasi
12. Rempah & Minyak Atsiri
13. Sarang Burung Walet
14. Seafood & Perikanan
15. Tren & Analisis Pasar

"Semua" hanya filter tampilan, bukan kategori.

## Lokasi penyimpanan harian
- `research/daily/YYYY-MM-DD-news.json`: temuan dan kandidat berita hasil tugas editor berita.
- `research/daily/YYYY-MM-DD-articles.json`: data pendukung, intent pencarian, dan kandidat artikel evergreen hasil tugas artikel.
- Buat file hanya setelah riset benar-benar dijalankan; jangan membuat entri fakta fiktif.

## Skema minimum (per entri)
```json
{
  "id": "slug-unik-tanggal",
  "category": "Kopi",
  "topic": "Topik terverifikasi",
  "summary": "Parafrasa orisinal, tidak menyalin artikel sumber",
  "event_date": "YYYY-MM-DD atau null",
  "source_published_at": "YYYY-MM-DD atau null",
  "researched_at": "ISO-8601 WIB",
  "geography": "Negara/wilayah relevan",
  "facts": [{"claim": "Klaim yang didukung sumber", "source_urls": ["https://..."]}],
  "sources": [{"url": "https://...", "publisher": "Nama lembaga/media", "accessed_at": "ISO-8601 WIB"}],
  "practical_impact": "Dampak bagi UMKM/eksportir/pembaca",
  "content_angle": "Ide berita atau artikel yang menambah nilai",
  "keyword_intent": "Kata kunci dan maksud pencarian, jika relevan",
  "editorial_status": "verified | needs_verification | no_meaningful_update",
  "content_status": "research_only | drafted | scheduled | live",
  "published_url": null,
  "recheck_after": "YYYY-MM-DD atau null"
}
```

## Aturan kualitas
- Gunakan sumber primer/resmi bila menyangkut regulasi, tarif, syarat sertifikasi, dan data statistik; selalu simpan tautan sumber serta tanggal.
- Bedakan kejadian, tanggal publikasi sumber, tanggal verifikasi, prediksi, dan opini. Jangan menyatakan belum diverifikasi sebagai fakta.
- Tidak ada bukti baru yang valid = catat "no_meaningful_update"; jangan membuat berita palsu hanya untuk memenuhi kuota.
- Periksa arsip tanggal sebelumnya dan artikel/berita yang sudah live untuk menghindari peristiwa, judul, sudut pandang, dan slug duplikat.
- Tulis ringkasan original; jangan mengarsipkan naskah lengkap atau foto berhak cipta tanpa izin.
- Jangan menyimpan data pribadi, token API, kredensial, lead, atau informasi rahasia dalam repositori ini.
- Saat eksekusi berulang, gabungkan perubahan secara idempotent; hindari menimpa catatan tugas lain. Pertahankan jejak pembaruan dan koreksi fakta.
- Jika penyimpanan GitHub tidak tersedia atau gagal, laporkan kegagalannya, jangan klaim arsip berhasil disimpan.
- Arsip mentah bukan otomatis bagian dari website. Hanya konten yang disetujui dan telah dibangun serta diverifikasi live yang boleh disebut dapat dibaca pengguna.

Pengumpulan arsip harian dan publikasi artikel/berita ditangani oleh otomatisasi editor BisaBikinWeb yang dijalankan secara terpisah.
