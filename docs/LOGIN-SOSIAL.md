# Login dengan Google & Apple

Tombol muncul di `/login` hanya bila kredensialnya diisi di `.env`.

## Aturan
- Hanya untuk **anggota yang sudah terdaftar**: email Google/Apple (harus terverifikasi) dicocokkan dengan email akun. Tidak ada akun baru otomatis, karena pendaftaran wajib KTP/NIK lewat `/register`.
- Admin/Manajer/Teller **tidak bisa** masuk lewat Google/Apple (wajib password).
- Akun yang ditutup/dihapus atau sedang terkunci tetap ditolak.
- Tombol **Apple hanya tampil di perangkat iOS** (iPhone/iPad). Tombol **Google disembunyikan di WebView aplikasi** karena Google menolak OAuth di WebView (`disallowed_useragent`); di aplikasi iOS pakai Apple atau email+password.

## Google
1. https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (dan versi domain produksi).
3. Isi `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET`.

## Apple
Wajib akun Apple Developer (berbayar) dan **domain HTTPS** (Apple tidak menerima localhost; untuk uji lokal pakai tunnel seperti ngrok).
1. Identifiers → Services ID (ini `AUTH_APPLE_ID`), aktifkan Sign in with Apple, Return URL: `https://DOMAIN/api/auth/callback/apple`.
2. Buat Key (Sign in with Apple) dan buat client secret JWT (ES256, maks. 6 bulan): `npx auth add apple` atau generator dari dokumentasi Auth.js. Isi `AUTH_APPLE_SECRET`.
