import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { catatAudit } from "@/lib/audit";
import { buangBerkasPrivat, simpanBerkasPrivat } from "@/lib/berkas";
import { cobaAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const anggota = await cobaAnggota();
  if (!anggota) return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });

  const data = await request.formData();
  const fotoKtpFile = data.get("fotoKtp");
  if (!(fotoKtpFile instanceof File) || fotoKtpFile.size === 0) return NextResponse.json({ message: "Foto KTP wajib diunggah." }, { status: 400 });

  let fotoKtp: string | null = null;
  try {
    fotoKtp = await simpanBerkasPrivat(fotoKtpFile, "KTP", anggota.id, anggota.userId);
    await prisma.$transaction(async (tx) => {
      await tx.anggota.update({ where: { id: anggota.id }, data: { fotoKtp, statusVerifikasi: "PENDING", catatanVerifikasi: null, diverifikasiPada: null } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "UPDATE", entitas: "Anggota", entitasId: anggota.id, dataLama: { statusVerifikasi: anggota.statusVerifikasi }, dataBaru: { statusVerifikasi: "PENDING", fotoKtp: "diganti" } });
    });
  } catch (error) {
    await buangBerkasPrivat(fotoKtp);
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }

  return NextResponse.json({ message: "Foto KTP baru berhasil dikirim. Menunggu verifikasi admin." });
}
