import { getBatas } from "@/lib/pengaturan";
import { prisma, type Tx } from "@/lib/prisma";
import { dec, Decimal, NOL, type MasukanUang } from "@/lib/uang";

type Klien = Tx | typeof prisma;

/** Sisa kuota denda sebuah pinjaman = batasDenda% × pokok − denda semua angsuran lain. Setelah habis, denda berhenti bertambah. */
export async function sisaKuotaDenda(klien: Klien, pinjamanId: string, kecualiAngsuranId: string) {
  const [pinjaman, batas, lain] = await Promise.all([
    klien.pinjaman.findUnique({ where: { id: pinjamanId }, select: { jumlah: true } }),
    getBatas(),
    klien.angsuran.aggregate({ where: { pinjamanId, id: { not: kecualiAngsuranId } }, _sum: { denda: true } }),
  ]);
  if (!pinjaman) return NOL;
  const kuota = dec(pinjaman.jumlah).times(batas.batasDendaPersen).div(100).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  return Decimal.max(NOL, kuota.minus(dec(lain._sum.denda)));
}

/** Denda hasil hitung dipangkas agar total denda pinjaman tidak melewati batas. */
export async function batasiDenda(klien: Klien, angsuran: { id: string; pinjamanId: string }, dendaHitung: MasukanUang) {
  return Decimal.min(dec(dendaHitung), await sisaKuotaDenda(klien, angsuran.pinjamanId, angsuran.id));
}
