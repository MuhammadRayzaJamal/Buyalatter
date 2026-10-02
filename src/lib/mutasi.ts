import type { ArahMutasi, JenisMutasi } from "@prisma/client";
import { GalatBisnis } from "@/lib/aksi";
import type { Tx } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { dec, NOL, type Decimal, type MasukanUang } from "@/lib/uang";

/** Jenis mutasi yang mengubah saldo simpanan anggota. Pencairan/angsuran/denda dicatat di buku tetapi tidak menggeser saldo simpanan. */
export const JENIS_MENGUBAH_SALDO: JenisMutasi[] = ["SIMPANAN", "PENARIKAN", "KOREKSI"];

type Klien = Tx | typeof prisma;

/** Kunci baris anggota sampai transaksi selesai agar dua transaksi uang untuk anggota yang sama berjalan berurutan. */
export async function kunciAnggota(tx: Tx, anggotaId: string) {
  await tx.$queryRaw`SELECT id FROM Anggota WHERE id = ${anggotaId} FOR UPDATE`;
}

/** Saldo simpanan = Σ mutasi MASUK − Σ mutasi KELUAR untuk jenis yang mengubah saldo. Dihitung dari buku mutasi, bukan disimpan terpisah. */
export async function hitungSaldo(tx: Klien, anggotaId: string): Promise<Decimal> {
  const baris = await tx.mutasi.groupBy({ by: ["arah"], where: { anggotaId, jenis: { in: JENIS_MENGUBAH_SALDO } }, _sum: { jumlah: true } });
  const masuk = baris.find((b) => b.arah === "MASUK")?._sum.jumlah ?? NOL;
  const keluar = baris.find((b) => b.arah === "KELUAR")?._sum.jumlah ?? NOL;
  return dec(masuk).minus(dec(keluar));
}

/**
 * Menambah satu baris buku mutasi di dalam transaksi `tx`. Anggota dikunci lebih dulu sehingga saldoSetelah konsisten.
 * Baris mutasi tidak pernah diedit atau dihapus; koreksi dilakukan dengan baris jenis KOREKSI.
 */
export async function catatMutasi(
  tx: Tx,
  masukan: { anggotaId: string; jenis: JenisMutasi; arah: ArahMutasi; jumlah: MasukanUang; referensiId?: string | null; keterangan?: string | null; createdAt?: Date },
) {
  const jumlah = dec(masukan.jumlah);
  if (jumlah.lte(0)) throw new GalatBisnis("Jumlah mutasi harus lebih dari nol.");
  await kunciAnggota(tx, masukan.anggotaId);
  const saldoSebelum = await hitungSaldo(tx, masukan.anggotaId);
  const mengubah = JENIS_MENGUBAH_SALDO.includes(masukan.jenis);
  const saldoSetelah = mengubah ? (masukan.arah === "MASUK" ? saldoSebelum.plus(jumlah) : saldoSebelum.minus(jumlah)) : saldoSebelum;
  if (saldoSetelah.lt(0)) throw new GalatBisnis("Saldo simpanan tidak mencukupi.");
  return tx.mutasi.create({
    data: {
      anggotaId: masukan.anggotaId,
      jenis: masukan.jenis,
      arah: masukan.arah,
      jumlah,
      saldoSetelah,
      referensiId: masukan.referensiId ?? null,
      keterangan: masukan.keterangan ?? null,
      ...(masukan.createdAt ? { createdAt: masukan.createdAt } : {}),
    },
  });
}
