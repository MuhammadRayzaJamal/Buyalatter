import { LegalPage, type LegalSection } from "@/components/public/legal-page";

export const metadata = { title: "Kebijakan Privasi" };

const sections: LegalSection[] = [
  { judul: "Data yang kami kumpulkan", paragraf: ["Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan koperasi:"], daftar: ["Data akun dan identitas: nama, alamat email, kata sandi (disimpan sebagai hash), NIK, alamat, dan nomor HP.", "Dokumen: foto profil (opsional) dan foto KTP.", "Data keuangan: rekening bank, simpanan, penarikan, pinjaman, angsuran, dan bukti transfer.", "Data komunikasi: pesan yang Anda kirim lewat formulir kontak serta riwayat notifikasi."] },
  { judul: "Tujuan penggunaan data", daftar: ["Memverifikasi keanggotaan dan mencegah penyalahgunaan identitas.", "Memproses simpanan, pinjaman, pencairan, dan angsuran.", "Mengirim notifikasi dan pengingat jatuh tempo lewat aplikasi dan email.", "Menyusun laporan internal koperasi dan memenuhi kewajiban hukum."] },
  { judul: "Dengan siapa data dibagikan", paragraf: ["BuyaLater tidak menjual atau menyewakan data pribadi Anda. Data hanya dapat diakses pengurus yang berwenang. Data dapat dibagikan kepada penyedia layanan pendukung (misalnya penyedia pengiriman email) sebatas yang diperlukan, atau kepada pihak berwenang bila diwajibkan oleh hukum."] },
  { judul: "Penyimpanan dan keamanan", paragraf: ["Data disimpan dengan pembatasan akses berdasarkan peran. Foto KTP disimpan privat dan hanya dapat dibuka pemilik akun serta pengurus berwenang. Penjelasan lengkap ada di halaman Keamanan."] },
  { judul: "Jangka waktu penyimpanan", paragraf: ["Data disimpan selama keanggotaan aktif dan selama diperlukan untuk pembukuan serta kewajiban hukum, lalu dihapus atau dianonimkan sesuai ketentuan yang berlaku."] },
  { judul: "Hak Anda", paragraf: ["Sesuai peraturan perundang-undangan di Indonesia, termasuk Undang-Undang Pelindungan Data Pribadi, Anda berhak:"], daftar: ["Mengakses dan memperbarui data pribadi Anda melalui halaman Profil.", "Meminta koreksi data yang tidak akurat.", "Meminta penghapusan data sepanjang tidak bertentangan dengan kewajiban pembukuan dan hukum.", "Menarik persetujuan dan menanyakan cara data Anda diproses."] },
  { judul: "Cookie dan sesi", paragraf: ["Kami memakai cookie sesi yang diperlukan agar Anda tetap login dengan aman. Kami tidak memakai cookie iklan."] },
  { judul: "Perubahan kebijakan", paragraf: ["Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan diumumkan melalui situs atau notifikasi."] },
];

export default function KebijakanPrivasiPage() {
  return <LegalPage diperbarui="1 Oktober 2026" judul="Kebijakan Privasi" label="Legal" ringkasan="Bagaimana BuyaLater mengumpulkan, menggunakan, dan melindungi data pribadi Anda." sections={sections} />;
}
