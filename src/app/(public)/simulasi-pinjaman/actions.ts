"use server";

import { ringkasanBiaya, type HasilRingkasan } from "@/lib/ringkasan-server";

/** Simulasi publik memakai perhitungan yang sama persis dengan pengajuan dan akad (bunga per tahun, metode, biaya admin dari Pengaturan). */
export async function hitungSimulasi(jumlah: string, tenor: string): Promise<HasilRingkasan> {
  return ringkasanBiaya(String(jumlah).slice(0, 15), String(tenor).slice(0, 3));
}
