import { isiTemplate } from "@/lib/penagihan-aturan";
import { bulat2, dec, type Decimal, type MasukanUang } from "@/lib/uang";

const HARI_MS = 24 * 60 * 60 * 1000;

const awalHari = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Jumlah hari kalender terlambat; minimal 1 selama jatuh tempo sudah lewat. */
export function hariTerlambat(jatuhTempo: Date, sekarang = new Date()) {
  if (jatuhTempo.getTime() >= sekarang.getTime()) return 0;
  return Math.max(1, Math.round((awalHari(sekarang).getTime() - awalHari(jatuhTempo).getTime()) / HARI_MS));
}

/** Hari yang dikenai denda = hari terlambat dikurangi masa tenggang (tanpa denda selama masa tenggang). */
export const hariKenaDenda = (hari: number, masaTenggang: number) => Math.max(0, hari - masaTenggang);

/** denda = jumlah angsuran × persen per hari × hari terlambat, dalam Decimal. `persenPerHari` dalam persen (0.1 = 0,1%). */
export function hitungDenda(jumlahAngsuran: MasukanUang, persenPerHari: MasukanUang, hari: number): Decimal {
  return bulat2(dec(jumlahAngsuran).times(dec(persenPerHari)).div(100).times(hari));
}

export function levelTunggakan(hari: number, batasKritis: number) {
  if (hari > batasKritis) return "kritis" as const;
  if (hari > 7) return "tinggi" as const;
  return "ringan" as const;
}

export function normalisasiNoHp(noHp: string) {
  const digit = noHp.replace(/\D/g, "");
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  if (digit.startsWith("62")) return digit;
  return `62${digit}`;
}

type DataPengingat = { nama: string; angsuranKe: number; jumlah: MasukanUang; denda: MasukanUang; jatuhTempo: Date };

export function pesanWhatsApp(data: DataPengingat, template?: string | null) {
  return isiTemplate(template, data);
}

export function linkWhatsApp(noHp: string, data: DataPengingat, template?: string | null) {
  return `https://wa.me/${normalisasiNoHp(noHp)}?text=${encodeURIComponent(pesanWhatsApp(data, template))}`;
}
