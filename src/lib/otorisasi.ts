import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Peran } from "@/lib/akses";

export { AKSES, STAF } from "@/lib/akses";
export type { Peran } from "@/lib/akses";

/**
 * Dipanggil di awal SETIAP halaman dan Server Action. Peran dibaca ulang dari database (bukan hanya dari token sesi)
 * agar perubahan peran langsung berlaku. Belum login → /login; peran tidak sesuai → 404 (bukan 403) supaya
 * keberadaan halaman tidak terbongkar.
 */
/** Sesi yang diterbitkan sebelum password direset dianggap tidak sah, sehingga token curian ikut mati saat password diganti. */
function sesiMasihSah(terbit: number | undefined, sandiDiubahPada: Date | null) {
  return !sandiDiubahPada || (terbit !== undefined && terbit >= sandiDiubahPada.getTime());
}

export async function requireRole(...peran: readonly Peran[]) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, nama: true, email: true, role: true, sandiDiubahPada: true } });
  if (user && !sesiMasihSah(session.user.terbit, user.sandiDiubahPada)) redirect("/login");
  if (!user || !peran.includes(user.role)) notFound();
  return user;
}

/** Anggota yang sedang login. Semua query di area anggota wajib memfilter dengan `anggota.id` ini (cegah IDOR). */
export async function requireAnggota() {
  const user = await requireRole("ANGGOTA");
  const anggota = await prisma.anggota.findFirst({ where: { userId: user.id }, include: { user: true } });
  if (!anggota) notFound();
  return anggota;
}

/** Versi untuk route handler: mengembalikan null (bukan redirect) bila tidak berhak. */
export async function cobaRole(...peran: readonly Peran[]) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, nama: true, email: true, role: true, sandiDiubahPada: true } });
  return user && sesiMasihSah(session.user.terbit, user.sandiDiubahPada) && peran.includes(user.role) ? user : null;
}

export async function cobaAnggota() {
  const user = await cobaRole("ANGGOTA");
  if (!user) return null;
  const anggota = await prisma.anggota.findFirst({ where: { userId: user.id }, include: { user: true } });
  return anggota;
}
