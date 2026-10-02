# BuyaLater

Sistem informasi koperasi simpan pinjam berbasis Next.js, TypeScript, Tailwind CSS, Prisma ORM, MySQL, dan NextAuth Credentials.

## Prasyarat

- Node.js 22 atau lebih baru
- npm
- XAMPP dengan MySQL/MariaDB aktif pada port `3306`
- Database MySQL bernama `buyalatter_db`

## Instalasi localhost

1. Masuk ke direktori proyek.

   ```bash
   cd /Users/macpro/Documents/BUYALATTER
   ```

2. Install dependency.

   ```bash
   npm install
   ```

3. Buat database melalui phpMyAdmin atau terminal XAMPP.

   ```bash
   /Applications/XAMPP/xamppfiles/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS buyalatter_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

4. Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial MySQL jika root memiliki password.

   ```env
   DATABASE_URL="mysql://root:@localhost:3306/buyalatter_db"
   AUTH_SECRET="ganti-dengan-secret-random"
   ```

5. Generate Prisma Client. Untuk XAMPP/MariaDB yang mengalami error `mysql.proc`, gunakan SQL schema langsung berikut.

   ```bash
   npx prisma generate
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/buyalatter-init.sql
   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < /tmp/buyalatter-init.sql
   ```

   Pada MySQL/MariaDB yang tidak mengalami masalah metadata, migrasi standar dapat digunakan:

   ```bash
   npx prisma migrate dev --name init
   ```

6. (Opsional) Atur email pengingat dengan Mailtrap — lihat bagian [Notifikasi & email pengingat](#notifikasi--email-pengingat).

7. Isi data dummy Indonesia.

   ```bash
   npm run seed
   ```

8. Jalankan aplikasi.

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

## Identitas visual

Logo ada di `public/images/` (`logo-buyalater.png`, `logo-buyalater-putih.png` untuk latar gelap, `logo-icon.png`; favicon di `src/app/icon.png`). Pakai komponen `<Logo />` di `src/components/ui/logo.tsx`. Warna tema didefinisikan di `src/app/globals.css` (Tailwind v4 tidak memakai `tailwind.config`): `primary #1A2A6C`, `secondary #1E5FC7`, `accent #4FB8EC`. Font: Montserrat (judul) dan Inter (isi).

## Akun dummy

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@buyalatter.com` | `admin123` |
| MANAJER | `manajer@buyalatter.com` | `manajer123` |
| TELLER | `teller@buyalatter.com` | `teller123` |
| ANGGOTA | `budi.santoso@buyalatter.com` | `anggota123` |
| ANGGOTA | email anggota seed lainnya | `anggota123` |

Untuk langsung membuka dashboard admin, gunakan `/login?callbackUrl=/admin/dashboard`.

## Daftar halaman

### Publik

- `/` - Beranda dinamis
- `/tentang` - Tentang koperasi
- `/layanan/simpanan` - Layanan simpanan
- `/layanan/pinjaman` - Layanan pinjaman
- `/simulasi-pinjaman` - Kalkulator angsuran interaktif
- `/galeri` - Galeri dengan filter kategori dan lightbox
- `/galeri/[id]` - Detail galeri
- `/berita` - Daftar berita dari database
- `/berita/[slug]` - Detail berita
- `/faq` - Pertanyaan umum
- `/mitra` - Daftar mitra (sorotan, strategis, pendukung)
- `/kantor-cabang` - Kantor cabang dengan peta OpenStreetMap
- `/keamanan` - Penjelasan keamanan data dan dana
- `/syarat-ketentuan` - Syarat dan ketentuan
- `/kebijakan-privasi` - Kebijakan privasi
- `/kontak` - Form kontak yang menyimpan ke tabel `Pesan`
- `/login` - Login Credentials NextAuth
- `/register` - Registrasi anggota

### Area anggota

Semua route berikut hanya dapat diakses role `ANGGOTA`:

- `/anggota/dashboard`
- `/anggota/profil`
- `/anggota/simpanan`
- `/anggota/penarikan`
- `/anggota/pinjaman`
- `/anggota/pinjaman/ajukan`
- `/anggota/pinjaman/[id]`
- `/anggota/rekening`
- `/anggota/bayar/[angsuranId]`
- `/anggota/pembayaran`
- `/anggota/notifikasi`
- `/anggota/riwayat`

### Area admin

Semua route berikut hanya dapat diakses role `ADMIN`:

- `/admin/dashboard`
- `/admin/anggota`
- `/admin/anggota/tambah`
- `/admin/anggota/[id]`
- `/admin/anggota/[id]/edit`
- `/admin/verifikasi`
- `/admin/simpanan`
- `/admin/penarikan`
- `/admin/pinjaman`
- `/admin/pinjaman/[id]`
- `/admin/pencairan`
- `/admin/pencairan/[id]`
- `/admin/rekening-koperasi`
- `/admin/angsuran`
- `/admin/tunggakan`
- `/admin/pengingat`
- `/admin/verifikasi-pembayaran`
- `/admin/verifikasi-pembayaran/[id]`
- `/admin/galeri`
- `/admin/berita`
- `/admin/banner`
- `/admin/testimoni`
- `/admin/mitra`
- `/admin/pencapaian`
- `/admin/penghargaan`
- `/admin/kantor-cabang`
- `/admin/tampilan-footer`
- `/admin/pesan`
- `/admin/laporan`
- `/admin/pengaturan`

## Notifikasi & email pengingat

- **Cek harian otomatis**: `node-cron` didaftarkan di `src/instrumentation.ts` dan menjalankan `cekJatuhTempo()` (`src/lib/cekJatuhTempo.ts`) setiap hari pukul **08.00 WIB** selama server Next.js berjalan. Jika server mati pada jam itu, pengecekan tidak berjalan — gunakan tombol manual di bawah.
- **Tombol manual**: "Jalankan Pengecekan Sekarang" di `/admin/tunggakan` dan `/admin/pengingat` (untuk demo).
- **Yang dilakukan pengecekan**: angsuran yang jatuh tempo dalam N hari → notifikasi `PENGINGAT`; angsuran lewat jatuh tempo → status `TERLAMBAT`, denda = `jumlah angsuran × dendaPersenPerHari% × hari terlambat`, notifikasi `TERLAMBAT`. Maksimal 1 notifikasi per angsuran per hari.
- **Pengaturan** (`/admin/pengaturan`): denda % per hari (default 0,1), hari pengingat sebelum jatuh tempo (default 3), batas hari terlambat kritis (default 30).
- **Notifikasi otomatis lain**: pinjaman disetujui/ditolak, dicairkan, pembayaran diterima/ditolak.
- **WhatsApp**: tombol "Kirim Pengingat WhatsApp" di `/admin/tunggakan` membuka `https://wa.me/{noHp}` dengan pesan otomatis (tanpa API, admin menekan kirim sendiri).

### Setting Mailtrap (email sandbox)

1. Daftar gratis di [mailtrap.io](https://mailtrap.io), buka **Email Testing → Inboxes → My Inbox → SMTP Settings**, pilih integrasi **Nodemailer** atau lihat kredensial SMTP.
2. Isi di file `.env` (contoh ada di `.env.example`):

   ```env
   SMTP_HOST="sandbox.smtp.mailtrap.io"
   SMTP_PORT="2525"
   SMTP_USER="username-dari-mailtrap"
   SMTP_PASS="password-dari-mailtrap"
   MAIL_FROM="BuyaLater <noreply@buyalatter.com>"
   APP_URL="http://localhost:3000"
   ```

3. **Restart** `npm run dev`, lalu klik "Jalankan Pengecekan Sekarang". Email muncul di inbox Mailtrap, bukan di email anggota asli.
4. Jika `SMTP_*` kosong, email dilewati (status "Email nonaktif" di log) dan notifikasi dalam aplikasi tetap dibuat.

## Perintah berguna

```bash
npm run lint
npx tsc --noEmit
npm run build
npx prisma studio
npm test
```

### Keamanan (Tahap 11A)

- **Migrasi skema** diterapkan manual (XAMPP/MariaDB): `mysql -u root buyalatter_db < prisma/sql/11a-keamanan-transaksi.sql`, lalu `npx prisma generate`.
- **Berkas privat** (KTP, swafoto, bukti transfer/bayar) ada di `storage/private/`, bukan `public/`; dilayani lewat `/api/file/[id]`. Berkas lama dipindahkan dengan `npx tsx prisma/migrasi-berkas.ts`.
- **Peran**: ADMIN, MANAJER, TELLER, ANGGOTA (matriks di `src/lib/akses.ts`). Pencairan di atas batas (default Rp 10.000.000, diatur di Pengaturan) hanya bisa oleh MANAJER.
- **Lupa password**: tautan dikirim lewat SMTP; tanpa SMTP, tautan dicetak ke log server (hanya non-produksi).
### Pinjaman lanjutan (Tahap 11B)

- **Migrasi**: `mysql -u root buyalatter_db < prisma/sql/11b-kyc-akad-shu.sql`, lalu `npx prisma generate`. Unggahan via Server Action dibatasi 12MB (`next.config.ts`).
- **Akad PDF** dibuat dengan `pdf-lib` (`src/lib/akad.ts`). Anggota seed 1–12 berstatus KYC diterima; anggota 13–14 menunggu, 15 ditolak. Pinjaman 05 (Rp 12 juta) menunggu akad; pinjaman 02 punya pengajuan restrukturisasi.
- Anggota yang daftar sendiri harus lolos KYC (`/anggota/verifikasi`) sebelum bisa mengajukan pinjaman.
- `npm run seed` mengosongkan buku mutasi dan audit log (data demo) lalu membuatnya ulang.

Mutasi admin menggunakan Server Actions dan selalu memeriksa peran melalui `requireRole(...)` (`src/lib/otorisasi.ts`); area anggota memakai `requireAnggota()` dan semua query difilter `anggotaId`. Proteksi route Next.js 16 berada pada `src/proxy.ts`, pengganti resmi `middleware.ts`.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
