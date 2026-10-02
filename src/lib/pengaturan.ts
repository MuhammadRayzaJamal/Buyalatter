import { prisma } from "@/lib/prisma";
import { dec } from "@/lib/uang";

export async function getPengaturanTagihan() {
  const row = await prisma.pengaturan.findFirst();
  return {
    dendaPersenPerHari: dec(row?.dendaPersenPerHari ?? "0.1"),
    hariPengingat: row?.hariPengingatSebelumJatuhTempo ?? 3,
    batasKritis: row?.batasHariTerlambatKritis ?? 30,
  };
}

/** Batas nominal transaksi yang diatur admin; nilai bawaan dipakai bila Pengaturan belum ada. */
export async function getBatas(tx: Pick<typeof prisma, "pengaturan"> = prisma) {
  const row = await tx.pengaturan.findFirst();
  return {
    bungaDefault: dec(row?.bungaDefault ?? "1.5"),
    batasPencairanManajer: dec(row?.batasPencairanManajer ?? "10000000"),
    minPinjaman: dec(row?.minPinjaman ?? "1000000"),
    maksPinjaman: dec(row?.maksPinjaman ?? "50000000"),
    minTransaksi: dec(row?.minTransaksi ?? "10000"),
    maksTransaksi: dec(row?.maksTransaksi ?? "100000000"),
    minLamaAnggotaBulan: row?.minLamaAnggotaBulan ?? 3,
    plafonKaliSimpanan: dec(row?.plafonKaliSimpanan ?? "3"),
    maksRasioAngsuranPersen: dec(row?.maksRasioAngsuranPersen ?? "30"),
    maksHariTunggakan: row?.maksHariTunggakan ?? 30,
    periodeTunggakanBulan: row?.periodeTunggakanBulan ?? 12,
    batasDendaPersen: dec(row?.batasDendaPersen ?? "10"),
  };
}
export type BatasNominal = Awaited<ReturnType<typeof getBatas>>;
