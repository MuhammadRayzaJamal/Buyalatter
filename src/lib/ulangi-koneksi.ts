/** Kode galat Prisma yang menandakan koneksi database terputus atau habis waktu, bukan kesalahan pada query. */
const KODE_KONEKSI = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function galatKoneksi(error: unknown) {
  const kode = (error as { code?: unknown } | null)?.code;
  return typeof kode === "string" && KODE_KONEKSI.has(kode);
}

/**
 * Database serverless menutup koneksi yang menganggur, sehingga query pertama setelah jeda bisa gagal.
 * Query yang gagal karena koneksi terputus diulang sebentar; galat lain langsung dilempar.
 */
export async function ulangiBilaKoneksiPutus<T>(jalankan: () => Promise<T>, percobaan = 3, jedaMs = 300): Promise<T> {
  for (let ke = 1; ; ke++) {
    try {
      return await jalankan();
    } catch (error) {
      if (ke >= percobaan || !galatKoneksi(error)) throw error;
      await new Promise((r) => setTimeout(r, jedaMs * ke));
    }
  }
}
