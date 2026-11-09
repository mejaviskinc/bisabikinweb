# OTP email login pembeli — konfigurasi yang wajib diselesaikan

**Status:** kode frontend disiapkan di branch fitur; **jangan merge ke produksi sebelum SMTP dan template OTP siap serta diuji dengan akun pembeli asli**.

## Tujuan dan ruang lingkup

- User pada halaman `/account/` bisa memilih **Login dengan OTP email** tanpa password. Login password, pendaftaran, reset password, dan autentikasi seller/admin tidak diubah.
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

Buka `https://supabase.com/dashboard/project/kdlrobdzlxpjlkxbvzsd/auth/templates`. Pada **Magic Link** template, gunakan:

- Subject: `Kode verifikasi login — BisaBikinWeb`
- HTML: salin `docs/templates/customer-otp.html`. **Penting:** harus ada `{{ .Token }}`, tidak hanya `{{ .ConfirmationURL }}`. Jika template masih hanya menampilkan confirmation URL, Supabase akan mengirim magic link, bukan kode 6 digit yang dapat diketik.

Template Magic Link/OTP berlaku pada proyek yang sama. Periksa layanan lain yang menggunakan auth ini sebelum mengganti template. URL Configuration: Site URL `https://bisabikinweb.site`, dan redirect yang benar untuk `/account/`.

## Keamanan dan pengujian sebelum merge

1. Atur masa kedaluwarsa kode, misalnya **600 detik (10 menit)**, dari Authentication → Sign In / Providers → Email. Batasi permintaan ulang OTP melalui Rate Limits dan aktifkan CAPTCHA untuk mencegah email bombing.
2. Coba akun pembeli yang sudah diverifikasi: minta kode, cek email masuk dengan **From** yang benar, masukkan enam digit, lalu pastikan dashboard dan riwayat pesanan hanya tampil untuk akun itu.
3. Coba kode salah, kode kedaluwarsa, pengiriman ulang, alamat email belum terdaftar, dan folder spam.
4. Coba login password sebagai fallback, reset password dan verifikasi pendaftaran, serta login seller/admin. Jangan menyatakan SMTP aktif sebelum pengujian email nyata berhasil.

Dokumentasi resmi: https://supabase.com/docs/guides/auth/auth-smtp dan https://supabase.com/docs/guides/auth/auth-email-passwordless serta https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/.
