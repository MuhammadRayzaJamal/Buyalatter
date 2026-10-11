import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Gambar konten publik (galeri, berita, banner, dst.). Terbuka untuk umum; hanya gambar yang diunggah admin untuk situs. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
  const gambar = await prisma.gambarPublik.findUnique({ where: { id } });
  if (!gambar) return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
  return new NextResponse(new Uint8Array(gambar.isi), {
    headers: {
      "Content-Type": gambar.mime,
      "Content-Length": String(gambar.ukuran),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
