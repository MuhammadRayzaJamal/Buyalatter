import { LegalPage, type LegalSection } from "@/components/public/legal-page";

export const metadata = { title: "Syarat dan Ketentuan" };

const sections: LegalSection[] = [
  { judul: "Ketentuan umum", paragraf: ["Dengan mendaftar dan menggunakan layanan BuyaLater, Anda menyatakan telah membaca, memahami, dan menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon tidak menggunakan layanan kami."] },
  { judul: "Keanggotaan", daftar: ["Pendaftar wajib mengisi data yang benar, lengkap, dan dapat dipertanggungjawabkan, termasuk NIK dan foto KTP yang masih berlaku.", "Keanggotaan aktif setelah data dan KTP diverifikasi pengurus. Pengurus berhak menolak pendaftaran yang datanya tidak sesuai dan menyampaikan alasannya.", "Anggota bertanggung jawab menjaga kerahasiaan akun dan kata sandinya."] },
  { judul: "Simpanan", paragraf: ["Simpanan terdiri atas simpanan pokok, simpanan wajib, dan simpanan sukarela. Besaran simpanan pokok dan wajib mengikuti ketentuan koperasi yang berlaku. Penarikan simpanan diajukan melalui portal anggota dan diproses setelah disetujui pengurus."] },
  { judul: "Pinjaman", daftar: ["Pinjaman diajukan melalui portal anggota dengan nominal minimal Rp 1.000.000 dan tenor 3 sampai 24 bulan.", "Bunga mengikuti ketentuan yang berlaku saat pengajuan dan ditampilkan pada simulasi serta rincian pinjaman.", "Setiap pengajuan ditinjau pengurus; persetujuan tidak dijamin.", "Anggota wajib memiliki rekening bank atas nama sendiri sebagai tujuan pencairan."] },
  { judul: "Pencairan", paragraf: ["Pinjaman yang disetujui dicairkan pengurus ke rekening tujuan anggota. Jika dikenakan biaya administrasi, jumlahnya dicantumkan pada rincian pencairan beserta jumlah dana yang diterima. Jadwal angsuran dibuat otomatis setelah dana dicairkan."] },
  { judul: "Angsuran dan denda keterlambatan", daftar: ["Angsuran dibayar berurutan sesuai jadwal, dimulai dari angsuran yang paling awal.", "Pembayaran dilakukan melalui transfer ke rekening koperasi dengan mengunggah bukti; angsuran lunas setelah diverifikasi pengurus.", "Angsuran yang melewati jatuh tempo berstatus terlambat dan dikenai denda per hari sebagai persentase dari nilai angsuran, sesuai pengaturan koperasi yang berlaku (saat ini 0,1% per hari).", "BuyaLater mengirim pengingat sebelum jatuh tempo lewat notifikasi aplikasi dan email sebagai bantuan; pengingat tidak menghapus kewajiban membayar tepat waktu."] },
  { judul: "Larangan", daftar: ["Memberikan data palsu atau memakai identitas orang lain.", "Mencoba mengakses data anggota lain atau area pengurus tanpa hak.", "Menggunakan layanan untuk tujuan yang melanggar hukum."] },
  { judul: "Penangguhan dan penutupan keanggotaan", paragraf: ["Pengurus dapat menonaktifkan keanggotaan jika ditemukan pelanggaran ketentuan. Kewajiban yang sudah ada tetap berlaku sampai diselesaikan."] },
  { judul: "Perubahan ketentuan", paragraf: ["BuyaLater dapat memperbarui ketentuan ini dari waktu ke waktu. Versi terbaru selalu tersedia di halaman ini dan berlaku sejak tanggal pembaruan."] },
  { judul: "Hukum yang berlaku", paragraf: ["Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan diupayakan diselesaikan secara musyawarah terlebih dahulu."] },
];

export default function SyaratKetentuanPage() {
  return <LegalPage diperbarui="1 Oktober 2026" judul="Syarat dan Ketentuan" label="Legal" ringkasan="Aturan main yang berlaku bagi seluruh anggota dan pengguna layanan BuyaLater." sections={sections} />;
}
