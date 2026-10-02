import { formatRupiah, formatTanggal } from "@/lib/format";
import { bulat2, dec, type Decimal, type MasukanUang } from "@/lib/uang";

const HARI_MS = 24 * 60 * 60 * 1000;

const awalHari = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Jumlah hari kalender terlambat; minimal 1 selama jatuh tempo sudah lewat. */
export function hariTerlambat(jatuhTempo: Date, sekarang = new Date()) {
  if (jatuhTempo.getTime() >= sekarang.getTime()) return 0;
  return Math.max(1, Math.round((awalHari(sekarang).getTime() - awalHari(jatuhTempo).getTime()) / HARI_MS));
}

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

export function pesanWhatsApp(data: DataPengingat) {
  const baris = [
    `Halo ${data.nama}, ini pengingat dari Koperasi BuyaLater.`,
    `Angsuran ke-${data.angsuranKe} sebesar ${formatRupiah(data.jumlah)} jatuh tempo pada ${formatTanggal(data.jatuhTempo)}.`,
  ];
  if (dec(data.denda).gt(0)) baris.push(`Denda keterlambatan saat ini: ${formatRupiah(data.denda)} (total ${formatRupiah(dec(data.jumlah).plus(dec(data.denda)))}).`);
  baris.push("Mohon segera lakukan pembayaran melalui portal anggota. Terima kasih.");
  return baris.join("\n");
}

export function linkWhatsApp(noHp: string, data: DataPengingat) {
  return `https://wa.me/${normalisasiNoHp(noHp)}?text=${encodeURIComponent(pesanWhatsApp(data))}`;
}
