import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { bacaBerkasPrivat } from "@/lib/berkas";
import { prisma } from "@/lib/prisma";
import type { Peran } from "@/lib/akses";

/** Staf yang boleh melihat tiap kategori berkas (selain pemiliknya). KTP dan swafoto lebih sempit karena memuat data pribadi. */
const STAF_PER_KATEGORI: Record<string, Peran[]> = {
  KTP: ["ADMIN", "MANAJER"],
  SWAFOTO: ["ADMIN", "MANAJER"],
  BUKTI_TRANSFER: ["ADMIN", "MANAJER", "TELLER"],
  BUKTI_BAYAR: ["ADMIN", "MANAJER", "TELLER"],
  PENGADUAN: ["ADMIN", "MANAJER"],
};

const tidakDitemukan = () => NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });

/** Satu-satunya jalan ke berkas privat: wajib login, dan hanya pemilik berkas atau staf berwenang yang dilayani. Selain itu 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return tidakDitemukan();

  const [user, berkas] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } }),
    prisma.berkasPrivat.findUnique({ where: { id }, include: { anggota: { select: { userId: true } } } }),
  ]);
  if (!user || !berkas) return tidakDitemukan();

  const pemilik = user.role === "ANGGOTA" && berkas.anggota.userId === user.id;
  const staf = (STAF_PER_KATEGORI[berkas.kategori] ?? []).includes(user.role);
  if (!pemilik && !staf) return tidakDitemukan();

  const isi = await bacaBerkasPrivat(berkas);
  if (!isi) return tidakDitemukan();

  return new NextResponse(new Uint8Array(isi), {
    headers: {
      "Content-Type": berkas.mime,
      "Content-Length": String(isi.length),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
