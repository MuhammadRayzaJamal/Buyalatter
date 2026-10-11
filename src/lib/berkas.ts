import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { KategoriBerkas } from "@prisma/client";
import { GalatBisnis } from "@/lib/aksi";
import { deteksiJenis, GIF, JPEG, PDF, PNG, WEBP, type Jenis } from "@/lib/berkas-jenis";
import { prisma } from "@/lib/prisma";

export const AKAR_PRIVAT = path.join(process.cwd(), "storage", "private");

const ATURAN: Record<KategoriBerkas, { boleh: Jenis[]; maks: number; label: string; pesanFormat: string }> = {
  KTP: { boleh: [JPEG, PNG, WEBP], maks: 5 * 1024 * 1024, label: "foto KTP", pesanFormat: "Foto KTP harus berformat JPG, PNG, atau WEBP." },
  SWAFOTO: { boleh: [JPEG, PNG, WEBP], maks: 5 * 1024 * 1024, label: "swafoto", pesanFormat: "Foto harus berformat JPG, PNG, atau WEBP." },
  BUKTI_TRANSFER: { boleh: [JPEG, PNG, PDF], maks: 2 * 1024 * 1024, label: "bukti transfer", pesanFormat: "Bukti harus berformat JPG, PNG, atau PDF." },
  BUKTI_BAYAR: { boleh: [JPEG, PNG, PDF], maks: 2 * 1024 * 1024, label: "bukti pembayaran", pesanFormat: "Bukti harus berformat JPG, PNG, atau PDF." },
  PENGADUAN: { boleh: [JPEG, PNG, PDF], maks: 2 * 1024 * 1024, label: "lampiran pengaduan", pesanFormat: "Lampiran harus berformat JPG, PNG, atau PDF." },
};

export const urlBerkas = (id: string) => `/api/file/${id}`;
export const idDariUrlBerkas = (url: string | null | undefined) => (url?.startsWith("/api/file/") ? url.slice("/api/file/".length) : null);

/**
 * Menyimpan berkas privat di tabel BerkasPrivat (bukan di public/) dengan nama UUID acak, memeriksa magic bytes dan ukuran,
 * lalu mencatat pemilik. Mengembalikan URL `/api/file/<id>`, yang hanya dilayani untuk pemilik dan staf berwenang.
 */
export async function simpanBerkasPrivat(file: File, kategori: KategoriBerkas, anggotaId: string, diunggahOlehId: string) {
  const aturan = ATURAN[kategori];
  if (file.size === 0) throw new GalatBisnis(`Berkas ${aturan.label} kosong.`);
  if (file.size > aturan.maks) throw new GalatBisnis(`Ukuran ${aturan.label} maksimal ${aturan.maks / 1024 / 1024}MB.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const jenis = deteksiJenis(buffer);
  if (!jenis || !aturan.boleh.some((j) => j.mime === jenis.mime)) throw new GalatBisnis(aturan.pesanFormat);

  const id = randomUUID();
  const namaFile = `${id}.${jenis.ext}`;
  await prisma.berkasPrivat.create({ data: { id, kategori, anggotaId, namaFile, mime: jenis.mime, ukuran: buffer.length, diunggahOlehId, isi: buffer } });
  return urlBerkas(id);
}

export async function bacaBerkasPrivat(berkas: { kategori: KategoriBerkas; namaFile: string; isi?: Uint8Array | null }) {
  if (berkas.isi) return Buffer.from(berkas.isi);
  try {
    return await readFile(path.join(AKAR_PRIVAT, berkas.kategori.toLowerCase(), path.basename(berkas.namaFile)));
  } catch {
    return null;
  }
}

/** Pembersihan best-effort bila transaksi utama gagal setelah berkas terlanjur tersimpan. */
export async function buangBerkasPrivat(url: string | null | undefined) {
  const id = idDariUrlBerkas(url);
  if (!id) return;
  const berkas = await prisma.berkasPrivat.findUnique({ where: { id } });
  if (!berkas) return;
  await prisma.berkasPrivat.delete({ where: { id } }).catch(() => undefined);
  await unlink(path.join(AKAR_PRIVAT, berkas.kategori.toLowerCase(), path.basename(berkas.namaFile))).catch(() => undefined);
}

// ---------- Gambar publik (galeri, berita, banner, dst.) ----------
const GAMBAR_PUBLIK = [JPEG, PNG, WEBP, GIF];
const MAKS_GAMBAR_PUBLIK = 5 * 1024 * 1024;

/** Gambar konten publik tetap di public/uploads, tetapi tipenya diperiksa lewat magic bytes. */
export async function simpanGambarPublik(file: File, folder: "galeri" | "berita" | "banner" | "testimoni" | "mitra") {
  if (file.size === 0) return null;
  if (file.size > MAKS_GAMBAR_PUBLIK) throw new GalatBisnis("Ukuran gambar maksimal 5MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const jenis = deteksiJenis(buffer);
  if (!jenis || !GAMBAR_PUBLIK.some((j) => j.mime === jenis.mime)) throw new GalatBisnis("Format gambar harus JPG, PNG, WEBP, atau GIF.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const namaFile = `${randomUUID()}.${jenis.ext}`;
  await writeFile(path.join(dir, namaFile), buffer);
  return `/uploads/${folder}/${namaFile}`;
}

/** Tipe MIME berkas privat dari URL `/api/file/<id>` (untuk memutuskan tampil sebagai gambar atau tautan PDF). */
export async function mimeBerkas(url: string | null | undefined) {
  const id = idDariUrlBerkas(url);
  if (!id) return null;
  const berkas = await prisma.berkasPrivat.findUnique({ where: { id }, select: { mime: true } });
  return berkas?.mime ?? null;
}

/** Hash SHA-256 isi berkas (hex) untuk mendeteksi bukti pembayaran yang diunggah ulang. */
export async function hashBerkas(file: File) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
}
