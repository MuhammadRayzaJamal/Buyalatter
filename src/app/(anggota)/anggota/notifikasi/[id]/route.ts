import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Menandai satu notifikasi sudah dibaca lalu mengarahkan ke tautan tujuannya. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url));
  const notif = await prisma.notifikasi.findFirst({ where: { id, userId: session.user.id } });
  if (!notif) return NextResponse.redirect(new URL("/anggota/notifikasi", request.url));
  if (!notif.sudahDibaca) await prisma.notifikasi.update({ where: { id }, data: { sudahDibaca: true } });
  const tujuan = notif.link?.startsWith("/") && !notif.link.startsWith("//") ? notif.link : "/anggota/notifikasi";
  return NextResponse.redirect(new URL(tujuan, request.url));
}
