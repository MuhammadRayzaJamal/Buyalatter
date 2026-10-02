/** Data kontak dummy BuyaLater (fiktif, proyek akademik). Dipakai footer dan tombol WhatsApp. */
export const KONTAK = {
  alamat: "Jl. Merdeka No. 45, Kota Contoh",
  telepon: "(021) 1234-5678",
  teleponHref: "tel:+622112345678",
  whatsapp: "0812-3456-7890",
  whatsappNomor: "6281234567890",
  email: "halo@buyalater.id",
  jam: "Senin–Jumat, 08.00–16.00 WIB",
  sosial: { instagram: "https://www.instagram.com/buyalater", facebook: "https://www.facebook.com/buyalater", youtube: "https://www.youtube.com/" },
} as const;

export const waLink = (pesan = "Halo BuyaLater, saya ingin bertanya tentang layanan simpan pinjam.", nomor: string = KONTAK.whatsappNomor) => `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
