import { LegalPage, type LegalSection } from "@/components/public/legal-page";

export const metadata = { title: "Hak dan Kewajiban Anggota" };

const sections: LegalSection[] = [
  { judul: "Hak anggota", paragraf: ["Sebagai pemilik koperasi, setiap anggota BuyaLater berhak atas hal-hal berikut."], daftar: [
    "Informasi biaya yang jelas. Sebelum menyetujui akad, Anda melihat Ringkasan Biaya Pinjaman: pokok, bunga per tahun dan bunga efektif per tahun, total bunga, biaya administrasi, total yang harus dibayar, cicilan per bulan, serta ketentuan denda dan batasnya.",
    "Penagihan yang beretika. Pengingat dan penagihan hanya dikirim kepada Anda sendiri, tidak pernah kepada keluarga, kontak darurat, atau tempat kerja; hanya Senin–Sabtu pukul 08.00–20.00 WIB di luar hari libur nasional; maksimal satu pengingat per hari; dengan bahasa yang sopan.",
    "Pengaduan. Anda dapat menyampaikan pengaduan lewat menu Pengaduan atau tombol Laporkan Penagihan Tidak Pantas, dan memperoleh tanggapan paling lambat 10 hari kerja.",
    "Perlindungan data pribadi. Persetujuan penggunaan data diminta terpisah untuk verifikasi identitas, penilaian kelayakan, dan pengingat; Anda dapat mengunduh salinan data pribadi dan mengajukan penutupan akun setelah semua pinjaman lunas.",
    "Ikut rapat anggota dan menyampaikan pendapat dalam musyawarah sesuai anggaran dasar koperasi.",
    "Menerima Sisa Hasil Usaha (SHU) sesuai jasa simpanan dan jasa pinjaman Anda.",
    "Melunasi pinjaman lebih awal; bunga bulan-bulan berikutnya tidak ditagih.",
    "Mengajukan restrukturisasi bila mengalami kesulitan membayar.",
  ] },
  { judul: "Kewajiban anggota", daftar: [
    "Memberikan data yang benar dan memperbarui data bila berubah.",
    "Membayar simpanan pokok dan rutin membayar simpanan wajib; pinjaman hanya dapat diajukan bila simpanan wajib tidak menunggak lebih dari 2 bulan.",
    "Membayar angsuran tepat waktu sesuai jadwal pada akad; keterlambatan dikenai denda setelah masa tenggang, dengan batas total sesuai akad.",
    "Menjaga kerahasiaan akun dan kata sandi.",
    "Menaati anggaran dasar, anggaran rumah tangga, dan keputusan rapat anggota.",
    "Menyampaikan kesulitan membayar kepada pengurus sedini mungkin agar dapat dibicarakan secara kekeluargaan.",
  ] },
  { judul: "Dasar pengaturan", paragraf: ["Suku bunga BuyaLater mengacu pada Permenkop UKM 8/2023 (bunga pinjaman efektif maksimal 24% per tahun, bunga simpanan maksimal 9% per tahun). Penagihan mengikuti prinsip pelindungan konsumen POJK 22/2023, dan pelindungan data pribadi mengikuti prinsip Undang-Undang Pelindungan Data Pribadi."] },
];

export default function HakAnggotaPage() {
  return <LegalPage diperbarui="3 Oktober 2026" judul="Hak dan Kewajiban Anggota" label="Anggota koperasi" ringkasan="BuyaLater adalah koperasi simpan pinjam yang hanya melayani anggota. Inilah hak yang Anda miliki dan kewajiban yang kita jalankan bersama." sections={sections} />;
}
