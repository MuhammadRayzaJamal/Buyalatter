import type { PosisiBanner } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Banner tampil hanya jika aktif dan hari ini berada di antara tanggalMulai dan tanggalSelesai (kosong = tanpa batas). */
export async function getBannerAktif(posisi: PosisiBanner, sekarang = new Date()) {
  return prisma.banner.findMany({
    where: {
      posisi,
      isAktif: true,
      AND: [
        { OR: [{ tanggalMulai: null }, { tanggalMulai: { lte: sekarang } }] },
        { OR: [{ tanggalSelesai: null }, { tanggalSelesai: { gte: sekarang } }] },
      ],
    },
    orderBy: [{ urutan: "asc" }, { judul: "asc" }],
  });
}

export function statusBanner(banner: { isAktif: boolean; tanggalMulai: Date | null; tanggalSelesai: Date | null }, sekarang = new Date()) {
  if (!banner.isAktif) return "nonaktif" as const;
  if (banner.tanggalMulai && banner.tanggalMulai > sekarang) return "terjadwal" as const;
  if (banner.tanggalSelesai && banner.tanggalSelesai < sekarang) return "berakhir" as const;
  return "tayang" as const;
}
