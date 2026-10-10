import type { KolomFooter, MediaSosial, MenuFooter, MetodePembayaran, PlatformSosial } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { KONTAK } from "@/lib/kontak";

export const KOLOM_LABEL: Record<KolomFooter, string> = { LAYANAN: "Layanan", PERUSAHAAN: "Perusahaan", BANTUAN: "Bantuan" };
export const PLATFORM_LABEL: Record<PlatformSosial, string> = { INSTAGRAM: "Instagram", FACEBOOK: "Facebook", YOUTUBE: "YouTube", TIKTOK: "TikTok", WHATSAPP: "WhatsApp" };

const DESKRIPSI_DEFAULT = "BuyaLater adalah koperasi simpan pinjam digital yang hanya melayani anggota: menabung bersama, meminjam dengan biaya yang jelas, dan keuntungan kembali ke anggota lewat SHU.";

/** Identitas, kontak, dan isi footer dari database; jatuh ke nilai bawaan (src/lib/kontak.ts) bila belum diisi admin. */
export async function getSitus() {
  const [pengaturan, menu, sosial, metode, pusat] = await Promise.all([
    prisma.pengaturan.findFirst(),
    prisma.menuFooter.findMany({ orderBy: [{ kolom: "asc" }, { urutan: "asc" }, { label: "asc" }] }),
    prisma.mediaSosial.findMany({ where: { isAktif: true }, orderBy: { urutan: "asc" } }),
    prisma.metodePembayaran.findMany({ orderBy: { urutan: "asc" } }),
    prisma.kantorCabang.findFirst({ where: { isPusat: true } }),
  ]);
  const kolom = (nama: KolomFooter): MenuFooter[] => menu.filter((item) => item.kolom === nama);
  const whatsapp = pengaturan?.whatsappCs || KONTAK.whatsapp;
  return {
    namaInstansi: pengaturan?.namaInstansi || "BuyaLater",
    deskripsi: pengaturan?.deskripsiFooter || DESKRIPSI_DEFAULT,
    email: pengaturan?.emailCs || KONTAK.email,
    telepon: pengaturan?.teleponCs || KONTAK.telepon,
    whatsapp,
    alamat: pengaturan?.alamatPusat || pusat?.alamat || KONTAK.alamat,
    jam: pusat?.jamOperasional || KONTAK.jam,
    menu: { LAYANAN: kolom("LAYANAN"), PERUSAHAAN: kolom("PERUSAHAAN"), BANTUAN: kolom("BANTUAN") } as Record<KolomFooter, MenuFooter[]>,
    sosial: sosial as MediaSosial[],
    metode: metode as MetodePembayaran[],
  };
}
