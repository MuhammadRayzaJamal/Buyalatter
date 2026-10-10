import type { SaluranPenagihan } from "@prisma/client";
import { GalatBisnis } from "@/lib/aksi";
import { awalHariWib, cariKataTerlarang, cekJadwalPenagihan, PESAN_JADWAL } from "@/lib/penagihan-aturan";
import { prisma, type Tx } from "@/lib/prisma";

type Klien = Tx | typeof prisma;

/** Kumpulan tanggal libur (format YYYY-MM-DD) yang dikelola admin. */
export async function ambilLibur(klien: Klien = prisma) {
  const baris = await klien.hariLibur.findMany({ select: { tanggal: true } });
  return new Set(baris.map((b) => b.tanggal.toISOString().slice(0, 10)));
}

export async function jadwalSekarang(sekarang = new Date()) {
  return cekJadwalPenagihan(sekarang, await ambilLibur());
}

/** Maks. 1 pengingat per hari per anggota dari semua saluran digabung. */
export async function sudahDiingatkanHariIni(anggotaId: string, sekarang = new Date(), klien: Klien = prisma) {
  return (await klien.logPenagihan.count({ where: { anggotaId, waktuKirim: { gte: awalHariWib(sekarang) } } })) > 0;
}

/** Dipakai sebelum mengirim pengingat/penagihan dengan saluran apa pun; melempar GalatBisnis bila melanggar aturan. */
export async function pastikanBolehMengingatkan(anggotaId: string, sekarang = new Date()) {
  const jadwal = await jadwalSekarang(sekarang);
  if (!jadwal.boleh) throw new GalatBisnis(`${PESAN_JADWAL}. (${jadwal.alasan})`);
  if (await sudahDiingatkanHariIni(anggotaId, sekarang)) throw new GalatBisnis("Anggota ini sudah menerima pengingat hari ini. Maksimal 1 pengingat per hari dari semua saluran.");
}

/** Menolak teks yang memuat kata terlarang (dipakai pada penyimpanan template). */
export function pastikanSopan(teks: string) {
  const kata = cariKataTerlarang(teks);
  if (kata) throw new GalatBisnis(`Template memuat kata yang tidak diperbolehkan: "${kata}". Gunakan bahasa yang sopan dan informatif.`);
}

/** Bukti penagihan: satu baris per saluran yang dipakai. */
export async function catatLogPenagihan(klien: Klien, d: { anggotaId: string; angsuranId?: string | null; saluran: SaluranPenagihan; isiPesan: string; dikirimOlehId?: string | null; waktuKirim?: Date }) {
  return klien.logPenagihan.create({ data: { anggotaId: d.anggotaId, angsuranId: d.angsuranId ?? null, saluran: d.saluran, isiPesan: d.isiPesan, dikirimOlehId: d.dikirimOlehId ?? null, ...(d.waktuKirim ? { waktuKirim: d.waktuKirim } : {}) } });
}
