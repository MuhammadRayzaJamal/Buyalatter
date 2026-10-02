import { LegalPage, type LegalSection } from "@/components/public/legal-page";

export const metadata = { title: "Keamanan" };

const sections: LegalSection[] = [
  { judul: "Akun dan kata sandi", paragraf: ["Kata sandi Anda tidak pernah disimpan dalam bentuk aslinya. Sistem hanya menyimpan hasil hash (bcrypt) sehingga pengurus pun tidak dapat melihat kata sandi Anda.", "Setiap sesi login dilindungi token sesi, dan Anda dapat keluar kapan saja dari menu Keluar."] },
  { judul: "Pembatasan akses berdasarkan peran", paragraf: ["Anggota hanya dapat melihat dan mengubah data miliknya sendiri. Area pengurus dipisahkan dari area anggota dan hanya dapat dibuka oleh akun dengan peran admin. Setiap tindakan pengurus diperiksa ulang di sisi server."] },
  { judul: "Perlindungan foto KTP", paragraf: ["Foto KTP tidak disimpan di folder publik. Berkas hanya dapat dibuka oleh pemilik akun dan pengurus yang berwenang setelah sistem memeriksa sesi login. Tautan langsung ke berkas tidak dapat diakses orang lain."] },
  { judul: "Verifikasi transaksi", paragraf: ["Dana Anda dijaga dengan verifikasi berlapis:"], daftar: ["Keanggotaan baru diverifikasi pengurus berdasarkan data dan foto KTP.", "Pencairan pinjaman dilakukan pengurus ke rekening atas nama anggota, dengan bukti transfer yang tercatat.", "Pembayaran angsuran baru dinyatakan lunas setelah pengurus memeriksa bukti pembayaran.", "Seluruh riwayat simpanan, pinjaman, dan angsuran dapat Anda lihat kapan saja di portal anggota."] },
  { judul: "Koneksi dan penyimpanan data", paragraf: ["Layanan produksi BuyaLater diakses melalui koneksi terenkripsi (HTTPS). Data tersimpan di basis data yang aksesnya dibatasi, dan berkas unggahan dipisahkan berdasarkan jenisnya."] },
  { judul: "Tips keamanan untuk Anda", daftar: ["Jangan membagikan kata sandi kepada siapa pun, termasuk yang mengaku pengurus BuyaLater.", "BuyaLater tidak pernah meminta kata sandi atau kode OTP lewat telepon, WhatsApp, maupun email.", "Pastikan alamat situs benar sebelum login, dan selalu keluar jika memakai perangkat bersama.", "Transfer pembayaran hanya ke rekening koperasi yang tercantum di halaman pembayaran angsuran.", "Segera hubungi kami jika melihat aktivitas yang tidak Anda kenal."] },
];

export default function KeamananPage() {
  return <LegalPage diperbarui="1 Oktober 2026" judul="Keamanan data dan dana Anda" label="Keamanan" ringkasan="Kepercayaan adalah fondasi koperasi. Berikut cara BuyaLater menjaga data pribadi dan dana anggota." sections={sections} />;
}
