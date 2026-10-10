import { GalatBisnis } from "@/lib/aksi";
import { ambilIp } from "@/lib/audit";

/** Galat batas laju; route handler menjawabnya dengan status 429. */
export class GalatBatasLaju extends GalatBisnis {}

type Jendela = { waktu: number[] };
const jendela = new Map<string, Jendela>();

/**
 * Jendela geser di memori: maksimal `maks` permintaan per `jendelaMs` untuk satu kunci.
 * Catatan: hitungannya per proses server. Untuk beberapa instance/serverless, pindahkan ke Redis atau tabel database.
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

/** Membatasi per alamat IP; melempar GalatBatasLaju bila terlampaui. */
export async function batasiIp(nama: string, maks: number, jendelaMs: number) {
  const ip = (await ambilIp()) ?? "tidak-diketahui";
  const hasil = periksaBatas(`${nama}:${ip}`, maks, jendelaMs);
  if (!hasil.boleh) {
    const menit = Math.ceil(hasil.tungguDetik / 60);
    throw new GalatBatasLaju(`Terlalu banyak permintaan. Coba lagi dalam ${menit <= 1 ? "1 menit" : `${menit} menit`}.`);
  }
}
