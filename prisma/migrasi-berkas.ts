/**
 * Tahap 11A: memindahkan berkas sensitif lama (public/uploads/{pembayaran,pencairan,profil} dan storage/ktp)
 * ke storage/private dengan nama UUID, mencatatnya di BerkasPrivat, dan menulis ulang URL di database menjadi /api/file/<id>.
 * Aman dijalankan berulang kali. Jalankan: npx tsx prisma/migrasi-berkas.ts
 */
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, type KategoriBerkas } from "@prisma/client";
import { deteksiJenis } from "../src/lib/berkas-jenis";

const prisma = new PrismaClient();
const akar = process.cwd();
const privat = path.join(akar, "storage", "private");
const ada = (p: string) => access(p).then(() => true, () => false);

async function pindahkan(sumber: string, kategori: KategoriBerkas, anggotaId: string, userId: string) {
  if (!(await ada(sumber))) return null;
  const isi = await readFile(sumber);
  const jenis = deteksiJenis(isi);
  if (!jenis) return null;
  const id = randomUUID();
  const namaFile = `${id}.${jenis.ext}`;
  await mkdir(path.join(privat, kategori.toLowerCase()), { recursive: true });
  await writeFile(path.join(privat, kategori.toLowerCase(), namaFile), isi);
  await prisma.berkasPrivat.create({ data: { id, kategori, anggotaId, namaFile, mime: jenis.mime, ukuran: isi.length, diunggahOlehId: userId } });
  await unlink(sumber).catch(() => undefined);
  return `/api/file/${id}`;
}

async function main() {
  let dipindah = 0, dikosongkan = 0;
  const semuaAnggota = await prisma.anggota.findMany({ select: { id: true, userId: true, foto: true, fotoKtp: true } });
  for (const a of semuaAnggota) {
    if (a.fotoKtp && !a.fotoKtp.startsWith("/api/file/")) {
      const url = await pindahkan(path.join(akar, "storage", "ktp", path.basename(a.fotoKtp)), "KTP", a.id, a.userId);
      await prisma.anggota.update({ where: { id: a.id }, data: { fotoKtp: url } });
      if (url) dipindah++; else dikosongkan++;
    }
    if (a.foto && a.foto.startsWith("/uploads/")) {
      const url = await pindahkan(path.join(akar, "public", a.foto), "SWAFOTO", a.id, a.userId);
      await prisma.anggota.update({ where: { id: a.id }, data: { foto: url } });
      if (url) dipindah++; else dikosongkan++;
    }
  }
  for (const p of await prisma.pembayaran.findMany({ select: { id: true, anggotaId: true, buktiBayarUrl: true, anggota: { select: { userId: true } } } })) {
    if (p.buktiBayarUrl.startsWith("/uploads/")) {
      const url = await pindahkan(path.join(akar, "public", p.buktiBayarUrl), "BUKTI_BAYAR", p.anggotaId, p.anggota.userId);
      await prisma.pembayaran.update({ where: { id: p.id }, data: { buktiBayarUrl: url ?? "/api/file/hilang" } });
      if (url) dipindah++; else dikosongkan++;
    }
  }
  for (const c of await prisma.pencairan.findMany({ select: { id: true, buktiTransferUrl: true, diprosesOlehId: true, pinjaman: { select: { anggotaId: true } } } })) {
    if (c.buktiTransferUrl?.startsWith("/uploads/")) {
      const url = await pindahkan(path.join(akar, "public", c.buktiTransferUrl), "BUKTI_TRANSFER", c.pinjaman.anggotaId, c.diprosesOlehId);
      await prisma.pencairan.update({ where: { id: c.id }, data: { buktiTransferUrl: url } });
      if (url) dipindah++; else dikosongkan++;
    }
  }
  console.log(`Berkas dipindahkan: ${dipindah}; referensi tanpa berkas dikosongkan: ${dikosongkan}`);
}

main().finally(() => prisma.$disconnect());
