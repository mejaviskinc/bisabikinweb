# BisaBikinWeb — Production UI Quality Standard

## Audit awal (10 November 2026)
- Repo utama: mejaviskinc/bisabikinweb; branch production: main.
- Website adalah React + Vite, dengan generator HTML statis melalui build-pages.mjs dan GitHub Pages.
- Main styles berada di static-source/styles.css (~120 KB), sehingga selector global dan override berulang berisiko merusak halaman lain.
- Style yang sudah ada: background #080a09, panel #111411, teks #f2f3ee, accent #c3f85c. Tema light tersedia via CSS variables.
- Logo dan heading pembayaran terisolasi di static-source/components/FooterPaymentMethods.tsx.
- Video preview ecommerce terisolasi di static-source/features/EcommerceShowcase.tsx dan reuse komponen portofolio.
- Workflow pages.yml dapat publish secara otomatis dari main dan jadwal 15 menit. Existing npm tests tidak membandingkan screenshot.
- Live site belum dapat diakses dari browser audit awal; tidak ada klaim bahwa screenshot production sudah selesai sampai artefak browser CI dapat diverifikasi.

## Design system implementation
- Variables existing di static-source/styles.css tetap sebagai sumber warna/layout sekarang.
- Alias token aman di static-source/design-system/tokens.css; tidak ada global override.
- Komponen opt-in baru di static-source/components/ui/UiPrimitives.tsx (UiSection, UiCard, UiButtonLink), dengan CSS scoped.
- Migrasi komponen lama ke primitives dilakukan per halaman hanya setelah baseline dan review disetujui.
- Perbaikan UI harus menyentuh komponen pemilik dan CSS namespaced, bukan memperbarui seluruh stylesheet.

## Baselines dan quality gate
Routes: /, /jasa/ecommerce/, /portfolio/, /beli-website/.
Per route: 1440 x 900 (desktop) dan 390 x 844 (mobile).
- Pull request ke main menjalankan workflow UI Visual Quality Gate.
- Base branch main dibuild dengan mode offline (tidak bergantung pada artikel database live).
- Playwright 1.56.1 di Chromium menghasilkan 8 screenshot base dan membandingkan dengan branch kandidat.
- Test interaksi memastikan label Metode Pembayaran, BCA, QRIS, kontrol preview desktop/mobile, serta tidak ada overflow horizontal.
- Workflow juga mencoba mengambil screenshot website production sebagai artefak terpisah, dengan capture-report.json. Kegagalan akses live harus dilaporkan, bukan dianggap berhasil.
- Perubahan screenshot yang tidak disengaja membuat test gagal. Perubahan yang disengaja harus ditinjau, bukan auto-approve.

## Aturan wajib sebelum merge/deploy
1. Satu revisi hanya pada komponen yang diminta; jangan menghapus konten/fitur yang tidak terkait.
2. Bandingkan tampilan desktop/mobile dengan baseline dan periksa semua perbedaan.
3. Lulus npm test, npm run build, npm run test:output, Playwright visual test dan interaksi.
4. Nama PR mencantumkan komponen dan risiko UI yang disentuh.
5. Aktifkan GitHub branch protection pada main: PR required, review required, required status check visual-regression.
6. Jangan merge/deploy sebelum semua check berhasil; pertahankan rollback commit sebelumnya.
7. Setelah merge, pantau hasil produksi sebelum menganggap pekerjaan selesai.

## Catatan batasan
- Workflow PR ini belum otomatis mengaktifkan branch protection. Tanpa aturan tersebut, direct push ke main serta scheduled Pages deploy masih bisa lolos tanpa visual gate. Aturan branch protection atau integrasi gate ke publish job wajib diverifikasi sebelum disebut production-enforced.
- Baseline dari main adalah baseline kode, bukan bukti kesamaan dengan live site yang mungkin tertunda deploy.
- Uji screenshot menggunakan viewport pertama, bukan semua halaman/keadaan dan bukan pengujian transaksi pembayaran nyata.
- Video hanya disembunyikan pada screenshot pembanding deterministik; produksi tidak diubah. Capture live tidak menyembunyikan video.
