import { prisma } from "@/lib/prisma";
import { Decimal, NOL, dec, type MasukanUang } from "@/lib/uang";

export type PembagianShu = { anggotaId: string; jasaModal: Decimal; jasaPinjaman: Decimal; total: Decimal };

const bagiProporsional = (pool: Decimal, bagian: Decimal, total: Decimal) => (total.gt(0) ? pool.times(bagian).div(total).toDecimalPlaces(2, Decimal.ROUND_DOWN) : NOL);

/**
 * Fungsi murni pembagian SHU. Jasa modal dibagi sebanding saldo simpanan, jasa pinjaman sebanding bunga (jasa) yang dibayar anggota.
 * Pembulatan ke bawah per anggota; sisa pembulatan tetap di kas koperasi.
 */
export function hitungPembagianShu(masukan: { totalShu: MasukanUang; persenJasaModal: MasukanUang; persenJasaPinjaman: MasukanUang; modal: Map<string, Decimal>; jasa: Map<string, Decimal> }): PembagianShu[] {
  const total = dec(masukan.totalShu);
  const poolModal = total.times(dec(masukan.persenJasaModal)).div(100);
  const poolPinjaman = total.times(dec(masukan.persenJasaPinjaman)).div(100);
  const totalModal = [...masukan.modal.values()].reduce((a, b) => a.plus(b), NOL);
  const totalJasa = [...masukan.jasa.values()].reduce((a, b) => a.plus(b), NOL);
  const ids = new Set([...masukan.modal.keys(), ...masukan.jasa.keys()]);
  return [...ids].map((anggotaId) => {
    const jasaModal = bagiProporsional(poolModal, masukan.modal.get(anggotaId) ?? NOL, totalModal);
    const jasaPinjaman = bagiProporsional(poolPinjaman, masukan.jasa.get(anggotaId) ?? NOL, totalJasa);
    return { anggotaId, jasaModal, jasaPinjaman, total: jasaModal.plus(jasaPinjaman) };
  });
}

/** Dasar perhitungan dari database: saldo simpanan s.d. akhir tahun dan bunga yang dibayar sepanjang tahun, hanya anggota aktif. */
export async function ambilDasarShu(tahun: number) {
  const akhir = new Date(tahun, 11, 31, 23, 59, 59, 999); const awal = new Date(tahun, 0, 1);
  const anggota = await prisma.anggota.findMany({ where: { status: "AKTIF" }, select: { id: true } });
  const ids = anggota.map((a) => a.id);
  const [simpanan, penarikan, angsuran] = await Promise.all([
    prisma.simpanan.groupBy({ by: ["anggotaId"], where: { anggotaId: { in: ids }, tanggal: { lte: akhir } }, _sum: { jumlah: true } }),
    prisma.penarikan.groupBy({ by: ["anggotaId"], where: { anggotaId: { in: ids }, status: "DISETUJUI", tanggal: { lte: akhir } }, _sum: { jumlah: true } }),
    prisma.angsuran.findMany({ where: { status: "LUNAS", tanggalBayar: { gte: awal, lte: akhir }, pinjaman: { anggotaId: { in: ids } } }, select: { jumlah: true, pinjaman: { select: { anggotaId: true, jumlah: true, totalBayar: true } } } }),
  ]);
  const modal = new Map<string, Decimal>(); const jasa = new Map<string, Decimal>();
  for (const s of simpanan) modal.set(s.anggotaId, dec(s._sum.jumlah));
  for (const p of penarikan) modal.set(p.anggotaId, (modal.get(p.anggotaId) ?? NOL).minus(dec(p._sum.jumlah)));
  for (const [id, nilai] of modal) if (nilai.lte(0)) modal.delete(id);
  for (const a of angsuran) {
    const pokok = dec(a.jumlah).times(dec(a.pinjaman.jumlah)).div(dec(a.pinjaman.totalBayar));
    const bunga = dec(a.jumlah).minus(pokok);
    jasa.set(a.pinjaman.anggotaId, (jasa.get(a.pinjaman.anggotaId) ?? NOL).plus(bunga));
  }
  return { modal, jasa };
}
