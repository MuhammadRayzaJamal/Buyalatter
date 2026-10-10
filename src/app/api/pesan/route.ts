import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { batasiIp } from "@/lib/batas-laju";
import { prisma } from "@/lib/prisma";
import { pesanKontakSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  try {
    await batasiIp("pesan", 5, 10 * 60_000);
    const data = pesanKontakSchema.parse(await request.json().catch(() => ({})));
    await prisma.pesan.create({ data });
    return NextResponse.json({ message: "Pesan berhasil dikirim. Kami akan segera menghubungi Anda." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
