import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";

/** Semua perhitungan uang memakai Decimal (decimal.js) agar tidak terkena galat pecahan biner Number. */
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
export type MasukanUang = Prisma.Decimal | string | number;

export const NOL = new Decimal(0);

export const dec = (nilai: MasukanUang | null | undefined) => new Decimal(nilai ?? 0);

/** Pembulatan ke sen (2 desimal), setengah ke atas. */
export const bulat2 = (nilai: Prisma.Decimal) => nilai.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function jumlahDiGaris(nilai: MasukanUang | null | undefined, awal: Decimal | null = null) {
  return dec(nilai).plus(awal ?? NOL);
}

/** Total = pokok + pokok × bunga%/bulan × tenor. */
export function hitungTotalBayar(jumlah: MasukanUang, bungaPersenPerBulan: MasukanUang, tenorBulan: number) {
  const pokok = dec(jumlah);
  return bulat2(pokok.plus(pokok.times(dec(bungaPersenPerBulan)).div(100).times(tenorBulan)));
}

/**
 * Jadwal angsuran: tiap angsuran dibulatkan ke bawah ke sen, sisa pembulatan ditaruh di angsuran terakhir
 * sehingga jumlah semua angsuran persis sama dengan totalBayar.
 */
export function jadwalAngsuran(totalBayar: MasukanUang, tenorBulan: number): Decimal[] {
  const total = dec(totalBayar);
  const dasar = total.div(tenorBulan).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  const hasil = Array.from({ length: tenorBulan }, () => dasar);
  hasil[tenorBulan - 1] = total.minus(dasar.times(tenorBulan - 1));
  return hasil;
}

/** Uang masukan form: hanya digit dengan maksimal 2 desimal (titik). Menghasilkan null jika tidak valid. */
export function parseUang(teks: string | null | undefined): Decimal | null {
  const bersih = String(teks ?? "").trim();
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(bersih)) return null;
  return new Decimal(bersih);
}

/** Untuk `.reduce(tambah("jumlah"), NOL)`: menjumlahkan satu kolom uang dari daftar baris dengan Decimal. */
export const tambah = <K extends string>(kunci: K) => (total: Decimal, baris: Record<K, MasukanUang>) => total.plus(dec(baris[kunci]));

/** Kode unik 3 digit (100–999) yang ditambahkan ke nominal transfer untuk membantu pencocokan pembayaran. */
export const kodeUnikAcak = () => randomInt(100, 1000);
