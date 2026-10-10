import { formatRupiah } from "@/lib/format";
import { LABEL_METODE, type RingkasanBiaya } from "@/lib/bunga";
import { dec, Decimal, type MasukanUang } from "@/lib/uang";

/** Bentuk serializable (hanya teks) dari ringkasan biaya, supaya bisa dikirim ke komponen klien/Server Action. */
export type TampilanRingkasan = {
  pokok: string; bungaTahun: string; bungaEfektif: string; metode: string; tenorBulan: number;
  totalBunga: string; biayaAdmin: string; danaDiterima: string; totalBayar: string; totalBiaya: string;
  cicilan: string; denda: string;
};

export type AturanDenda = { dendaPersenPerHari: MasukanUang; masaTenggang: number; batasDendaPersen: MasukanUang };

const persenTeks = (nilai: MasukanUang) => dec(nilai).toString().replace(".", ",");

export function tampilanRingkasan(r: RingkasanBiaya, a: AturanDenda): TampilanRingkasan {
  const batasRupiah = formatRupiah(r.pokok.times(dec(a.batasDendaPersen)).div(100).toDecimalPlaces(2, Decimal.ROUND_DOWN));
  return {
    pokok: formatRupiah(r.pokok), bungaTahun: `${persenTeks(r.bungaTahun)}% per tahun`, bungaEfektif: `${persenTeks(r.bungaEfektifTahun)}% per tahun`,
    metode: LABEL_METODE[r.metode], tenorBulan: r.tenorBulan, totalBunga: formatRupiah(r.totalBunga), biayaAdmin: formatRupiah(r.biayaAdmin),
    danaDiterima: formatRupiah(r.danaDiterima), totalBayar: formatRupiah(r.totalBayar), totalBiaya: formatRupiah(r.totalBiaya),
    cicilan: r.cicilanPertama.eq(r.cicilanTerakhir) || r.metode !== "MENURUN" ? `${formatRupiah(r.cicilanPertama)} / bulan` : `${formatRupiah(r.cicilanPertama)} turun menjadi ${formatRupiah(r.cicilanTerakhir)} / bulan`,
    denda: `${persenTeks(a.dendaPersenPerHari)}% per hari dari angsuran yang terlambat, baru berlaku setelah masa tenggang ${a.masaTenggang} hari. Total denda dibatasi maksimal ${persenTeks(a.batasDendaPersen)}% dari pokok (${batasRupiah}).`,
  };
}
