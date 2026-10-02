import { NextResponse } from "next/server";
import { GalatBisnis, jawabanGalat } from "@/lib/aksi";
import { catatAudit } from "@/lib/audit";
import { kunciAnggota } from "@/lib/mutasi";
import { cobaAnggota } from "@/lib/otorisasi";
import { getBatas } from "@/lib/pengaturan";
import { prisma } from "@/lib/prisma";
import { NOL, dec } from "@/lib/uang";
import { buatPenarikanSchema } from "@/lib/validasi";
import { formatRupiah } from "@/lib/format";

export async function POST(request: Request) {
  const anggota = await cobaAnggota();
  if (!anggota) return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const batas = await getBatas();
    const { jumlah } = buatPenarikanSchema(batas).parse({ jumlah: String(body.jumlah ?? "") });
    await prisma.$transaction(async (tx) => {
      // Kunci anggota agar dua permintaan bersamaan tidak sama-sama lolos cek saldo.
      await kunciAnggota(tx, anggota.id);
      const [setoran, diajukan] = await Promise.all([
        tx.simpanan.aggregate({ where: { anggotaId: anggota.id, jenis: "SUKARELA" }, _sum: { jumlah: true } }),
        tx.penarikan.aggregate({ where: { anggotaId: anggota.id, status: { not: "DITOLAK" } }, _sum: { jumlah: true } }),
      ]);
      const saldo = dec(setoran._sum.jumlah ?? NOL).minus(dec(diajukan._sum.jumlah ?? NOL));
      if (jumlah.gt(saldo)) throw new GalatBisnis(`Jumlah melebihi saldo sukarela (${formatRupiah(saldo)}).`);
      const baru = await tx.penarikan.create({ data: { anggotaId: anggota.id, jumlah } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "Penarikan", entitasId: baru.id, dataBaru: baru });
    });
    return NextResponse.json({ message: "Pengajuan penarikan berhasil dikirim." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
