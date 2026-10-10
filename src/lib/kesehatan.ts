import { hariTerlambat } from "@/lib/denda";
import { JENIS_MENGUBAH_SALDO } from "@/lib/mutasi";
import { prisma } from "@/lib/prisma";
import { dec, Decimal, NOL } from "@/lib/uang";

/** Prinsip kehati-hatian: pinjaman beredar dibanding simpanan anggota. */
export const BATAS_PERINGATAN_PERSEN = 80;
export const BATAS_KRITIS_PERSEN = 90;
export const HARI_PINJAMAN_BERMASALAH = 90;

export type LevelKesehatan = "aman" | "kuning" | "merah";
export const levelRasio = (persen: number | null): LevelKesehatan => (persen === null ? "aman" : persen > BATAS_KRITIS_PERSEN ? "merah" : persen > BATAS_PERINGATAN_PERSEN ? "kuning" : "aman");

const persenDari = (bagian: Decimal, total: Decimal) => (total.lte(0) ? null : bagian.div(total).times(100).toDecimalPlaces(1).toNumber());

export async function hitungKesehatan(sekarang = new Date()) {
  const [mutasi, berjalan] = await Promise.all([
    prisma.mutasi.groupBy({ by: ["arah"], where: { jenis: { in: JENIS_MENGUBAH_SALDO } }, _sum: { jumlah: true } }),
    prisma.pinjaman.findMany({ where: { status: "DICAIRKAN" }, select: { id: true, jumlah: true, totalBayar: true, angsuran: { select: { jumlah: true, terbayar: true, status: true, tanggalJatuhTempo: true } } } }),
  ]);
  const simpanan = dec(mutasi.find((m) => m.arah === "MASUK")?._sum.jumlah).minus(dec(mutasi.find((m) => m.arah === "KELUAR")?._sum.jumlah));

  // Pokok beredar = pokok × (bagian cicilan yang belum dibayar / total cicilan).
  let beredar = NOL; let bermasalah = NOL; let jumlahBermasalah = 0;
  for (const p of berjalan) {
    const belum = p.angsuran.filter((a) => a.status !== "LUNAS").reduce((total, a) => total.plus(Decimal.max(NOL, dec(a.jumlah).minus(dec(a.terbayar)))), NOL);
    const sisaPokok = dec(p.jumlah).times(belum).div(dec(p.totalBayar));
    beredar = beredar.plus(sisaPokok);
    if (p.angsuran.some((a) => a.status === "TERLAMBAT" && hariTerlambat(a.tanggalJatuhTempo, sekarang) > HARI_PINJAMAN_BERMASALAH)) { bermasalah = bermasalah.plus(sisaPokok); jumlahBermasalah += 1; }
  }
  beredar = beredar.toDecimalPlaces(2);
  const rasio = persenDari(beredar, simpanan);
  return {
    simpanan, beredar, rasio, level: levelRasio(rasio),
    bermasalah: { jumlahPinjaman: jumlahBermasalah, totalPinjaman: berjalan.length, nominal: bermasalah.toDecimalPlaces(2), persen: persenDari(bermasalah, beredar) },
  };
}
export type Kesehatan = Awaited<ReturnType<typeof hitungKesehatan>>;
