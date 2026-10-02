import { prisma, type Tx } from "@/lib/prisma";

type Klien = Tx | typeof prisma;

/** Opportunistically flips overdue unpaid installments to TERLAMBAT. No cron in this app, so this runs on read. */
export async function syncStatusTerlambat() {
  await prisma.angsuran.updateMany({
    where: { status: "BELUM", tanggalJatuhTempo: { lt: new Date() } },
    data: { status: "TERLAMBAT" },
  });
}

/** Angsuran must be paid in order: angsuranKe N requires all angsuran < N to already be LUNAS. */
export async function isAngsuranPayable(pinjamanId: string, angsuranKe: number, tx: Klien = prisma) {
  if (angsuranKe === 1) return true;
  const belumLunas = await tx.angsuran.count({
    where: { pinjamanId, angsuranKe: { lt: angsuranKe }, status: { not: "LUNAS" } },
  });
  return belumLunas === 0;
}

/** After marking an angsuran LUNAS, promote the parent Pinjaman to LUNAS once every installment is paid. */
export async function markPinjamanLunasIfComplete(pinjamanId: string, tx: Klien = prisma) {
  const sisa = await tx.angsuran.count({ where: { pinjamanId, status: { not: "LUNAS" } } });
  if (sisa === 0) {
    await tx.pinjaman.update({ where: { id: pinjamanId }, data: { status: "LUNAS" } });
  }
}
