import { prisma } from "@/lib/prisma";

export const MAKS_GAGAL = 5;
export const MENIT_KUNCI = 15;

/** Sisa menit kunci bila email sudah gagal login MAKS_GAGAL kali dalam MENIT_KUNCI menit terakhir (sejak login sukses terakhir); 0 = tidak terkunci. */
export async function sisaMenitKunci(email: string, sekarang = new Date()) {
  const batas = new Date(sekarang.getTime() - MENIT_KUNCI * 60_000);
  const sukses = await prisma.loginAttempt.findFirst({ where: { email, berhasil: true, createdAt: { gt: batas } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  const gagal = await prisma.loginAttempt.findMany({
    where: { email, berhasil: false, createdAt: { gt: sukses?.createdAt ?? batas } },
    orderBy: { createdAt: "desc" },
    take: MAKS_GAGAL,
    select: { createdAt: true },
  });
  if (gagal.length < MAKS_GAGAL) return 0;
  const sampai = gagal[0].createdAt.getTime() + MENIT_KUNCI * 60_000;
  return Math.max(0, Math.ceil((sampai - sekarang.getTime()) / 60_000));
}

export async function catatLogin(email: string, berhasil: boolean, ipAddress: string | null) {
  await prisma.loginAttempt.create({ data: { email, berhasil, ipAddress } });
}
