import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { buangBerkasPrivat, simpanBerkasPrivat } from "@/lib/berkas";
import { cobaAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { dariForm, profilSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  const anggota = await cobaAnggota();
  if (!anggota) return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  const data = await request.formData();

  let foto: string | undefined;
  try {
    const d = profilSchema.parse(dariForm(data));
    const fotoFile = data.get("fotoProfil");
    if (fotoFile instanceof File && fotoFile.size > 0) foto = await simpanBerkasPrivat(fotoFile, "SWAFOTO", anggota.id, anggota.userId);
    await prisma.user.update({
      where: { id: anggota.userId },
      data: { nama: d.nama, email: d.email, anggota: { update: { noHp: d.noHp, alamat: d.alamat, ...(foto ? { foto } : {}) } } },
    });
  } catch (error) {
    await buangBerkasPrivat(foto);
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
  return NextResponse.json({ message: "Profil berhasil diperbarui." });
}
