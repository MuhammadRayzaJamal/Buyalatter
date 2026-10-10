"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { batasiIp } from "@/lib/batas-laju";
import { catatAudit } from "@/lib/audit";
import { GalatBisnis, jalankan } from "@/lib/aksi";
import { kirimEmailResetPassword } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { dariForm, lupaPasswordSchema, resetPasswordSchema } from "@/lib/validasi";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const MAKS_PERMINTAAN_PER_JAM = 3;

/** Selalu menjawab sama (email terdaftar atau tidak) agar tidak bisa dipakai menebak akun. */
export async function mintaResetPassword(formData: FormData) {
  return jalankan(async () => {
    await batasiIp("lupa-password", 5, 60 * 60_000);
    const { email } = lupaPasswordSchema.parse(dariForm(formData));
    const user = await prisma.user.findUnique({ where: { email }, include: { anggota: { select: { deletedAt: true } } } });
    const aktif = user && !(user.role === "ANGGOTA" && (!user.anggota || user.anggota.deletedAt));
    if (user && aktif) {
      const satuJamLalu = new Date(Date.now() - 60 * 60_000);
      const terbaru = await prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gt: satuJamLalu } } });
      if (terbaru < MAKS_PERMINTAAN_PER_JAM) {
        const token = randomBytes(32).toString("base64url");
        await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) } });
        await kirimEmailResetPassword(user.email, user.nama, `${appUrl()}/reset-password/${token}`);
      }
    }
    return "Jika email terdaftar, tautan untuk mengatur ulang password sudah dikirim. Tautan berlaku 1 jam.";
  });
}

export async function resetPassword(formData: FormData) {
  return jalankan(async () => {
    const data = resetPasswordSchema.parse(dariForm(formData));
    const sekarang = new Date();
    const tokenHash = hashToken(data.token);
    const password = await bcrypt.hash(data.password, 10);
    await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt || token.expiresAt < sekarang) throw new GalatBisnis("Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.");
      // Satu kali pakai: hanya satu permintaan yang bisa menandai token terpakai.
      const dipakai = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null }, data: { usedAt: sekarang } });
      if (dipakai.count === 0) throw new GalatBisnis("Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.");
      const user = await tx.user.update({ where: { id: token.userId }, data: { password } });
      await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: sekarang } });
      // Reset password membuka kunci login: catat sebagai percobaan sukses agar hitungan gagal dimulai ulang.
      await tx.loginAttempt.create({ data: { email: user.email, berhasil: true, ipAddress: null } });
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "User", entitasId: user.id, dataBaru: { passwordDiatur: "reset lewat email" } });
    });
    return "Password berhasil diubah. Silakan masuk dengan password baru.";
  });
}
