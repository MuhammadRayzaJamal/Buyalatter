import { GalatBisnis } from "@/lib/aksi";
import { ambilIp } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** Galat batas laju; route handler menjawabnya dengan status 429. */
export class GalatBatasLaju extends GalatBisnis {}

type Jendela = { waktu: number[] };
const jendela = new Map<string, Jendela>();

/**
 * Jendela geser di memori: maksimal `maks` permintaan per `jendelaMs` untuk satu kunci.
 * Hitungannya per proses server; dipakai sebagai cadangan bila database tidak terjangkau (lihat batasiIp untuk versi database).
 */
export function periksaBatas(kunci: string, maks: number, jendelaMs: number, sekarang = Date.now()) {
  const j = jendela.get(kunci) ?? { waktu: [] };
  j.waktu = j.waktu.filter((t) => sekarang - t < jendelaMs);
  if (j.waktu.length >= maks) {
    jendela.set(kunci, j);
    return { boleh: false, tungguDetik: Math.max(1, Math.ceil((j.waktu[0] + jendelaMs - sekarang) / 1000)) };
  }
  j.waktu.push(sekarang);
  jendela.set(kunci, j);
  // Bersihkan kunci lama sesekali supaya Map tidak membengkak.
  if (jendela.size > 5000) for (const [k, v] of jendela) if (v.waktu.every((t) => sekarang - t >= jendelaMs)) jendela.delete(k);
  return { boleh: true, tungguDetik: 0 };
}

/** Jumlah catatan untuk kunci tertentu dalam jendela waktu (database, berlaku lintas instance). */
export async function hitungKunci(kunci: string, jendelaMs: number) {
  return prisma.batasLaju.count({ where: { kunci, createdAt: { gte: new Date(Date.now() - jendelaMs) } } });
}

export async function catatKunci(kunci: string) {
  await prisma.batasLaju.create({ data: { kunci } });
  // Pembersihan sesekali agar tabel tidak membengkak.
  if (Math.random() < 0.02) await prisma.batasLaju.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } });
}

/**
 * Membatasi per alamat IP lewat database sehingga berlaku di semua instance serverless; melempar GalatBatasLaju bila terlampaui.
 * Bila database tidak terjangkau, jatuh kembali ke pembatas di memori agar permintaan sah tidak ikut gagal.
 */
export async function batasiIp(nama: string, maks: number, jendelaMs: number) {
  const ip = (await ambilIp()) ?? "tidak-diketahui";
  const kunci = `${nama}:${ip}`;
  let hasil: { boleh: boolean; tungguDetik: number };
  try {
    const terpakai = await hitungKunci(kunci, jendelaMs);
    if (terpakai >= maks) {
      const tertua = await prisma.batasLaju.findFirst({ where: { kunci, createdAt: { gte: new Date(Date.now() - jendelaMs) } }, orderBy: { createdAt: "asc" } });
      const tunggu = tertua ? Math.ceil((tertua.createdAt.getTime() + jendelaMs - Date.now()) / 1000) : Math.ceil(jendelaMs / 1000);
      hasil = { boleh: false, tungguDetik: Math.max(1, tunggu) };
    } else {
      await catatKunci(kunci);
      hasil = { boleh: true, tungguDetik: 0 };
    }
  } catch {
    hasil = periksaBatas(kunci, maks, jendelaMs);
  }
  if (!hasil.boleh) {
    const menit = Math.ceil(hasil.tungguDetik / 60);
    throw new GalatBatasLaju(`Terlalu banyak permintaan. Coba lagi dalam ${menit <= 1 ? "1 menit" : `${menit} menit`}.`);
  }
}
