/** Versi kebijakan privasi yang disetujui anggota. Naikkan saat isi kebijakan berubah. */
export const VERSI_KEBIJAKAN = "2026.10";

export const PERSETUJUAN = [
  { jenis: "VERIFIKASI_IDENTITAS", field: "persetujuanIdentitas", judul: "Verifikasi identitas", teks: "Saya menyetujui BuyaLater memakai data identitas saya (nama, NIK, alamat, foto KTP, dan swafoto) hanya untuk memverifikasi keanggotaan." },
  { jenis: "PENILAIAN_KELAYAKAN", field: "persetujuanKelayakan", judul: "Penilaian kelayakan pinjaman", teks: "Saya menyetujui BuyaLater memakai data keanggotaan, simpanan, penghasilan, dan riwayat pembayaran saya hanya untuk menilai kelayakan pinjaman." },
  { jenis: "PENGIRIMAN_PENGINGAT", field: "persetujuanPengingat", judul: "Pengiriman pengingat", teks: "Saya menyetujui BuyaLater mengirim pengingat angsuran hanya kepada saya (notifikasi, email, atau WhatsApp) pada Senin–Sabtu 08.00–20.00 WIB di luar hari libur." },
] as const;
