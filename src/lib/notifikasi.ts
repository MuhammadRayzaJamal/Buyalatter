import type { TipeNotifikasi } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Input = { userId: string; judul: string; pesan: string; tipe: TipeNotifikasi; link?: string | null; angsuranId?: string | null; emailStatus?: string | null };

/** Notifikasi bersifat pelengkap: kegagalan membuatnya tidak boleh menggagalkan aksi utama. */
export async function buatNotifikasi(input: Input) {
  try {
    return await prisma.notifikasi.create({ data: { ...input, link: input.link ?? null, angsuranId: input.angsuranId ?? null, emailStatus: input.emailStatus ?? null } });
  } catch (error) {
    console.error("[notifikasi] gagal membuat notifikasi", error);
    return null;
  }
}

export async function userIdDariAnggota(anggotaId: string) {
  const anggota = await prisma.anggota.findUnique({ where: { id: anggotaId }, select: { userId: true } });
  return anggota?.userId ?? null;
}
