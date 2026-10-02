import { prisma } from "@/lib/prisma";

/** Pengajuan KYC terbaru anggota (status terbaru menentukan kelayakan). */
export async function kycTerbaru(anggotaId: string, klien: Pick<typeof prisma, "verifikasiAnggota"> = prisma) {
  return klien.verifikasiAnggota.findFirst({ where: { anggotaId }, orderBy: { createdAt: "desc" } });
}
