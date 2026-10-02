import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buatPdfAkad } from "@/lib/akad";
import { prisma } from "@/lib/prisma";

/** Unduh akad sebagai PDF. Hanya pemilik pinjaman atau staf; selain itu 404. Akad yang diunduh adalah salinan yang disetujui anggota. */
export async function GET(_request: Request, { params }: { params: Promise<{ pinjamanId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  const { pinjamanId } = await params;
  const [user, pinjaman] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } }),
    prisma.pinjaman.findUnique({ where: { id: pinjamanId }, include: { akad: true, anggota: { select: { userId: true } } } }),
  ]);
  if (!user || !pinjaman?.akad) return NextResponse.json({ message: "Akad tidak ditemukan." }, { status: 404 });
  const pemilik = user.role === "ANGGOTA" && pinjaman.anggota.userId === user.id;
  if (!pemilik && user.role === "ANGGOTA") return NextResponse.json({ message: "Akad tidak ditemukan." }, { status: 404 });
  const pdf = await buatPdfAkad(pinjaman.akad.isiAkad, { disetujuiPada: pinjaman.akad.disetujuiPada, ipAddress: pinjaman.akad.ipAddress });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="akad-${pinjamanId}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
