# Product Requirements Document

## BuyaLater

**Versi:** 3.0  
**Tanggal:** 10 Oktober 2026  
**Status:** Implementasi MVP akademik  
**Bahasa produk:** Bahasa Indonesia

## 1. Ringkasan Produk

BuyaLater adalah **Koperasi Simpan Pinjam Digital untuk Anggota** (close loop: hanya melayani anggota terverifikasi, bukan pinjaman online), mengacu pada Permenkop UKM 8/2023 untuk suku bunga dan mengadopsi prinsip pelindungan konsumen POJK 22/2023. Aplikasi web ini membantu membantu pengurus mengelola anggota, simpanan, penarikan, pinjaman, pencairan, angsuran, penagihan, konten informasi, dan laporan keuangan. Anggota dapat melihat kondisi keuangan pribadi, mengajukan layanan koperasi, membayar angsuran, dan menerima pengingat secara digital.

Produk berjalan pada localhost menggunakan Next.js App Router, TypeScript, Tailwind CSS v4, Prisma ORM, MySQL/MariaDB XAMPP, NextAuth Credentials, bcrypt, node-cron (jadwal harian), Nodemailer (email, Mailtrap sandbox), dan lucide-react (ikon).

> Proyek ini adalah tugas akademik. Seluruh data, angka, testimoni, dan mitra pada situs bersifat fiktif.

## 2. Masalah yang Diselesaikan

- Pencatatan simpanan dan pinjaman manual sulit ditelusuri.
- Anggota tidak memiliki akses cepat ke saldo dan jadwal angsuran.
- Pengurus membutuhkan satu tempat untuk memverifikasi transaksi.
- Informasi koperasi, berita, galeri, dan kontak belum terkelola dalam satu sistem.
- Anggota sering lupa jatuh tempo, dan pengurus kesulitan memantau serta menagih tunggakan.
- Konten promosi (banner, testimoni, mitra, pencapaian) perlu bisa diubah pengurus tanpa mengubah kode.

## 3. Tujuan Produk

### Tujuan utama

1. Menyediakan pengelolaan koperasi berbasis database yang dinamis.
2. Memudahkan anggota memantau simpanan, pinjaman, dan angsuran.
3. Memudahkan admin menjalankan CRUD dan verifikasi transaksi.
4. Menyediakan tampilan konsisten dalam Bahasa Indonesia.
5. Mengurangi tunggakan melalui pengingat jatuh tempo dan denda otomatis.
6. Menyediakan identitas visual BuyaLater yang konsisten dan konten publik yang dinamis.
7. Memenuhi kebutuhan tugas kuliah dengan minimal 25 halaman dan tanpa link putus.

### Indikator keberhasilan

- Tersedia 79 route halaman (21 publik, 19 anggota, 39 admin) ditambah route API.
- Semua menu internal mengarah ke route yang tersedia.
- Data halaman transaksi berasal dari MySQL melalui Prisma.
- Admin dan anggota hanya dapat mengakses area sesuai role.
- Seed menyediakan data dummy realistis untuk demo.
- Lint, typecheck, dan production build berhasil.
- Pengecekan jatuh tempo menghasilkan notifikasi tanpa duplikasi (maks. 1 per angsuran per hari).
- Seluruh link footer dan banner menghasilkan status 200.

## 4. Batasan dan Non-goals

### Termasuk

- Autentikasi email/password berbasis NextAuth Credentials, ditambah login Google dan Apple (opsional, hanya untuk anggota terdaftar).
- Empat peran: `ADMIN`, `MANAJER`, `TELLER`, dan `ANGGOTA`.
- CRUD admin menggunakan Server Actions.
- Dashboard dan laporan berbasis data database.
- Galeri, artikel, FAQ, kontak, dan simulasi pinjaman.
- Rekening bank, pencairan pinjaman, pembayaran angsuran dengan verifikasi admin.
- Notifikasi dalam aplikasi, pengingat jatuh tempo, denda otomatis, dan email (Mailtrap sandbox).
- Konten publik dinamis: banner (HERO/FOOTER/SIDEBAR), testimoni, mitra, pencapaian, keunggulan.
- Newsletter (penyimpanan email), tombol WhatsApp, dan halaman keamanan/syarat/privasi.
- Data dummy melalui Prisma seed.

### Belum termasuk

- Payment gateway atau transfer bank otomatis.
- Pengiriman WhatsApp otomatis (hanya tautan `wa.me` yang diisi pesan, admin mengirim manual).
- Pengiriman email newsletter (alamat hanya disimpan; belum ada halaman admin untuk melihat/mengirimnya).
- Upload file ke object storage (berkas disimpan di disk lokal).
- Multi-cabang koperasi.
- Perhitungan akuntansi berbasis jurnal berpasangan.
- Deployment production dan domain publik.
- Cron di lingkungan serverless (jadwal harian hanya berjalan selama server Node hidup).

## 5. Persona Pengguna

### Admin/Pengurus

Pengurus koperasi yang mengelola master data, transaksi, persetujuan, konten, dan laporan.

**Kebutuhan:** data terpusat, filter cepat, validasi role, histori transaksi, dan laporan cetak.

### Anggota

Anggota koperasi yang ingin memantau simpanan dan mengajukan layanan pinjaman atau penarikan.

**Kebutuhan:** informasi saldo pribadi, proses pengajuan jelas, jadwal angsuran, dan profil yang dapat diperbarui.

### Pengunjung publik

Calon anggota atau masyarakat yang ingin mengenal BuyaLater.

**Kebutuhan:** informasi layanan, galeri, berita, FAQ, simulasi pinjaman, dan kanal kontak.

## 6. Hak Akses

### Peran staf (tahap 11A)

| Peran | Wewenang |
| --- | --- |
| `ADMIN` | Mengelola pengaturan, pengguna staf, anggota, dan seluruh konten; juga dapat menyetujui pinjaman serta memproses pencairan **di bawah batas** manajer. |
| `MANAJER` | Menyetujui/menolak pinjaman, memproses pencairan (satu-satunya yang boleh mencairkan di atas batas, default Rp 10.000.000), menyetujui penarikan, verifikasi KTP, koreksi mutasi, melihat audit log dan laporan. |
| `TELLER` | Menginput simpanan dan pembayaran tunai, memverifikasi pembayaran transfer. Tidak dapat menyetujui pinjaman atau mencairkan dana. |
| `ANGGOTA` | Hanya data milik sendiri. |

Aturan pemisahan tugas: pinjaman tidak dapat disetujui oleh user yang sama dengan penginputnya (`Pinjaman.dibuatOlehId`). Akses yang tidak berhak selalu menampilkan **404** (bukan 403).

Matriks per halaman ada di `src/lib/akses.ts` (`AKSES`) dan dipakai oleh `src/proxy.ts`, sidebar, serta `requireRole()` di setiap halaman dan Server Action.

| Fitur | Publik | ANGGOTA | ADMIN |
| --- | --- | --- | --- |
| Beranda, tentang, layanan, galeri, berita, FAQ, keamanan, syarat, privasi | Lihat | Lihat | Lihat |
| Newsletter (footer) | Daftar email | Daftar email | Daftar email |
| Simulasi pinjaman | Gunakan | Gunakan | Gunakan |
| Kontak | Kirim pesan | Kirim pesan | Kelola pesan |
| Login/register | Gunakan | Gunakan | Gunakan |
| Dashboard anggota | Tidak | Milik sendiri | Tidak |
| Profil, simpanan, penarikan, pinjaman | Tidak | Milik sendiri | Lihat melalui admin |
| Dashboard admin | Tidak | Tidak | Lihat |
| CRUD anggota dan transaksi | Tidak | Tidak | Kelola |
| Persetujuan penarikan/pinjaman | Tidak | Tidak | Kelola |
| Verifikasi foto KTP anggota | Tidak | Lihat status milik sendiri | Kelola |
| Pembayaran angsuran | Tidak | Ajukan dan lihat milik sendiri | Verifikasi (terima/tolak), bayar tunai |
| Notifikasi (lonceng, halaman notifikasi) | Tidak | Milik sendiri | Tidak |
| Tunggakan, pengingat, pengecekan jatuh tempo manual | Tidak | Tidak | Kelola |
| CRUD galeri dan berita | Tidak | Tidak | Kelola |
| CRUD banner, testimoni, mitra, pencapaian | Tidak | Tidak | Kelola |
| Laporan dan pengaturan | Tidak | Tidak | Kelola |

Proteksi route dilakukan oleh `src/proxy.ts`. Route penanda-baca notifikasi (`/anggota/notifikasi/[id]`) memeriksa kepemilikan sebelum mengalihkan. Pemeriksaan kedua dilakukan pada `requireAnggota()` dan `requireRole(...)` serta setiap Server Action.

## 7. Arsitektur Informasi dan Halaman

### Publik

| Route | Kebutuhan |
| --- | --- |
| `/` | Hero bergradien, statistik dengan animasi hitung naik (anggota aktif, dana tersalurkan, pinjaman disetujui, kepuasan), banner HERO, 6 keunggulan (tabel), cara kerja 4 langkah, produk, carousel testimoni (tabel), section mitra "Dipercaya Lembaga Terbaik" bergaya premium (latar navy gelap `#0F1B4C` dengan grid tipis dan cahaya radial; kartu sorotan mitra unggulan; dua marquee logo putih — strategis ke kiri, pendukung lebih kecil ke kanan — berhenti saat hover, logo kembali berwarna di atas lingkaran putih dengan tooltip kategori; strip angka kepercayaan: jumlah mitra dan penghargaan dari database + "100%"; deretan penghargaan berikon emas; baris statis jika `prefers-reduced-motion`; tautan "Lihat semua mitra"), 3 artikel terbaru (gambar bertema keuangan/UMKM di `public/images/artikel/`); CTA penutup kini berupa band CTA di footer. Hero memakai animasi masuk berurutan satu kali; section lain tanpa animasi masuk |
| `/tentang` | Cerita, visi, misi, empat nilai, timeline pencapaian (tabel), penghargaan (tabel), kartu tim (diisi di `src/lib/tim.ts`) |
| `/layanan/simpanan` | Penjelasan pokok, wajib, dan sukarela |
| `/layanan/pinjaman` | Alur dan ketentuan layanan pinjaman |
| `/simulasi-pinjaman` | Simulasi jumlah dan tenor; menampilkan Ringkasan Biaya lengkap (bunga per tahun, bunga efektif, total bunga, biaya admin, total bayar, cicilan, denda) dihitung server dengan rumus yang sama dengan akad |
| `/galeri` | Grid foto, filter kategori, lightbox |
| `/galeri/[id]` | Detail foto galeri |
| `/berita` | Daftar artikel dinamis |
| `/berita/[slug]` | Detail artikel dinamis |
| `/faq` | Pertanyaan umum koperasi |
| `/kontak` | Form pesan tersimpan ke tabel `Pesan` |
| `/login` | Login email/password, plus tombol Google (web) dan Apple (hanya perangkat iOS) bila kredensialnya diisi |
| `/register` | Pendaftaran anggota baru, wajib unggah foto KTP untuk diverifikasi admin |
| `/mitra` | Bergaya sama dengan beranda (latar navy gelap): sorotan mitra unggulan, kartu besar "Mitra Strategis" berisi kutipan, kartu lebih kecil "Mitra Pendukung", deretan penghargaan, dan ajakan "Ingin Menjadi Mitra BuyaLater?" ke `/kontak` |
| `/kantor-cabang` | Daftar kantor (pusat/cabang) dengan alamat, telepon, jam operasional, dan peta OpenStreetMap yang berpindah saat kantor dipilih |
| `/keamanan` | Cara BuyaLater menjaga data dan dana anggota |
| `/hak-anggota` | Hak anggota (informasi biaya jelas, penagihan beretika, pengaduan, perlindungan data, rapat anggota, SHU) dan kewajiban anggota (halaman 70) |
| `/syarat-ketentuan` | Syarat dan ketentuan layanan, diperbarui Tahap 13 (khusus anggota, biaya, penagihan beretika, pengaduan) |
| `/kebijakan-privasi` | Kebijakan privasi: data yang dikumpulkan dan tidak diambil, tiga persetujuan terpisah, hak mengunduh data dan menutup akun |

Seluruh halaman publik memiliki: Navbar berlogo (putih transparan dengan blur dan bayangan tipis saat di-scroll; tombol "Masuk Anggota" berikon gembok), carousel banner posisi `FOOTER`, band CTA melayang ("Mulai Rencanakan Keuangan Anda Hari Ini", tombol Daftar Sekarang/Hubungi Kami, mockup ponsel HTML/CSS), footer navy `#0B1438` dengan watermark logo ikon 3% dan data dari database (logo putih, deskripsi, media sosial aktif dalam lingkaran, menu kolom Layanan/Perusahaan/Bantuan yang menjadi accordion di HP, kolom Kantor Pusat dengan tautan ke semua kantor cabang, newsletter satu baris, metode pembayaran dalam pill, tautan legal, disclaimer proyek akademik), dan tombol WhatsApp melayang. Footer memakai nilai bawaan (`src/lib/kontak.ts`) bila data belum diisi.

### Area anggota

| Route | Kebutuhan |
| --- | --- |
| `/anggota/dashboard` | Saldo simpanan, pinjaman aktif, angsuran berikutnya, banner merah (angsuran terlambat + denda) dan kuning (akan jatuh tempo), banner kecil posisi `SIDEBAR` |
| `/anggota/profil` | Lihat dan edit profil, ganti foto profil, lihat status verifikasi KTP dan unggah ulang jika ditolak |
| `/anggota/simpanan` | Riwayat simpanan per jenis |
| `/anggota/penarikan` | Ajukan penarikan simpanan sukarela |
| `/anggota/pinjaman` | Daftar pinjaman milik anggota |
| `/anggota/pinjaman/ajukan` | Pengajuan pinjaman; diblokir dengan pesan + link jika belum ada rekening utama |
| `/anggota/pinjaman/[id]` | Detail pinjaman, info pencairan (jika sudah dicairkan), dan jadwal angsuran |
| `/anggota/rekening` | Tambah, ubah, hapus rekening bank; tandai satu sebagai rekening utama |
| `/anggota/bayar/[angsuranId]` | Bayar angsuran: nominal + denda, daftar rekening koperasi (salin nomor), unggah bukti transfer |
| `/anggota/pembayaran` | Riwayat pembayaran angsuran dan statusnya |
| `/anggota/notifikasi` | Seluruh notifikasi, tandai sudah dibaca (satu/semua); ikon lonceng di header menampilkan jumlah belum dibaca dan 5 terbaru |
| `/anggota/riwayat` | Gabungan seluruh transaksi anggota |

### Area admin

| Route | Kebutuhan |
| --- | --- |
| `/admin/dashboard` | Dashboard eksekutif: 4 kartu statistik dengan sparkline, antrean kerja, kesehatan koperasi + meteran, tren simpanan masuk dan pinjaman cair 6 bulan, donat komposisi simpanan, status pinjaman, status angsuran, umur tunggakan, pertumbuhan anggota, 5 penabung terbesar, aktivitas terbaru |
| `/admin/anggota` | Tabel, search, pagination, hapus |
| `/admin/anggota/tambah` | Tambah anggota dan akun login |
| `/admin/anggota/[id]` | Detail anggota dan ringkasan transaksi |
| `/admin/anggota/[id]/edit` | Edit data anggota |
| `/admin/verifikasi` | Tinjau foto KTP pendaftar baru, setujui atau tolak |
| `/admin/simpanan` | Input dan daftar setoran |
| `/admin/penarikan` | Persetujuan atau penolakan penarikan |
| `/admin/pinjaman` | Daftar seluruh pinjaman |
| `/admin/pinjaman/[id]` | Review, setujui/tolak, lihat info pencairan |
| `/admin/pencairan` | Daftar pinjaman disetujui yang menunggu dicairkan |
| `/admin/pencairan/[id]` | Form pencairan: rekening tujuan, jumlah, biaya admin, bukti transfer |
| `/admin/rekening-koperasi` | CRUD rekening koperasi (tujuan pembayaran angsuran) |
| `/admin/angsuran` | Atur denda manual, tandai lunas tunai, atau lihat bukti pembayaran yang menunggu verifikasi |
| `/admin/tunggakan` | Daftar angsuran terlambat (kuning 1–7 hari, oranye 8–batas kritis, merah di atasnya), total denda, tombol "Jalankan Pengecekan Sekarang", kirim pengingat, kirim pengingat WhatsApp |
| `/admin/pengingat` | Log pengingat/keterlambatan yang terkirim beserta status email |
| `/admin/verifikasi-pembayaran` | Daftar pembayaran angsuran yang menunggu verifikasi |
| `/admin/verifikasi-pembayaran/[id]` | Lihat bukti transfer, terima atau tolak dengan alasan |
| `/admin/galeri` | CRUD galeri |
| `/admin/berita` | CRUD artikel |
| `/admin/banner` | CRUD banner (posisi HERO/FOOTER/SIDEBAR, urutan, aktif, rentang tanggal tayang) |
| `/admin/testimoni` | CRUD testimoni (rating 1–5, tampil/sembunyikan) |
| `/admin/mitra` | CRUD mitra (logo, website, kategori, deskripsi, tahun bermitra, tingkat, warna brand, kutipan, perwakilan, urutan, sorotan — hanya satu sorotan) |
| `/admin/penghargaan` | CRUD penghargaan (judul, pemberi, tahun, deskripsi, ikon, urutan) |
| `/admin/kantor-cabang` | CRUD kantor (alamat, telepon, jam, koordinat, kantor pusat — hanya satu pusat) |
| `/admin/tampilan-footer` | Kelola identitas & kontak situs, menu footer per kolom, media sosial (aktif/nonaktif), dan metode pembayaran |
| `/admin/pencapaian` | CRUD pencapaian untuk timeline `/tentang` |
| `/admin/pesan` | Daftar pesan kontak |
| `/admin/laporan` | Ringkasan keuangan dan cetak |
| `/admin/pengaturan` | Bunga pinjaman/simpanan per tahun (batas 24%/9% divalidasi server), metode bunga, biaya admin (maks. 1%), denda 0,05%/hari, masa tenggang, batas denda 10% pokok, template pengingat, batas nominal, parameter kelayakan |

### Halaman pinjaman lanjutan (tahap 11B)

| Route | Kebutuhan |
| --- | --- |
| `/anggota/verifikasi` | Status KYC, NIK tersamar (3201********0001), unggah KTP + swafoto + penghasilan + pekerjaan |
| `/admin/verifikasi-anggota` | Peninjauan KYC (Admin/Manajer); NIK utuh hanya di halaman admin |
| `/anggota/pinjaman/ajukan` | Checklist syarat kelayakan (centang hijau / silang merah) dan plafon maksimal |
| `/anggota/pinjaman/[id]/akad` | Baca akad (nominal, bunga, tenor, jadwal, denda), centang persetujuan, masukkan password; unduh PDF lewat `/api/akad/[pinjamanId]` |
| `/anggota/pinjaman/[id]/lunasi` | Pelunasan dipercepat: sisa pokok + bunga bulan berjalan |
| `/anggota/pinjaman/[id]/restrukturisasi` | Pengajuan perpanjangan tenor untuk tunggakan > 30 hari |
| `/admin/restrukturisasi` | Daftar dan keputusan restrukturisasi (hanya Manajer yang memutuskan) |
| `/admin/shu`, `/anggota/shu` | Hitung (draft) dan bagikan SHU ke simpanan sukarela; riwayat SHU anggota |

### Halaman koperasi close loop (tahap 13)

| Route | Kebutuhan |
| --- | --- |
| `/admin/log-penagihan` | Halaman 67. Bukti setiap pengingat/penagihan (saluran, isi pesan, pengirim, waktu WIB) dengan filter saluran (Admin/Manajer) |
| `/anggota/pengaduan` | Halaman 68. Buat tiket (kategori, isi, lampiran), pantau status dan tanggapan; tombol "Laporkan Penagihan Tidak Pantas" ada di detail pinjaman |
| `/admin/pengaduan` | Halaman 69. Tanggapi tiket; target selesai 10 hari kerja, merah bila lewat (Admin/Manajer) |
| `/hak-anggota` | Halaman 70 (publik), lihat tabel Publik |
| `/admin/hari-libur` | Halaman tambahan. Kelola `HariLibur` (seed hari libur nasional 2026) yang menghentikan penagihan dan hitungan hari kerja (Admin) |
| `/admin/dashboard` | Bertambah kartu **Kesehatan koperasi**: pinjaman beredar ÷ simpanan (kuning > 80%, merah > 90%, persetujuan pinjaman baru hanya Manajer bila > 90%) dan rasio pinjaman bermasalah (tunggakan > 90 hari) |
| `/anggota/profil` | Bertambah kartu Data pribadi & privasi: riwayat persetujuan, unduh data (`/api/anggota/data-saya`), penutupan akun setelah semua pinjaman lunas |
| `/register` | Tiga persetujuan data terpisah (identitas, kelayakan, pengingat), dicatat di `PersetujuanData` |
| `/anggota/pinjaman/[id]/akad` | Ringkasan Biaya Pinjaman dalam satu kotak + centang "Saya sudah membaca dan memahami seluruh biaya di atas" sebelum tombol setuju aktif |

### Halaman keamanan (tahap 11A)

| Route | Kebutuhan |
| --- | --- |
| `/lupa-password`, `/reset-password/[token]` | Permintaan dan pengaturan ulang password lewat email |
| `/anggota/mutasi` | Buku mutasi dan saldo simpanan milik sendiri |
| `/admin/mutasi` | Buku mutasi semua anggota dengan filter; form koreksi (Admin/Manajer) |
| `/admin/audit-log` | Jejak audit (hanya baca) dengan filter tanggal, pengguna, dan entitas |
| `/admin/pengguna` | Tambah pengguna staf dan ubah peran (Admin) |

### Route API

`/api/register`, `/api/pesan`, `/api/subscribe` (newsletter), `/api/auth/[...nextauth]`, `/api/anggota/profil`, `/api/anggota/ktp`, `/api/file/[id]` (satu-satunya jalan ke berkas privat), `/api/anggota/pinjaman`, `/api/anggota/penarikan`, `/api/anggota/data-saya`, `/api/akad/[pinjamanId]`.

## 8. Kebutuhan Fungsional

### Autentikasi

- Sistem menerima login dengan Username Login berupa email dan password.
- Field login diberi label `Email` pada UI, sedangkan dokumentasi akun menggunakan istilah `Username Login`.
- Password disimpan dalam bentuk hash bcrypt.
- Session menggunakan JWT NextAuth dan berakhir setelah 30 menit tanpa aktivitas.
- Password minimal 8 karakter dengan huruf dan angka (Zod).
- Kunci login 15 menit setelah 5 kali gagal (tabel `LoginAttempt`); login yang sukses atau reset password membuka kunci.
- Lupa password: `/lupa-password` mengirim tautan token acak sekali pakai berlaku 1 jam (hash SHA-256 di tabel `PasswordResetToken`); jawaban selalu sama agar tidak bisa dipakai menebak akun.
- **Login sosial (tahap 14)**: tombol "Masuk dengan Google" dan "Masuk dengan Apple" di `/login`, aktif hanya bila `AUTH_GOOGLE_ID/SECRET` atau `AUTH_APPLE_ID/SECRET` diisi di `.env`. Tombol Apple hanya tampil di perangkat iOS; tombol Google disembunyikan di WebView aplikasi Capacitor karena Google menolak OAuth di WebView. Login sosial hanya untuk anggota yang **sudah terdaftar**: email dari penyedia harus terverifikasi dan sama dengan email `User` (tidak ada akun otomatis karena pendaftaran wajib KTP/NIK); ADMIN/MANAJER/TELLER wajib password; anggota yang ditutup/dihapus atau terkunci tetap ditolak. Sesi tetap JWT 30 menit dan tidak ada tabel baru. Panduan: [docs/LOGIN-SOSIAL.md](LOGIN-SOSIAL.md).
- Login tanpa session diarahkan ke `/login`.
- Peran yang tidak berhak atas suatu halaman mendapat tampilan 404; ANGGOTA tidak dapat membuka `/admin/*` dan staf tidak dapat membuka `/anggota/*`.

### Keanggotaan

- Admin dapat menambah, melihat, mengubah status, dan menghapus anggota.
- Setiap anggota memiliki akun `User` dan profil `Anggota`.
- Email, NIK, nomor anggota, dan slug artikel harus unik.
- Pendaftaran publik (`/register`) wajib mengunggah foto KTP. Anggota baru dibuat dengan `statusVerifikasi: PENDING`; anggota yang dibuat langsung oleh admin melalui `/admin/anggota/tambah` otomatis `TERVERIFIKASI`.
- Admin meninjau foto KTP di `/admin/verifikasi` dan dapat menyetujui (`TERVERIFIKASI`) atau menolak (`DITOLAK` dengan catatan alasan wajib).
- Anggota dapat melihat status verifikasinya dan mengunggah ulang foto KTP dari `/anggota/profil`; unggah ulang mengembalikan status ke `PENDING`.
- Anggota dapat mengganti foto profil (`Anggota.foto`) kapan saja tanpa memerlukan verifikasi ulang.
- Foto KTP disimpan privat di luar `public/` dan hanya dapat diakses melalui API terautentikasi (pemilik data atau admin); foto profil, galeri, dan artikel disimpan sebagai berkas publik di `public/uploads/`.

### Simpanan dan penarikan

- Simpanan memiliki jenis `POKOK`, `WAJIB`, dan `SUKARELA`.
- Admin dapat mencatat setoran.
- Anggota dapat melihat riwayat dan total per jenis.
- Anggota hanya dapat menarik saldo sukarela yang tersedia.
- Penarikan berstatus `PENDING`, `DISETUJUI`, atau `DITOLAK`.

### Pinjaman, pencairan, dan angsuran

- Alur status pinjaman: `DIAJUKAN` → `DISETUJUI` → `DICAIRKAN` → `LUNAS`, atau `DITOLAK`.
- Anggota wajib memiliki rekening bank utama (`RekeningAnggota.isUtama`) sebelum dapat mengajukan pinjaman; halaman pengajuan menampilkan pesan dan link ke `/anggota/rekening` jika belum ada.
- Anggota mengajukan jumlah, tenor, dan alasan. Sistem menghitung estimasi `totalBayar` berdasarkan bunga.
- Admin dapat menyetujui atau menolak pengajuan (`DISETUJUI`/`DITOLAK`). Persetujuan **tidak** membuat jadwal angsuran.
- Pinjaman `DISETUJUI` masuk antrean `/admin/pencairan`. Admin memproses pencairan: memilih rekening utama anggota, mengisi jumlah dicairkan dan biaya admin, mengunggah bukti transfer (JPG/PNG/PDF, maks 2MB, publik di `public/uploads/pencairan/`).
- Memproses pencairan mengubah status pinjaman menjadi `DICAIRKAN` dan **baru saat itu** jadwal angsuran dibuat, dengan jatuh tempo angsuran pertama 1 bulan setelah `tanggalPencairan`.
- Admin dapat menandai angsuran sebagai `LUNAS` secara langsung (pembayaran tunai) dari `/admin/angsuran`, kecuali sedang ada bukti transfer yang menunggu verifikasi untuk angsuran tersebut.
- Anggota hanya dapat melihat pinjaman, rekening, dan info pencairan miliknya sendiri.
- Rekening anggota yang sudah dipakai untuk pencairan tidak dapat dihapus.

### Pembayaran angsuran dan verifikasi

- Anggota membayar angsuran secara berurutan — angsuran ke-N hanya dapat dibayar setelah seluruh angsuran sebelum ke-N berstatus `LUNAS`.
- Anggota mentransfer ke salah satu rekening koperasi aktif, lalu mengunggah bukti transfer (JPG/PNG/PDF, maks 2MB) di `/anggota/bayar/[angsuranId]`. Nominal yang ditampilkan adalah jumlah angsuran ditambah denda (jika admin sudah menetapkan denda).
- Mengajukan bukti pembayaran membuat record `Pembayaran` berstatus `MENUNGGU` dan mengubah `Angsuran.status` menjadi `MENUNGGU_VERIFIKASI` (mengunci angsuran dari pengajuan ganda).
- Admin meninjau bukti transfer di `/admin/verifikasi-pembayaran` dan dapat **menerima** atau **menolak** (wajib mengisi alasan).
- Saat **diterima**: `Angsuran` menjadi `LUNAS`; jika seluruh angsuran pinjaman tersebut sudah `LUNAS`, `Pinjaman` otomatis menjadi `LUNAS`.
- Saat **ditolak**: `Angsuran` kembali ke `BELUM` (atau otomatis terhitung `TERLAMBAT` lagi jika sudah lewat jatuh tempo), dan anggota dapat mengunggah ulang bukti pembayaran.
- Status `TERLAMBAT` ditandai oleh dua mekanisme: `syncStatusTerlambat()` (ringan, saat halaman terkait dibuka) dan `cekJatuhTempo()` (cron harian + tombol admin) yang juga menghitung denda dan membuat notifikasi.

### Notifikasi, pengingat, dan denda

- `cekJatuhTempo()` (`src/lib/cekJatuhTempo.ts`) berjalan otomatis setiap hari **08.00 WIB** lewat `node-cron` yang didaftarkan di `src/instrumentation.ts`, dan dapat dijalankan manual admin melalui tombol "Jalankan Pengecekan Sekarang" (`/admin/tunggakan`, `/admin/pengingat`).
- Angsuran `BELUM` yang jatuh tempo dalam N hari (`Pengaturan.hariPengingatSebelumJatuhTempo`, default 3) menghasilkan notifikasi `PENGINGAT`.
- Angsuran yang lewat jatuh tempo menjadi `TERLAMBAT`; denda = `jumlah angsuran × dendaPersenPerHari% × hari terlambat` (default 0,1%/hari); notifikasi `TERLAMBAT` dibuat. Denda otomatis menimpa denda manual pada pengecekan berikutnya.
- Maksimal 1 notifikasi `PENGINGAT`/`TERLAMBAT` per angsuran per hari pada pengecekan otomatis; kirim ulang manual oleh admin tidak dibatasi.
- Email dikirim lewat Nodemailer (SMTP Mailtrap sandbox; variabel `SMTP_*` di `.env`) dengan template HTML bertema BuyaLater dan logo terlampir. Jika `SMTP_*` kosong, email dilewati (status `TIDAK_DIKONFIGURASI`) dan notifikasi dalam aplikasi tetap dibuat. Kegagalan email tidak menghentikan pengecekan.
- Notifikasi otomatis lain: pinjaman disetujui/ditolak (`INFO`), dicairkan (`PENCAIRAN`), pembayaran diterima/ditolak atau dicatat tunai (`PEMBAYARAN`).
- Admin dapat membuka pesan WhatsApp berisi nama, angsuran ke berapa, nominal, denda, dan jatuh tempo melalui tautan `https://wa.me/{noHp}` (tanpa API).
- Warna tunggakan: kuning 1–7 hari, oranye 8 hari hingga `batasHariTerlambatKritis` (default 30), merah di atasnya.

### Konten

- Admin dapat CRUD galeri dengan kategori Kegiatan, Rapat, dan Sosial.
- Admin dapat CRUD artikel dengan slug unik.
- Pengunjung dapat membaca berita dan melihat galeri tanpa login.
- Admin dapat CRUD `Banner`, `Testimoni`, `Mitra`, dan `Pencapaian`. Gambar dapat diunggah (JPG/PNG/WEBP/GIF, maks 5MB, publik di `public/uploads/`) atau memakai URL eksternal.
- **Aturan tayang banner**: tampil hanya jika `isAktif = true` dan hari ini berada di antara `tanggalMulai` dan `tanggalSelesai` (kosong = tanpa batas; tanggal selesai berlaku sampai akhir hari). Banner `HERO` tampil di beranda, `FOOTER` sebagai carousel di atas footer (otomatis 5 detik, titik navigasi), `SIDEBAR` sebagai carousel kecil di dashboard anggota.
- Testimoni hanya tampil jika `isTampil = true`. `Keunggulan` hanya dikelola lewat seed (belum ada halaman admin).
- Pengunjung dapat berlangganan newsletter dari footer; email disimpan di tabel `Subscriber` (unik, pendaftaran ulang tidak membuat duplikat).
- `Pencapaian.ikon` dan `Keunggulan.ikon` berisi kunci teks yang dipetakan ke ikon lucide-react (`DynamicIcon`).

### Laporan

- Admin dapat melihat total simpanan, penarikan disetujui, pinjaman, dan angsuran lunas.
- Laporan dapat dicetak dari browser.

## 9. Model Data Utama

- `User`: identitas login dan role.
- `Anggota`: profil anggota satu-ke-satu dengan `User`, termasuk foto profil, foto KTP, dan status verifikasi (`PENDING`/`TERVERIFIKASI`/`DITOLAK`).
- `Simpanan`: setoran anggota berdasarkan jenis.
- `Penarikan`: permintaan pencairan simpanan sukarela.
- `Pinjaman`: pengajuan dan status pinjaman (termasuk `DICAIRKAN`).
- `RekeningAnggota`: rekening bank anggota, satu ditandai sebagai utama untuk tujuan pencairan.
- `RekeningKoperasi`: rekening koperasi untuk pembayaran angsuran.
- `Pencairan`: catatan pencairan pinjaman (1:1 dengan `Pinjaman`) — rekening tujuan, jumlah, biaya admin, bukti transfer, admin yang memproses.
- `Angsuran`: jadwal pinjaman (dibuat saat pinjaman dicairkan), termasuk `denda` dan status `BELUM`/`MENUNGGU_VERIFIKASI`/`LUNAS`/`TERLAMBAT`.
- `Pembayaran`: pengajuan bukti transfer angsuran oleh anggota (1:N dengan `Angsuran`) — rekening koperasi tujuan, jumlah, bukti, status verifikasi, admin yang memverifikasi.
- `Galeri`: dokumentasi foto publik.
- `Artikel`: berita publik.
- `Pesan`: pesan dari form kontak.
- `Pengaturan`: bunga, nominal default koperasi, serta parameter denda dan pengingat (`dendaPersenPerHari`, `hariPengingatSebelumJatuhTempo`, `batasHariTerlambatKritis`).
- `Notifikasi`: notifikasi per pengguna (`PENGINGAT`/`TERLAMBAT`/`PENCAIRAN`/`PEMBAYARAN`/`INFO`), terkait opsional ke `Angsuran`, dengan status email; baris pengingat sekaligus menjadi log di `/admin/pengingat`.
- `Banner`: banner promosi dengan posisi `HERO`/`FOOTER`/`SIDEBAR`, urutan, status aktif, dan rentang tanggal.
- `Testimoni`, `Mitra` (kategori, deskripsi, tahun bermitra, `tingkat` STRATEGIS/PENDUKUNG, `isUnggulan`, kutipan, perwakilan, `warnaBrand`), `Pencapaian`, `Keunggulan`, `Penghargaan`, `KantorCabang` (koordinat, `isPusat`): konten publik dinamis, berdiri sendiri (tanpa relasi ke `Anggota`).
- `MenuFooter` (kolom `LAYANAN`/`PERUSAHAAN`/`BANTUAN`), `MediaSosial` (`INSTAGRAM`/`FACEBOOK`/`YOUTUBE`/`TIKTOK`/`WHATSAPP`), `MetodePembayaran`: isi footer yang dikelola admin.
- `Pengaturan` juga menyimpan identitas situs: `namaInstansi`, `deskripsiFooter`, `emailCs`, `teleponCs`, `whatsappCs`, `alamatPusat`.
- `Subscriber`: email pelanggan newsletter (unik).

Diagram lengkap seluruh 26 tabel ada di [ERD.md](ERD.md). Skema diterapkan lewat SQL manual di `prisma/sql/` karena `prisma migrate`/`db push` gagal pada MariaDB XAMPP (error `mysql.proc`).

Nilai keuangan menggunakan `Decimal` MySQL untuk menghindari kesalahan floating point.

## 10. Aturan UI/UX

- Identitas visual: logo BuyaLater (dompet dengan huruf B dan centang) di `public/images/` — logo lengkap, versi putih untuk latar gelap, dan ikon (juga favicon `src/app/icon.png`). Komponen `<Logo />` dipakai di navbar, footer, login, register, 404, sidebar, header cetak laporan, dan email.
- Warna tema (`src/app/globals.css`, Tailwind v4): primary navy `#1A2A6C` (judul, sidebar, footer), secondary biru `#1E5FC7` (tombol utama, tautan), accent biru muda `#4FB8EC` (highlight, hover). Gradien khas `#1A2A6C → #1E5FC7 → #4FB8EC` untuk hero dan banner.
- Sistem desain publik (tahap 10D): ritme latar section selang-seling putih / abu `#F7F8FC` / navy (mitra, footer); label atas judul huruf biasa (kapital berjarak hanya di hero); radius tombol dan input 10px, kartu 16px, section/kartu besar 28px; bayangan kartu navy transparan (token `shadow-kartu`: `0 10px 30px -12px rgba(26,42,108,.18)`); tombol utama bergradien biru dengan kilau saat hover; animasi masuk (`animate-masuk`) hanya di hero; aturan global `prefers-reduced-motion` mematikan animasi dan transisi.
- Warna status tetap: hijau (sukses), kuning/amber (peringatan), merah (bahaya).
- Latar: putih dan abu-abu muda.
- Font: Montserrat untuk judul, Inter untuk isi.
- Sidebar admin dan anggota dapat diciutkan di desktop (hanya ikon); pilihan disimpan di browser. Halaman cetak laporan menyembunyikan sidebar dan menampilkan kop berlogo.
- Tombol WhatsApp melayang di semua halaman publik.
- Animasi marquee mitra: keyframes dan animasi (`marquee` 30 detik dan `marquee-reverse` 34 detik, lebih cepat di HP) didefinisikan di `src/app/globals.css` lewat `@theme` karena Tailwind v4 tidak memakai `tailwind.config`. Daftar dirender dua kali (salinan kedua `aria-hidden`) dan digeser `translateX(0 → -50%)` agar loop mulus; berhenti saat hover/fokus; memudar di tepi dengan `mask-image`; pengguna dengan `prefers-reduced-motion` mendapat grid statis.
- Bahasa antarmuka: Bahasa Indonesia.
- Publik menggunakan Navbar dan Footer.
- Admin dan anggota menggunakan sidebar dan layout dashboard konsisten.
- Status transaksi menggunakan Badge dengan warna semantik.
- Form memakai komponen Input, Button, Card, dan Table reusable.
- Setiap halaman memiliki state loading dan error yang jelas.
- **Mode gelap dan terang (tahap 15)**: situs publik, panel admin, dan portal anggota tampil **gelap secara bawaan** dan dapat diganti lewat tombol matahari/bulan (di navbar situs publik, di sidebar/header dashboard). Pilihan disimpan di cookie `bl-tema` yang dipakai bersama oleh seluruh area, sehingga server merender tema yang sama tanpa kedip. Implementasi: kelas `.dark` pada pembungkus layout yang memetakan ulang skala warna Tailwind (`src/app/globals.css`), logo otomatis berganti ke versi putih, dan grafik memakai variabel `--g-*`.
- Layout harus responsif untuk desktop dan mobile. Di layar < 640px ukuran dasar huruf 14px (skala `rem` lebih kecil), kolom isian 16px agar iOS tidak memperbesar halaman saat fokus, dan viewport `width=device-width, viewport-fit=cover`; kartu statistik dan kartu beranda dibuat ringkas (ikon di samping teks).

## 11. Kebutuhan Non-fungsional

- Semua mutasi admin menggunakan Server Actions dan validasi role server-side.
- Semua halaman transaksi membaca atau menulis database, bukan mock statis.
- Route detail harus menampilkan `notFound()` jika data tidak ada.
- Tidak boleh ada navigasi internal menuju halaman yang tidak tersedia.
- Build production dan TypeScript harus berhasil sebelum demo.
- Data sensitif seperti password dan `AUTH_SECRET` tidak boleh masuk repository.
- **Keamanan transaksi (11A)**: nominal `DECIMAL(15,2)` dan dihitung dengan `Decimal`; semua proses uang dibungkus `prisma.$transaction` dengan `updateMany` bersyarat status lama (0 baris → "Transaksi sudah diproses sebelumnya."); tombol dinonaktifkan selama proses; setiap form divalidasi ulang dengan Zod (`src/lib/validasi.ts`) dengan batas nominal dari `Pengaturan`.
- **Berkas privat**: KTP, swafoto, bukti transfer, dan bukti bayar disimpan di `storage/private` (di luar `public/`) dengan nama UUID, tipe diperiksa lewat magic bytes, dilayani oleh `/api/file/[id]` hanya untuk pemilik atau staf berwenang.
- **Buku mutasi** (`Mutasi`, append-only): setiap transaksi uang membuat baris mutasi; saldo simpanan dihitung dari mutasi; koreksi dengan baris `KOREKSI`.
- **Audit log** (`AuditLog`, append-only): perubahan Pinjaman, Pencairan, Pembayaran, Simpanan, Penarikan, RekeningAnggota, dan Pengaturan dicatat bersama user dan IP, dalam transaksi yang sama dengan perubahannya.
- **Soft delete** (`deletedAt`) untuk Anggota, Galeri, Artikel, dan Mitra; anggota dengan pinjaman aktif atau saldo simpanan tidak dapat dinonaktifkan/dihapus.
- **Bunga dan biaya (13)**: bunga pinjaman per tahun (bawaan 12%, metode anuitas), bunga efektif termasuk biaya admin tidak boleh > 24%/tahun, bunga simpanan ≤ 9%, biaya admin ≤ 1% pokok, total denda ≤ 10% pokok; semua divalidasi di server dan ditolak dengan "Melebihi batas Permenkop UKM 8/2023". Bunga ke anggota selalu ditulis per tahun beserta bunga efektif; tidak pernah per hari.
- **Penagihan beretika (13)**: pengingat/penagihan semua saluran hanya Senin–Sabtu 08.00–20.00 WIB di luar hari libur, hanya kepada anggota yang bersangkutan (tidak ada kontak darurat), maks. 1 per anggota per hari, template bebas kata terlarang, dan tercatat di `LogPenagihan`.
- **Perlindungan endpoint & header (tahap 14)**: `src/lib/batas-laju.ts` membatasi per IP (jendela geser di memori; balasan 429): `/api/register` 5/jam, `/api/pesan` dan `/api/subscribe` 5/10 menit, lupa password 5/jam (selain batas 3/jam per akun). Semua halaman membawa header `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP dasar (`frame-ancestors`, `base-uri`, `object-src`), dan HSTS di production. Batas laju per proses server; untuk banyak instance pindahkan ke Redis/database.
- **Penguatan keamanan (14B)**: `next` 16.4.0 dan Capacitor 8.5.3 (menutup celah yang dilaporkan `npm audit`); pendaftaran menjawab sama untuk email/NIK baru maupun yang sudah ada (email pemberitahuan dikirim ke pemilik email lama) agar tidak bisa dipakai menebak anggota; semua nilai dinamis di email di-escape (`esc()` di `src/lib/email.ts`, dites); server production mencatat peringatan bila `AUTH_SECRET` lemah. `nodemailer` 10 dan `prisma` 8 ditunda karena versi mayor.
- **Privasi (13)**: aplikasi mobile Capacitor hanya meminta INTERNET dan CAMERA (iOS: `NSCameraUsageDescription`); dijaga oleh tes `src/lib/izin-mobile.test.ts`.
- **Kelayakan pinjaman (11B, diperluas 13)**: `cekKelayakan()` — anggota aktif & terverifikasi, simpanan pokok sudah dibayar, simpanan wajib tidak menunggak > 2 bulan (12 bulan penuh terakhir), KYC `DITERIMA`, anggota ≥ 3 bulan, tanpa pinjaman aktif lain, plafon = min(3 × saldo simpanan, pinjaman maksimal), angsuran/bulan ≤ 30% penghasilan, tanpa tunggakan > 30 hari dalam 12 bulan; semua angka di `Pengaturan` dan diperiksa ulang di server saat pengajuan.
- **Akad digital**: pinjaman yang disetujui Manajer wajib disetujui anggota (checkbox + password) sebelum pencairan dapat diproses; salinan akad, IP, dan user-agent disimpan di `AkadPinjaman`.
- **Rekening**: tambah/ubah/jadikan utama wajib password, nama pemilik harus sama dengan nama anggota (gelar diabaikan), memicu notifikasi + email, dan terkunci selama ada pinjaman `DISETUJUI` yang belum dicairkan.
- **Pembayaran**: kode unik 3 digit per angsuran ditambahkan ke nominal transfer; hash SHA-256 bukti menolak file duplikat; kurang bayar → `SEBAGIAN` (denda dilunasi lebih dulu); kelebihan (termasuk kode unik) → simpanan sukarela.
- **Denda**: total denda per pinjaman dibatasi 10% pokok (Pengaturan); setelah batas tercapai denda berhenti bertambah.
- **Restrukturisasi**: untuk tunggakan > 30 hari; disetujui Manajer; sisa tagihan dijadwal ulang tanpa menghapus riwayat pembayaran.
- **SHU**: jasa modal (saldo simpanan) dan jasa pinjaman (bunga dibayar) dibagikan ke simpanan sukarela lewat `Simpanan` + `Mutasi`.
- Seluruh query area anggota memfilter `anggotaId` milik user yang login (mencegah IDOR).

## 12. Seed dan Data Demo

`prisma/seed.ts` menyediakan:

- 3 akun pengurus (Admin, Manajer, Teller) dan 15 anggota Indonesia (1 nonaktif).
- Simpanan pokok Rp 100.000, simpanan wajib Rp 50.000 per bulan selama 12 bulan terakhir (4 anggota sengaja menunggak 1, 2, 4, dan 5 bulan), dan simpanan sukarela.
- 11 pinjaman dengan status bervariasi: 2 `LUNAS`, 3 `DICAIRKAN`, 2 `DIAJUKAN`, 2 `DISETUJUI`, 2 `DITOLAK`. **Semua tanggal transaksi dihitung relatif terhadap hari ini** (pinjaman terlama dicairkan sekitar 8 bulan lalu, pengajuan terbaru 2 hari lalu) sehingga data selalu terasa baru setiap seed dijalankan ulang.
- Bunga pinjaman 12% per tahun (anuitas) dan biaya admin 1%, sehingga bunga efektif sekitar 14–15% per tahun, di bawah batas 24% (Permenkop UKM 8/2023). Denda 0,05% per hari dengan masa tenggang 3 hari dan batas total 10% pokok.
- 4 akun demo penagihan (id `demo-*`, dibuat `prisma/demo-tunggakan.ts`) dengan tunggakan 3, 12, dan 45 hari serta satu angsuran jatuh tempo 2 hari lagi, untuk mencoba pengingat (status terlambat muncul setelah admin menekan "Jalankan Pengecekan Sekarang" di `/admin/tunggakan`, atau saat pengecekan harian berjalan).
- Rekening anggota (kecuali dua anggota yang sengaja tanpa rekening untuk demo gate pengajuan) dan 2 rekening koperasi.
- Jadwal angsuran, termasuk demo tunggakan (terlambat sekitar 40 dan 5 hari dengan denda terhitung), satu pembayaran sebagian, satu bukti bayar menunggu verifikasi, dan satu angsuran yang jatuh tempo dalam 2 hari.
- 4 notifikasi contoh.
- 12 foto galeri dari Picsum dan 6 artikel berita.
- 9 banner (3 HERO termasuk satu yang sudah berakhir, 4 FOOTER, 2 SIDEBAR).
- 6 testimoni (foto `i.pravatar.cc`), 6 mitra dengan logo SVG lokal (`public/images/mitra/`) — 3 strategis (Arunika Bank sebagai sorotan, PayNara, Teduh Proteksi) dan 3 pendukung — lengkap dengan kutipan, perwakilan, dan warna brand,
- 4 penghargaan, 3 kantor (1 pusat), 5 media sosial (TikTok sengaja nonaktif), 13 menu footer, 4 metode pembayaran, dan identitas situs di `Pengaturan`, 5 pencapaian (2022–2026), dan 6 keunggulan.
- Pengaturan bunga, nominal simpanan, dan parameter denda/pengingat.

### Kredensial akun seed dan username login

Login BuyaLater menggunakan **username login berupa alamat email**. Masukkan nilai pada kolom `Username Login` ke field Email di halaman `/login`.

Password akun anggota dibuat sama untuk kebutuhan demo lokal. Pada aplikasi nyata, password harus diganti dan tidak boleh didokumentasikan dalam bentuk plaintext.

| Role | Nama | Username Login | Password |
| --- | --- | --- | --- |
| ADMIN | Administrator BuyaLater | `admin@buyalatter.com` | `admin123` |
| MANAJER | Manajer BuyaLater | `manajer@buyalatter.com` | `manajer123` |
| TELLER | Teller BuyaLater | `teller@buyalatter.com` | `teller123` |
| ANGGOTA | Budi Santoso | `budi.santoso@buyalatter.com` | `anggota123` |
| ANGGOTA | Siti Aminah | `siti.aminah@buyalatter.com` | `anggota123` |
| ANGGOTA | Andi Wijaya | `andi.wijaya@buyalatter.com` | `anggota123` |
| ANGGOTA | Dewi Lestari | `dewi.lestari@buyalatter.com` | `anggota123` |
| ANGGOTA | Rudi Hartono | `rudi.hartono@buyalatter.com` | `anggota123` |
| ANGGOTA | Maya Sari | `maya.sari@buyalatter.com` | `anggota123` |
| ANGGOTA | Agus Setiawan | `agus.setiawan@buyalatter.com` | `anggota123` |
| ANGGOTA | Lina Marlina | `lina.marlina@buyalatter.com` | `anggota123` |
| ANGGOTA | Fajar Nugroho | `fajar.nugroho@buyalatter.com` | `anggota123` |
| ANGGOTA | Nina Kurniawati | `nina.kurniawati@buyalatter.com` | `anggota123` |
| ANGGOTA | Dedi Irawan | `dedi.irawan@buyalatter.com` | `anggota123` |
| ANGGOTA | Rina Oktaviani | `rina.oktaviani@buyalatter.com` | `anggota123` |
| ANGGOTA | Hendra Gunawan | `hendra.gunawan@buyalatter.com` | `anggota123` |
| ANGGOTA | Tika Pratiwi | `tika.pratiwi@buyalatter.com` | `anggota123` |
| ANGGOTA | Yusuf Maulana | `yusuf.maulana@buyalatter.com` | `anggota123` |

### Panduan login dan alur uji untuk penguji

> **Catatan situs online** (`https://buyalater-koperasi.vercel.app`): sandi akun staf (admin, manajer, teller) di situs online sudah diganti demi keamanan dan diberikan langsung oleh pengembang. Sandi pada panduan di bawah berlaku untuk instalasi lokal (`localhost:3000`) dan untuk akun anggota contoh di situs online.

Aplikasi memiliki **satu halaman login** (`/login`) untuk semua peran. Sistem yang menentukan tujuan setelah masuk berdasarkan peran akun.

**Cara login sebagai anggota**
1. Buka `http://localhost:3000` lalu klik **Masuk Anggota** (atau langsung ke `/login`).
2. Isi kolom **Email** dengan `budi.santoso@buyalatter.com` dan **Password** dengan `anggota123`, lalu klik **Masuk**.
3. Sistem mengarahkan ke **`/anggota/dashboard`** (portal anggota): saldo simpanan, pinjaman aktif, angsuran berikutnya, menu Ajukan Pinjaman, Pembayaran, Pengaduan, dan Profil.
4. Untuk keluar, klik **Keluar** di sidebar atau menu.

**Cara login sebagai admin/pengurus**
1. Buka halaman yang sama, `/login`.
2. Isi **Email** `admin@buyalatter.com` dan **Password** `admin123`, lalu klik **Masuk**.
3. Sistem mengarahkan ke **`/admin/dashboard`** (panel pengurus). Menu yang tampil mengikuti peran: Admin mengelola anggota, konten, dan pengaturan; Manajer menyetujui pinjaman; Teller mencairkan dan memverifikasi pembayaran.
4. Peran yang membuka halaman yang bukan haknya mendapat tampilan 404 (anggota tidak dapat membuka `/admin/*`, staf tidak dapat membuka `/anggota/*`).

**Akun untuk dicoba (data dummy)**

| Peran | Email (Username Login) | Password | Tujuan setelah login |
| --- | --- | --- | --- |
| Admin | `admin@buyalatter.com` | `admin123` | `/admin/dashboard` |
| Manajer | `manajer@buyalatter.com` | `manajer123` | `/admin/dashboard` |
| Teller | `teller@buyalatter.com` | `teller123` | `/admin/dashboard` |
| Anggota | `budi.santoso@buyalatter.com` | `anggota123` | `/anggota/dashboard` |

Semua anggota contoh lain memakai password yang sama, `anggota123`. Login Google/Apple bersifat opsional dan tidak aktif sebelum kredensialnya diisi di `.env`.

**Catatan keamanan saat uji:** salah password 5 kali akan mengunci akun tersebut selama 15 menit (tunggu atau gunakan akun lain). Sesi berakhir otomatis setelah 30 menit tanpa aktivitas.

**Skenario yang bisa dicoba per akun**

| Akun (anggota) | Kondisi data | Yang dapat dicoba |
| --- | --- | --- |
| Budi Santoso | Pinjaman lunas, syarat terpenuhi | Ajukan pinjaman baru, lihat riwayat dan akad |
| Siti Aminah | Angsuran ke-2 terlambat sekitar 40 hari | Lihat denda dan tunggakan; admin mengirim pengingat |
| Agus Setiawan | Angsuran ke-7 dibayar sebagian | Verifikasi pembayaran sebagian |
| Dedi Irawan | Bukti bayar menunggu verifikasi, angsuran ke-5 jatuh tempo 2 hari lagi | Teller memverifikasi pembayaran |
| Andi Wijaya, Lina Marlina | Pengajuan pinjaman baru | Admin meninjau, Manajer menyetujui |
| Rudi Hartono | Pinjaman Rp 12 juta disetujui, belum akad | Pencairan di atas batas wajib Manajer |
| Nina Kurniawati | Pinjaman disetujui, sudah akad | Pencairan oleh Teller |
| Rina Oktaviani | Simpanan wajib menunggak 4 bulan | Tidak lolos syarat kelayakan |
| Hendra Gunawan | KYC menunggu, tanpa rekening | Verifikasi KYC dan gate rekening utama |

Urutan demo yang disarankan: (1) login sebagai Budi dan lihat dashboard, simulasi, serta halaman Ajukan Pinjaman; (2) login sebagai Admin, buka Verifikasi KYC, Tunggakan, dan Log Penagihan; (3) login sebagai Manajer untuk persetujuan pinjaman; (4) login sebagai Teller untuk pencairan dan verifikasi pembayaran.

## 13. Kriteria Penerimaan

- [ ] Pengunjung dapat membuka seluruh halaman publik tanpa login.
- [ ] Link navbar, footer, sidebar, tombol CTA, dan detail tidak menghasilkan 404 kecuali URL memang tidak ada.
- [ ] Login admin dan anggota menghasilkan session sesuai role.
- [ ] Route admin dan anggota menolak role yang salah.
- [ ] Dashboard menampilkan angka dari database aktif.
- [ ] CRUD admin menyimpan perubahan ke MySQL.
- [ ] Pencairan pinjaman membuat angsuran sesuai tenor, jatuh tempo pertama 1 bulan setelah tanggal pencairan.
- [ ] Anggota tanpa rekening utama tidak dapat mengajukan pinjaman.
- [ ] Angsuran hanya dapat dibayar berurutan; pembayaran yang diterima admin menjadikan angsuran `LUNAS` dan pinjaman otomatis `LUNAS` saat seluruh angsuran lunas.
- [ ] Pembayaran yang ditolak mengembalikan angsuran ke status semula dan dapat diunggah ulang.
- [ ] Pengecekan jatuh tempo menandai angsuran terlambat, menghitung denda, dan tidak membuat notifikasi ganda dalam sehari.
- [ ] Ikon lonceng menampilkan jumlah belum dibaca; klik notifikasi menandainya terbaca.
- [ ] Hanya satu mitra yang dapat menjadi sorotan dan hanya satu kantor yang dapat menjadi pusat.
- [ ] Perubahan menu footer, media sosial aktif, metode pembayaran, dan kontak di admin langsung tampil di footer publik.
- [ ] Halaman `/kantor-cabang` menampilkan peta OpenStreetMap yang berpindah sesuai kantor yang dipilih.
- [ ] Logo mitra di beranda bergerak tanpa lompatan, berhenti saat hover, dan menjadi grid statis saat `prefers-reduced-motion` aktif.
- [ ] Banner di luar rentang tanggal atau nonaktif tidak tampil di situs.
- [ ] Newsletter menyimpan email valid (tanpa duplikat) dan menolak email tidak valid.
- [ ] Seluruh link footer dan banner menghasilkan status 200 (kecuali tautan sosial eksternal fiktif).
- [ ] Form kontak membuat record `Pesan`.
- [ ] Galeri memiliki filter dan lightbox.
- [ ] Laporan dapat dicetak.
- [ ] `npm run lint` berhasil.
- [ ] `npx tsc --noEmit` berhasil.
- [ ] `npm run build` berhasil.

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Metadata MariaDB XAMPP tidak kompatibel | Sediakan jalur `prisma migrate diff` pada README |
| Password atau secret bocor | Gunakan `.env`, bcrypt, dan `.env.example` tanpa kredensial nyata |
| Anggota melihat data anggota lain | Filter semua query dengan `anggotaId` dari session |
| Persetujuan pinjaman tanpa jadwal | Server Action membuat angsuran dalam transaction |
| Link baru tidak memiliki halaman | Audit route otomatis dan build route sebelum demo |
| Cron tidak berjalan saat server mati | Tombol "Jalankan Pengecekan Sekarang" untuk menjalankan manual |
| Email gagal terkirim | Kegagalan dicatat di `Notifikasi.emailStatus`, notifikasi dalam aplikasi tetap dibuat |
| Klaim pemasaran melebihi fitur nyata (mis. "data terenkripsi", "tanpa biaya tersembunyi") | Catat sebagai keterbatasan; sesuaikan teks atau implementasi sebelum dipakai sungguhan |
| Halaman legal/keamanan berupa draf | Tinjau hukum dan sesuaikan dengan kondisi deployment sebelum produksi |

## 15. Status Tahap Pengembangan

| Tahap | Cakupan | Status |
| --- | --- | --- |
| 1–7 | Situs publik, area anggota/admin, CRUD, seed, upload gambar, foto profil, verifikasi KTP | Selesai |
| 8A | Rekening bank dan pencairan pinjaman | Selesai |
| 8B | Pembayaran angsuran dengan verifikasi admin | Selesai |
| 8C | Notifikasi, pengingat jatuh tempo, denda otomatis, email, WhatsApp | Selesai |
| 9A | Logo dan identitas visual BuyaLater | Selesai |
| 9B | Banner, Testimoni, Mitra, Pencapaian, Keunggulan + CRUD admin | Selesai |
| 9C | Copywriting beranda, `/tentang`, `/keamanan`, `/syarat-ketentuan`, `/kebijakan-privasi` | Selesai |
| 9D | Carousel banner footer, footer lengkap, newsletter, tombol WhatsApp | Selesai |
| 9E | Section mitra baru di beranda, halaman `/mitra`, field detail mitra | Selesai |
| 9F | Logo mitra di beranda menjadi marquee tanpa putus (`MitraMarquee`) | Selesai |
| 10A | Detail mitra (tingkat, sorotan, kutipan, warna brand), penghargaan, kantor cabang + peta, footer dinamis (menu, media sosial, metode pembayaran), identitas situs | Selesai |
| 10B | Desain ulang section mitra beranda dan halaman `/mitra` (tema navy gelap, dua marquee, strip angka, penghargaan) | Selesai |
| 10C | Desain ulang footer: band CTA melayang dengan mockup ponsel, footer navy 5 kolom dari database, newsletter, metode pembayaran, accordion menu di HP (CTA penutup beranda dihapus karena digantikan band footer) | Selesai |
| 10D | Rapikan tampilan situs publik: ritme latar putih/abu/navy, label kapital dikurangi, hierarki radius (10/16/28px), bayangan navy, navbar blur saat scroll, tombol gradien berkilau, animasi masuk hanya di hero, gambar artikel bertema keuangan/UMKM, dukungan prefers-reduced-motion | Selesai |
| 11A | Keamanan dan keakuratan transaksi: Decimal, berkas privat, transaksi atomik, otorisasi 4 peran, validasi Zod, audit log, buku mutasi, kunci login, reset password, soft delete | Selesai |
| 11B | KYC, aturan kelayakan, akad digital + PDF, keamanan rekening, kode unik + hash bukti + pembayaran sebagian/lebih, pelunasan dipercepat, batas denda, restrukturisasi, SHU | Selesai |
| 12 | Dukungan Capacitor (Android/iOS) dengan mode kabel USB | Selesai |
| 13 | Koperasi close loop: khusus anggota, bukan pinjol (copy, tagline, section "BuyaLater Bukan Pinjol", logo OJK sebagai acuan regulasi), bunga per tahun + metode + biaya admin + batas Permenkop UKM 8/2023, denda 0,05% dengan masa tenggang, Ringkasan Biaya sebelum akad, penagihan beretika (jadwal, hari libur, log, kata terlarang), persetujuan data, unduh data & penutupan akun, pengaduan, kesehatan koperasi, `/hak-anggota` | Selesai |
| 14 | Login Google/Apple (anggota terdaftar saja), penyesuaian tampilan mobile (skala 14px, kartu ringkas, viewport), layar sambutan, batas laju + header keamanan, pembaruan paket, escape email, pendaftaran tidak membocorkan akun, data demo bertanggal relatif (baru), panduan login untuk penguji | Selesai |
| 15 | Mode gelap/terang (bawaan gelap) untuk situs publik, dashboard admin, dan portal anggota, dashboard admin diperkaya 8 grafik (area, donat, batang, meteran, sparkline), grafik simpanan dan progres pelunasan di portal anggota | Selesai |

## 16. Roadmap Lanjutan

1. Halaman admin untuk melihat dan mengekspor `Subscriber`, serta mengirim newsletter.
2. Halaman admin untuk `Keunggulan`, dan penempatan banner `FOOTER`/`SIDEBAR` yang lebih luas.
3. Tambahkan export laporan CSV/PDF.
4. Login Google di dalam aplikasi mobile (butuh plugin native).
5. Tambahkan test otomatis untuk Server Actions, authorization, dan `cekJatuhTempo()`.
6. Pindahkan penjadwalan ke worker/cron eksternal untuk deployment serverless.
7. Peninjauan hukum untuk halaman syarat dan privasi, serta enkripsi data sensitif di level penyimpanan bila diperlukan.
