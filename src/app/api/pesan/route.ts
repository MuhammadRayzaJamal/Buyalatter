import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { prisma } from "@/lib/prisma";
import { pesanKontakSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  try {
    const data = pesanKontakSchema.parse(await request.json().catch(() => ({})));
    await prisma.pesan.create({ data });
    return NextResponse.json({ message: "Pesan berhasil dikirim. Kami akan segera menghubungi Anda." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
