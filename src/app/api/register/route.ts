import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { buangBerkasPrivat, simpanBerkasPrivat } from "@/lib/berkas";
import { prisma } from "@/lib/prisma";
import { dariForm, registerSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  const data = await request.formData();
  let fotoKtp: string | null = null;
  try {
    const d = registerSchema.parse(dariForm(data));
    const fotoKtpFile = data.get("fotoKtp");
    if (!(fotoKtpFile instanceof File) || fotoKtpFile.size === 0) return NextResponse.json({ message: "Foto KTP wajib diunggah." }, { status: 400 });

    const [existingEmail, existingNik] = await Promise.all([
      prisma.user.findUnique({ where: { email: d.email } }),
      prisma.anggota.findFirst({ where: { nik: d.nik, OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } }),
    ]);
    if (existingEmail) return NextResponse.json({ message: "Email tersebut sudah terdaftar." }, { status: 409 });
    if (existingNik) return NextResponse.json({ message: "NIK tersebut sudah terdaftar." }, { status: 409 });

    const password = await bcrypt.hash(d.password, 10);
    const anggota = await prisma.$transaction(async (tx) => {
      const jumlah = await tx.anggota.count({ where: { OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } });
      const user = await tx.user.create({
        data: { nama: d.nama, email: d.email, password, role: "ANGGOTA", anggota: { create: { noAnggota: `BL-${new Date().getFullYear()}-${String(jumlah + 1).padStart(3, "0")}`, nik: d.nik, alamat: d.alamat, noHp: d.noHp, tanggalMasuk: new Date(d.tanggalMasuk), statusVerifikasi: "PENDING" } } },
        include: { anggota: true },
      });
      return user.anggota!;
    });
    // Berkas KTP disimpan setelah anggota ada agar kepemilikannya tercatat; bila gagal, pendaftaran dibatalkan.
    try {
      fotoKtp = await simpanBerkasPrivat(fotoKtpFile, "KTP", anggota.id, anggota.userId);
      await prisma.anggota.update({ where: { id: anggota.id }, data: { fotoKtp } });
    } catch (error) {
      await buangBerkasPrivat(fotoKtp);
      await prisma.user.delete({ where: { id: anggota.userId } });
      throw error;
    }
    return NextResponse.json({ message: "Pendaftaran berhasil. Data KTP Anda sedang diverifikasi admin sebelum akun aktif sepenuhnya." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
