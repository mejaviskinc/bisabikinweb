# Finance x Marketing — Pricing Guardrails
Disusun 10 November 2026. Dokumen strategi DRAFT, bukan perubahan harga live.

## Harga yang telah ada di website
Sumber: static-source/lib/data.ts branch main pada 10-11-2026.
| Paket | Harga publik | Keterangan |
|---|---:|---|
| Starter | Rp800.000 | Landing/personal |
| Business | Rp1.500.000 | Company profile |
| Commerce | Rp3.500.000 | Online store |
| Custom | Berdasarkan proposal | Custom web app |

## Aturan harga minimum
Rumus: **harga minimum = (biaya langsung + alokasi overhead proyek + biaya pemasaran per proyek + buffer risiko) / (1 - target margin)**.
Biaya langsung wajib mencakup jam produksi x tarif internal, desain, copy, domain/hosting (jika termasuk), aset berbayar, biaya transaksi, QA, revisi dan support awal. Angka berikut hanya **skenario** untuk menguji harga, BUKAN biaya aktual.

| Paket | Harga | Skenario biaya langsung+alokasi | Margin kotor simulasi | Ambang biaya pada target margin 40% |
|---|---:|---:|---:|---:|
| Starter | Rp800.000 | Rp400.000 | 50% | Rp480.000 |
| Business | Rp1.500.000 | Rp750.000 | 50% | Rp900.000 |
| Commerce | Rp3.500.000 | Rp2.000.000 | 42,9% | Rp2.100.000 |

**Keputusan:** Jangan umumkan promo diskon 20–50% tanpa menguji total biaya. Tambahkan manfaat konsultasi awal gratis karena beban pelaksanaannya lebih terukur daripada diskon harga yang tidak diketahui marginnya.

## Retainer sebagai produk layanan
Harga *usulan*, bukan live:
- Care Rp350.000/bulan. Monitoring basic bulanan, pemeriksaan backup dan 1 pembaruan konten minor (maks. 30 menit). Jika biaya riil lebih tinggi, naikkan harga/kurangi scope.
- Growth Rp750.000/bulan. Care + 3 pembaruan konten minor (masing-masing maks. 30 menit), pemeriksaan SEO teknis sederhana dan ringkasan bulanan.
Kedua paket: domain/hosting, lisensi, plugin, backup eksternal berbayar, penambahan fitur, perubahan desain besar, integrasi, dan SEO ranking guarantee tidak termasuk. Definisikan SLA realistis, jam layanan, mekanisme tiket dan pembatalan di kontrak.

## KPI keputusan
- Awal sebelum promosi berbayar: margin kotor proyek >= 40% (target manajemen yang harus dikonfirmasi); idealnya menguji >= 50%.
- Biaya akuisisi maksimal: CAC < laba kotor dari proyek pertama **atau** pastikan payback ditetapkan bila retainer jangka panjang.
- Pengeluaran marketing baru: tunda hingga diketahui kas tersedia, tagihan vendor, biaya operasional, serta nilai invoice jatuh tempo.
- Klien baru mendapat proposal dengan termin pembayaran dan scope tertulis, bukan promosi harga yang dapat disalahartikan.

## Pengelolaan penerimaan
Catat **omzet diterima** (paid), **invoice outstanding**, **pendapatan recurring** (kontrak aktif), **biaya produksi langsung**, **biaya operasional**, dan **saldo kas** secara terpisah. Jangan hitung proposal atau lead sebagai omzet. Sertakan biaya payment gateway di unit economics dan rekonsiliasi callback DOKU sebelum menandai paid.

## Template evaluasi proyek
Harga ditawarkan: ___
Jam produksi: ___ × tarif internal Rp___ = Rp___
Aset, domain, hosting, tools, pembayaran: Rp___
Biaya revisi/QA/support: Rp___
Biaya pemasaran teralokasi: Rp___
Total biaya: Rp___
Laba kotor estimasi: Harga - biaya = Rp___
Margin kotor: Laba kotor / harga × 100 = ___%
Keputusan: layak / sesuaikan scope / naikkan harga / tolak.
