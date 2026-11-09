# OTP email login pembeli — konfigurasi yang wajib diselesaikan

**Status:** kode frontend disiapkan di branch fitur; **jangan merge ke produksi sebelum SMTP dan template OTP siap serta diuji dengan akun pembeli asli**.

## Tujuan dan ruang lingkup

- Halaman pembeli `/account/` secara default menampilkan **Login dengan OTP email**; login password tetap bisa dipilih sebagai cadangan.
- Pendaftaran akun pembeli kini memakai **kode aktivasi 6 digit** pada halaman yang sama, bukan mengarahkan pelanggan hanya ke tautan. Reset password serta autentikasi seller/admin tidak diubah.
- Request OTP ditangani oleh Supabase Auth, tanpa membuat user baru otomatis (`create_user: false`). Kode diverifikasi oleh Supabase, bukan JS frontend.
- Identitas pengirim yang diinginkan: **BisaBikinWeb <bussines@bisabikinweb.site>**, alamat mailbox Hostinger yang telah terhubung.
- Mengubah SMTP pada proyek Supabase akan mengubah pengirim semua email Auth dari proyek tersebut (konfirmasi pendaftaran, reset password, email seller dan admin), bukan hanya OTP pembeli.

## Pengaturan SMTP

1. Buka `https://supabase.com/dashboard/project/kdlrobdzlxpjlkxbvzsd/auth/smtp`, aktifkan **Custom SMTP**.
2. Isi sender name `BisaBikinWeb`, sender address `bussines@bisabikinweb.site`.
3. Host: `smtp.hostinger.com`; port: **465 (SSL)**, atau **587 (STARTTLS)** jika koneksi port 465 gagal.
4. Username: `bussines@bisabikinweb.site`; password: **password email dari hPanel Hostinger**. Setel langsung di dashboard Supabase; **jangan menaruh password di GitHub, frontend, chat, atau file konfigurasi publik**.
5. Pastikan domain memiliki SPF, DKIM, dan DMARC sesuai pengaturan Hostinger.

## Pengaturan template OTP

Buka `https://supabase.com/dashboard/project/kdlrobdzlxpjlkxbvzsd/auth/templates`. Ubah **dua template berbeda** pada proyek Supabase yang sama:

**Magic Link / OTP login** — gunakan:

- Subject: `Kode verifikasi login — BisaBikinWeb`
- HTML: salin `docs/templates/customer-otp.html`.

**Confirm Sign Up (verifikasi akun baru)** — gunakan:

- Subject: `Kode aktivasi akun — BisaBikinWeb`
- HTML: salin `docs/templates/customer-signup-otp.html`.

**Penting:** kedua template harus berisi `{{ .Token }}`, bukan hanya `{{ .ConfirmationURL }}`. Untuk **Magic Link / OTP login** harus menggunakan kode tanpa link. Untuk **Confirm Sign Up**, template menempatkan kode sebagai verifikasi utama pembeli namun mempertahankan tautan konfirmasi cadangan agar pendaftaran seller/admin yang masih memakai tautan tidak terputus. Template ini dipakai bersama di satu proyek Supabase.

Pengubahan template Supabase berlaku di semua aplikasi yang menggunakan proyek Auth ini, termasuk seller/admin. Verifikasi dampaknya pada alur seller dan admin sebelum deploy. URL Configuration: Site URL `https://bisabikinweb.site`, dan redirect yang benar untuk `/account/`.

## Keamanan dan pengujian sebelum merge

1. Atur masa kedaluwarsa kode, misalnya **600 detik (10 menit)**, dari Authentication → Sign In / Providers → Email. Batasi permintaan ulang OTP melalui Rate Limits dan aktifkan CAPTCHA untuk mencegah email bombing.
2. Coba pendaftaran akun pembeli baru dengan template Confirm Sign Up: email berisi kode 6 digit, masukkan kode lalu masuk ke akun.
3. Coba akun pembeli yang sudah diverifikasi: minta kode, cek email masuk dengan **From** yang benar, masukkan enam digit, lalu pastikan dashboard dan riwayat pesanan hanya tampil untuk akun itu.
4. Coba kode salah, kode kedaluwarsa, pengiriman ulang, alamat email belum terdaftar, dan folder spam.
5. Coba login password sebagai fallback, reset password dan verifikasi pendaftaran, serta login seller/admin. Jangan menyatakan SMTP aktif sebelum pengujian email nyata berhasil.

Dokumentasi resmi: https://supabase.com/docs/guides/auth/auth-smtp dan https://supabase.com/docs/guides/auth/auth-email-passwordless serta https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/.
