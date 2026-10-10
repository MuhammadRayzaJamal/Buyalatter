import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { buangBerkasPrivat, simpanBerkasPrivat } from "@/lib/berkas";
import { batasiIp } from "@/lib/batas-laju";
import { emailTerkonfigurasi, esc, kirimEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { ambilIp } from "@/lib/audit";
import { PERSETUJUAN, VERSI_KEBIJAKAN } from "@/lib/kebijakan";
import { dariForm, registerPublikSchema } from "@/lib/validasi";

const PESAN_DAFTAR = "Permintaan pendaftaran diterima. Jika data Anda belum terdaftar, akun dibuat dan KTP Anda diverifikasi admin sebelum akun aktif sepenuhnya. Jika sudah pernah mendaftar, silakan masuk atau gunakan Lupa Password.";

export async function POST(request: Request) {
  const data = await request.formData();
  let fotoKtp: string | null = null;
  try {
    await batasiIp("register", 5, 60 * 60_000);
    const d = registerPublikSchema.parse(dariForm(data));
    const ip = await ambilIp();
    const fotoKtpFile = data.get("fotoKtp");
    if (!(fotoKtpFile instanceof File) || fotoKtpFile.size === 0) return NextResponse.json({ message: "Foto KTP wajib diunggah." }, { status: 400 });

    const [existingEmail, existingNik] = await Promise.all([
      prisma.user.findUnique({ where: { email: d.email } }),
      prisma.anggota.findFirst({ where: { nik: d.nik, OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } }),
    ]);
    // Jawaban sama untuk pendaftaran baru maupun email/NIK yang sudah ada, supaya halaman ini tidak bisa dipakai menebak siapa yang terdaftar.
    // Hash dihitung lebih dulu agar waktu respons tidak membedakan kedua kasus.
    const password = await bcrypt.hash(d.password, 10);
    if (existingEmail || existingNik) {
      if (existingEmail && emailTerkonfigurasi()) {
        await kirimEmail(d.email, "Percobaan pendaftaran di BuyaLater", `<p>Halo ${esc(existingEmail.nama)},</p><p>Ada permintaan pendaftaran baru memakai email ini, padahal Anda sudah terdaftar. Jika itu Anda, silakan <a href="${esc((process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""))}/login">masuk</a> atau gunakan Lupa Password. Jika bukan, abaikan email ini.</p>`);
      }
      return NextResponse.json({ message: PESAN_DAFTAR });
    }
    const anggota = await prisma.$transaction(async (tx) => {
      const jumlah = await tx.anggota.count({ where: { OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } });
      const user = await tx.user.create({
        data: { nama: d.nama, email: d.email, password, role: "ANGGOTA", anggota: { create: { noAnggota: `BL-${new Date().getFullYear()}-${String(jumlah + 1).padStart(3, "0")}`, nik: d.nik, alamat: d.alamat, noHp: d.noHp, tanggalMasuk: new Date(d.tanggalMasuk), statusVerifikasi: "PENDING" } } },
        include: { anggota: true },
      });
      // Persetujuan penggunaan data dicatat terpisah per tujuan beserta versi kebijakan, waktu, dan IP (UU PDP).
      await tx.persetujuanData.createMany({ data: PERSETUJUAN.map((p) => ({ userId: user.id, jenis: p.jenis, disetujui: d[p.field] === "on", versiKebijakan: VERSI_KEBIJAKAN, ipAddress: ip })) });
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
    return NextResponse.json({ message: PESAN_DAFTAR });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
