/** Simpanan wajib dinilai pada bulan-bulan penuh terakhir; anggota tidak boleh menunggak lebih dari batas berikut. */
export const JENDELA_WAJIB_BULAN = 12;
export const MAKS_TUNGGAKAN_WAJIB_BULAN = 2;

const kunciBulan = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** Jumlah bulan simpanan wajib yang belum dibayar pada jendela bulan penuh terakhir (dimulai sejak bulan setelah anggota bergabung). */
export function tunggakanWajibBulan(tanggalMasuk: Date, tanggalBayarWajib: Date[], sekarang: Date) {
  const terakhir = kunciBulan(sekarang) - 1; // bulan berjalan belum jatuh tempo
  const awal = Math.max(terakhir - JENDELA_WAJIB_BULAN + 1, kunciBulan(tanggalMasuk) + 1);
  if (terakhir < awal) return { jatuhTempo: 0, tunggakan: 0 };
  const dibayar = new Set(tanggalBayarWajib.map(kunciBulan).filter((k) => k >= awal && k <= terakhir));
  return { jatuhTempo: terakhir - awal + 1, tunggakan: terakhir - awal + 1 - dibayar.size };
}

