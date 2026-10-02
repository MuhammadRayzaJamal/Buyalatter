import { Decimal, dec, NOL, bulat2, type MasukanUang } from "@/lib/uang";

type BarisAngsuran = { angsuranKe: number; jumlah: MasukanUang; denda: MasukanUang; terbayar: MasukanUang; status: string };

/**
 * Pelunasan dipercepat: sisa pokok + bunga bulan berjalan saja (bunga bulan-bulan berikutnya tidak ditagih) + denda berjalan − yang sudah dibayar.
 * Tiap angsuran terdiri dari bagian pokok (proporsional jumlah/totalBayar × pokok pinjaman) dan bagian bunga.
 * "Bulan berjalan" = angsuran belum lunas yang paling awal.
 */
export function hitungPelunasan(pinjaman: { jumlah: MasukanUang; totalBayar: MasukanUang }, angsuran: BarisAngsuran[]) {
  const belum = angsuran.filter((a) => a.status !== "LUNAS").sort((a, b) => a.angsuranKe - b.angsuranKe);
  if (belum.length === 0) return null;
  const pokokPinjaman = dec(pinjaman.jumlah);
  const total = dec(pinjaman.totalBayar);
  const bagian = (jumlah: MasukanUang) => {
    const pokok = bulat2(dec(jumlah).times(pokokPinjaman).div(total));
    return { pokok, bunga: dec(jumlah).minus(pokok) };
  };
  let sisaPokok = NOL; let bungaSemua = NOL; let denda = NOL; let terbayar = NOL;
  for (const a of belum) {
    const b = bagian(a.jumlah);
    sisaPokok = sisaPokok.plus(b.pokok); bungaSemua = bungaSemua.plus(b.bunga);
    denda = denda.plus(dec(a.denda)); terbayar = terbayar.plus(dec(a.terbayar));
  }
  const bungaBulanBerjalan = bagian(belum[0].jumlah).bunga;
  const totalBayar = Decimal.max(NOL, sisaPokok.plus(bungaBulanBerjalan).plus(denda).minus(terbayar));
  return { jumlahAngsuranSisa: belum.length, sisaPokok, bungaBulanBerjalan, denda, terbayar, total: totalBayar, bungaDihemat: bungaSemua.minus(bungaBulanBerjalan) };
}
/** Alokasi uang yang diterima ke satu angsuran: denda dilunasi lebih dulu, lalu pokok; kelebihan dikembalikan terpisah. */
export function alokasiPembayaran(angsuran: { jumlah: MasukanUang; denda: MasukanUang; terbayar: MasukanUang }, diterima: MasukanUang) {
  const jumlah = dec(angsuran.jumlah); const denda = dec(angsuran.denda); const terbayar = dec(angsuran.terbayar); const uang = dec(diterima);
  const sisa = Decimal.max(NOL, jumlah.plus(denda).minus(terbayar));
  const diterapkan = Decimal.min(uang, sisa);
  const dendaTersisa = denda.minus(Decimal.min(denda, terbayar));
  const dendaBagian = Decimal.min(diterapkan, dendaTersisa);
  return { sisaSebelum: sisa, diterapkan, denda: dendaBagian, pokok: diterapkan.minus(dendaBagian), kelebihan: uang.minus(diterapkan), lunas: diterapkan.eq(sisa) && sisa.gt(0) };
}
