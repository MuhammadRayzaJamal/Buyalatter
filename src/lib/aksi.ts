import { Prisma } from "@prisma/client";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

export type Hasil = { ok: boolean; pesan: string };

/** Kesalahan aturan bisnis yang aman ditampilkan apa adanya ke pengguna. */
export class GalatBisnis extends Error {}

export const SUDAH_DIPROSES = "Transaksi sudah diproses sebelumnya.";

/**
 * Membungkus isi Server Action: galat bisnis dan validasi menjadi pesan untuk pengguna, redirect/notFound (termasuk 404 otorisasi)
 * tetap diteruskan ke Next, galat lain dicatat di server dan hanya menampilkan pesan umum.
 */
export async function jalankan(fn: () => Promise<string | void>): Promise<Hasil> {
  try {
    const pesan = await fn();
    return { ok: true, pesan: pesan ?? "Berhasil disimpan." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof GalatBisnis) return { ok: false, pesan: error.message };
    if (error instanceof ZodError) return { ok: false, pesan: error.issues[0]?.message ?? "Data tidak valid." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, pesan: "Data tersebut sudah ada (nilai unik sudah dipakai)." };
    console.error("[aksi]", error);
    return { ok: false, pesan: "Terjadi kesalahan pada server. Coba lagi." };
  }
}

/** Untuk route handler JSON. */
export function jawabanGalat(error: unknown): { pesan: string; status: number } {
  if (error instanceof GalatBisnis) return { pesan: error.message, status: 409 };
  if (error instanceof ZodError) return { pesan: error.issues[0]?.message ?? "Data tidak valid.", status: 400 };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { pesan: "Data tersebut sudah ada (nilai unik sudah dipakai).", status: 409 };
  console.error("[api]", error);
  return { pesan: "Terjadi kesalahan pada server.", status: 500 };
}
