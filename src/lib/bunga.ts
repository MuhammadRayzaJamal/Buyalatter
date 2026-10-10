import { bulat2, dec, Decimal, jadwalAngsuran, NOL, type MasukanUang } from "@/lib/uang";

/** Batas regulasi (Permenkop UKM 8/2023): tidak bisa dilampaui oleh pengaturan admin. */
export const BATAS_BUNGA_PINJAMAN_TAHUN = 24;
export const BATAS_BUNGA_SIMPANAN_TAHUN = 9;
export const BATAS_BIAYA_ADMIN_PERSEN = 1;
export const BATAS_DENDA_PERSEN_POKOK = 10;
export const PESAN_MELEBIHI_BATAS = "Melebihi batas Permenkop UKM 8/2023";

export type MetodeBungaKode = "FLAT" | "MENURUN" | "ANUITAS";
export const LABEL_METODE: Record<MetodeBungaKode, string> = {
  FLAT: "Flat (bunga dihitung dari pokok awal)",
  MENURUN: "Menurun (bunga dihitung dari sisa pokok)",
  ANUITAS: "Anuitas (cicilan tetap, bunga dari sisa pokok)",
};

/** Biaya admin diberikan sebagai persen (pengajuan baru) atau nominal (pinjaman yang sudah tersimpan); nominal didahulukan. */
export type MasukanPinjaman = { pokok: MasukanUang; bungaTahun: MasukanUang; tenorBulan: number; metode: MetodeBungaKode; biayaAdminPersen?: MasukanUang; biayaAdmin?: MasukanUang };

/** Biaya admin = persen × pokok, dibulatkan ke sen. */
export const hitungBiayaAdmin = (pokok: MasukanUang, persen: MasukanUang) => bulat2(dec(pokok).times(dec(persen)).div(100));

/** Jadwal cicilan menurut metode. Jumlah semua cicilan = totalBayar (pokok + total bunga). */
export function jadwalPinjaman(pokokMasuk: MasukanUang, bungaTahun: MasukanUang, tenorBulan: number, metode: MetodeBungaKode): Decimal[] {
  const pokok = dec(pokokMasuk); const tahunan = dec(bungaTahun);
  const bulanan = tahunan.div(1200);
  if (metode === "FLAT") return jadwalAngsuran(bulat2(pokok.plus(pokok.times(tahunan).div(100).times(tenorBulan).div(12))), tenorBulan);
  if (metode === "ANUITAS") {
    const cicilan = tahunan.isZero() ? pokok.div(tenorBulan) : pokok.times(bulanan).div(new Decimal(1).minus(new Decimal(1).plus(bulanan).pow(-tenorBulan)));
    return jadwalAngsuran(bulat2(cicilan).times(tenorBulan), tenorBulan);
  }
  // MENURUN: pokok dicicil rata, bunga dihitung dari sisa pokok tiap bulan.
  const pokokBulanan = pokok.div(tenorBulan);
  return Array.from({ length: tenorBulan }, (_, k) => bulat2(pokokBulanan.plus(pokok.minus(pokokBulanan.times(k)).times(bulanan))));
}

/**
 * Bunga efektif per tahun (%) = IRR bulanan arus kas (dana yang benar-benar diterima vs seluruh cicilan) dijadikan tahunan.
 * Biaya admin ikut terhitung karena mengurangi dana yang diterima. Hanya untuk tampilan dan pemeriksaan batas, bukan untuk uang.
 */
export function bungaEfektifPerTahun(danaDiterima: MasukanUang, jadwal: MasukanUang[]): Decimal {
  const dana = Number(dec(danaDiterima)); const bayar = jadwal.map((j) => Number(dec(j)));
  const nilaiSekarang = (r: number) => bayar.reduce((jumlah, j, k) => jumlah + j / (1 + r) ** (k + 1), 0);
  if (nilaiSekarang(0) <= dana) return NOL;
  let bawah = 0; let atas = 1;
  for (let i = 0; i < 80; i += 1) { const tengah = (bawah + atas) / 2; if (nilaiSekarang(tengah) > dana) bawah = tengah; else atas = tengah; }
  return new Decimal(((1 + (bawah + atas) / 2) ** 12 - 1) * 100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export type RingkasanBiaya = {
  pokok: Decimal; bungaTahun: Decimal; bungaEfektifTahun: Decimal; metode: MetodeBungaKode; tenorBulan: number;
  totalBunga: Decimal; biayaAdmin: Decimal; danaDiterima: Decimal; totalBayar: Decimal; totalBiaya: Decimal;
  cicilanPertama: Decimal; cicilanTerakhir: Decimal; jadwal: Decimal[];
};

/** Semua angka yang ditampilkan ke anggota sebelum akad (dan disimpan pada pengajuan) berasal dari satu fungsi ini. */
export function hitungPinjaman(m: MasukanPinjaman): RingkasanBiaya {
  const pokok = dec(m.pokok);
  const jadwal = jadwalPinjaman(pokok, m.bungaTahun, m.tenorBulan, m.metode);
  const totalBayar = jadwal.reduce((a, b) => a.plus(b), NOL);
  const biayaAdmin = m.biayaAdmin !== undefined ? dec(m.biayaAdmin) : hitungBiayaAdmin(pokok, m.biayaAdminPersen ?? 0);
  const danaDiterima = pokok.minus(biayaAdmin);
  const totalBunga = totalBayar.minus(pokok);
  return {
    pokok, bungaTahun: dec(m.bungaTahun), bungaEfektifTahun: bungaEfektifPerTahun(danaDiterima, jadwal), metode: m.metode, tenorBulan: m.tenorBulan,
    totalBunga, biayaAdmin, danaDiterima, totalBayar, totalBiaya: totalBunga.plus(biayaAdmin),
    cicilanPertama: jadwal[0], cicilanTerakhir: jadwal[jadwal.length - 1], jadwal,
  };
}

/** Bunga efektif terbesar di semua tenor yang boleh diajukan (3–24 bulan). Dipakai untuk menolak pengaturan yang melanggar batas. */
export function bungaEfektifTertinggi(bungaTahun: MasukanUang, metode: MetodeBungaKode, biayaAdminPersen: MasukanUang, tenorMin = 3, tenorMaks = 24) {
  let tertinggi = NOL;
  for (let tenor = tenorMin; tenor <= tenorMaks; tenor += 1) {
    const efektif = hitungPinjaman({ pokok: 10_000_000, bungaTahun, tenorBulan: tenor, metode, biayaAdminPersen }).bungaEfektifTahun;
    if (efektif.gt(tertinggi)) tertinggi = efektif;
  }
  return tertinggi;
}
