import { headers } from "next/headers";
import type { Tx } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";

export type EntitasAudit = "Pinjaman" | "Pencairan" | "Pembayaran" | "Simpanan" | "Penarikan" | "RekeningAnggota" | "Pengaturan" | "Angsuran" | "Anggota" | "User" | "Mutasi" | "VerifikasiAnggota" | "AkadPinjaman" | "Restrukturisasi" | "PeriodeShu" | "HariLibur" | "Pengaduan" | "PersetujuanData";

/** Alamat IP klien dari header proxy; null bila dipanggil di luar konteks permintaan (seed, cron). */
export async function ambilIp() {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

/** Menjadikan nilai (Decimal, Date, dst.) aman untuk kolom JSON. */
const keJson = (nilai: unknown) => (nilai === undefined || nilai === null ? undefined : (JSON.parse(JSON.stringify(nilai)) as object));

/**
 * Mencatat satu baris audit. Panggil di dalam transaksi yang sama dengan perubahan datanya supaya keduanya
 * berhasil atau gagal bersama. Tabel AuditLog hanya bisa ditambah, tidak bisa diubah atau dihapus.
 */
export async function catatAudit(
  tx: Tx | typeof prisma,
  masukan: { userId: string | null; aksi: "CREATE" | "UPDATE" | "DELETE"; entitas: EntitasAudit; entitasId: string; dataLama?: unknown; dataBaru?: unknown },
) {
  await tx.auditLog.create({
    data: {
      userId: masukan.userId,
      aksi: masukan.aksi,
      entitas: masukan.entitas,
      entitasId: masukan.entitasId,
      dataLama: keJson(masukan.dataLama),
      dataBaru: keJson(masukan.dataBaru),
      ipAddress: await ambilIp(),
    },
  });
}
