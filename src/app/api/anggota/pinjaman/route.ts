import { NextResponse } from "next/server";
import { GalatBisnis, jawabanGalat } from "@/lib/aksi";
import { catatAudit } from "@/lib/audit";
import { cekKelayakan } from "@/lib/kelayakan";
import { kunciAnggota } from "@/lib/mutasi";
import { cobaAnggota } from "@/lib/otorisasi";
import { getBatas } from "@/lib/pengaturan";
import { prisma } from "@/lib/prisma";
import { hitungPinjaman } from "@/lib/bunga";
import { buatPinjamanSchema } from "@/lib/validasi";

export async function POST(request: Request) {
  const anggota = await cobaAnggota();
  if (!anggota) return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const batas = await getBatas();
    const d = buatPinjamanSchema(batas).parse({ jumlah: String(body.jumlah ?? ""), tenorBulan: String(body.tenorBulan ?? ""), alasan: String(body.alasan ?? "") });
    if (anggota.status !== "AKTIF") throw new GalatBisnis("Akun anggota tidak aktif.");
    // Aturan kelayakan (KYC, lama anggota, pinjaman aktif, plafon, rasio angsuran, tunggakan) diperiksa ulang di server dengan nominal yang diajukan.
    const kelayakan = await cekKelayakan(anggota.id, { jumlah: d.jumlah, tenorBulan: d.tenorBulan });
    const gagal = kelayakan.syarat.find((x) => !x.terpenuhi);
    if (gagal) throw new GalatBisnis(`Belum memenuhi syarat: ${gagal.label}. ${gagal.detail}`);
    await prisma.$transaction(async (tx) => {
      // Kunci anggota lalu hitung ulang pinjaman aktif agar dua pengajuan serentak tidak sama-sama lolos.
      await kunciAnggota(tx, anggota.id);
      if ((await tx.pinjaman.count({ where: { anggotaId: anggota.id, status: { in: ["DIAJUKAN", "DISETUJUI", "DICAIRKAN"] } } })) > 0) throw new GalatBisnis("Anda masih memiliki pinjaman yang belum selesai.");
      const rekeningUtama = await tx.rekeningAnggota.findFirst({ where: { anggotaId: anggota.id, isUtama: true } });
      if (!rekeningUtama) throw new GalatBisnis("Tambahkan rekening bank utama terlebih dahulu sebelum mengajukan pinjaman.");
      // Bunga dan total selalu dihitung server dengan Decimal dari Pengaturan, tidak pernah dari klien.
      const r = hitungPinjaman({ pokok: d.jumlah, bungaTahun: batas.bungaPinjamanPerTahun, tenorBulan: d.tenorBulan, metode: batas.metodeBunga, biayaAdminPersen: batas.biayaAdminPersen });
      const baru = await tx.pinjaman.create({ data: { anggotaId: anggota.id, jumlah: d.jumlah, tenorBulan: d.tenorBulan, bungaPersen: batas.bungaPinjamanPerTahun, metodeBunga: batas.metodeBunga, biayaAdmin: r.biayaAdmin, totalBayar: r.totalBayar, alasan: d.alasan, dibuatOlehId: anggota.userId } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "Pinjaman", entitasId: baru.id, dataBaru: baru });
    });
    return NextResponse.json({ message: "Pengajuan pinjaman berhasil dikirim." });
  } catch (error) {
    const { pesan, status } = jawabanGalat(error);
    return NextResponse.json({ message: pesan }, { status });
  }
}
