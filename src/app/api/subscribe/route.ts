import { NextResponse } from "next/server";
import { jawabanGalat } from "@/lib/aksi";
import { prisma } from "@/lib/prisma";
import { lupaPasswordSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  try {
    // Skema yang sama dengan validasi email di form lain (trim, huruf kecil, format, panjang).
    const { email } = lupaPasswordSchema.parse(await request.json().catch(() => ({})));
    // upsert: email yang sudah terdaftar tidak dianggap error dan tidak membocorkan daftar pelanggan.
    await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
    return NextResponse.json({ message: "Terima kasih! Email Anda sudah terdaftar untuk kabar terbaru BuyaLater." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: status === 400 ? "Masukkan alamat email yang valid." : pesan }, { status });
  }
}
