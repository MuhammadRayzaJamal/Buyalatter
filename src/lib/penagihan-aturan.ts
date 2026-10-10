import { formatRupiah, formatTanggal } from "@/lib/format";

/** Aturan penagihan beretika (prinsip POJK 22/2023 Pasal 62). Modul murni: tanpa akses database, aman dipakai di mana saja. */
export const PESAN_JADWAL = "Penagihan hanya boleh Senin–Sabtu 08.00–20.00 di luar hari libur";
export const JAM_MULAI = 8;
export const JAM_SELESAI = 20;

/** Kata yang tidak boleh ada di template pesan penagihan (ancaman, mempermalukan, dsb.). */
export const KATA_TERLARANG = ["ancam", "polisi", "sebar", "nyebar", "malu", "viral", "penjara", "teror", "hajar", "bunuh", "preman", "bongkar", "aib", "bodoh", "penipu", "maling", "sita paksa", "debt collector", "kontak darurat", "kantor anda", "keluarga anda"] as const;

const AWALAN = "(?:me(?:ng|ny|n|m)?|di|ter|pe(?:ng|ny|n|m)?|ber)?";
const AKHIRAN = "(?:an|kan|i|nya)?";
const POLA = new RegExp(`(?<![a-z])${AWALAN}(?:${KATA_TERLARANG.map((k) => k.replace(/ /g, "\\s+")).join("|")})${AKHIRAN}(?![a-z])`, "i");

/** Mengembalikan kata terlarang pertama yang ditemukan, atau null bila teks aman. */
export function cariKataTerlarang(teks: string): string | null {
  const cocok = POLA.exec(teks.normalize("NFKC"));
  return cocok ? cocok[0].trim() : null;
}

export const DAFTAR_PLACEHOLDER = ["{nama}", "{angsuranKe}", "{jumlah}", "{jatuhTempo}", "{rincianDenda}"] as const;
export const TEMPLATE_BAWAAN = "Halo {nama}, ini pengingat ramah dari Koperasi BuyaLater.\nAngsuran ke-{angsuranKe} sebesar {jumlah} jatuh tempo pada {jatuhTempo}.{rincianDenda}\nMohon lakukan pembayaran melalui portal anggota. Jika ada kendala, silakan hubungi pengurus untuk dibicarakan secara kekeluargaan. Terima kasih.";

type DataPesan = { nama: string; angsuranKe: number; jumlah: { toString(): string } | number | string; denda: { toString(): string } | number | string; jatuhTempo: Date };

/** Mengisi placeholder template dengan data angsuran. Tidak ada data selain milik anggota yang bersangkutan. */
export function isiTemplate(template: string | null | undefined, d: DataPesan) {
  const denda = Number(d.denda.toString()) > 0 ? ` Denda keterlambatan saat ini ${formatRupiah(d.denda)}.` : "";
  return (template?.trim() || TEMPLATE_BAWAAN)
    .replaceAll("{nama}", d.nama).replaceAll("{angsuranKe}", String(d.angsuranKe)).replaceAll("{jumlah}", formatRupiah(d.jumlah))
    .replaceAll("{jatuhTempo}", formatTanggal(d.jatuhTempo)).replaceAll("{rincianDenda}", denda);
}

// ---------- Waktu WIB ----------
const HARI = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatWib = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" });

/** Bagian-bagian waktu menurut WIB (UTC+7), terlepas dari zona waktu server. */
export function bagianWib(waktu: Date) {
  const p = Object.fromEntries(formatWib.formatToParts(waktu).map((x) => [x.type, x.value]));
  return { kunci: `${p.year}-${p.month}-${p.day}`, jam: Number(p.hour), menit: Number(p.minute), hariKe: HARI.indexOf(String(p.weekday)) };
}

/** Awal hari ini (00.00 WIB) sebagai Date. */
export const awalHariWib = (waktu: Date) => new Date(`${bagianWib(waktu).kunci}T00:00:00+07:00`);

/** Boleh menagih hanya Senin–Sabtu pukul 08.00–19.59 WIB dan bukan hari libur nasional. */
export function cekJadwalPenagihan(waktu: Date, libur: ReadonlySet<string>) {
  const w = bagianWib(waktu);
  if (w.hariKe === 0) return { boleh: false, alasan: "Hari Minggu." };
  if (libur.has(w.kunci)) return { boleh: false, alasan: "Hari libur nasional." };
  if (w.jam < JAM_MULAI || w.jam >= JAM_SELESAI) return { boleh: false, alasan: "Di luar pukul 08.00–20.00 WIB." };
  return { boleh: true, alasan: null };
}

/** Tenggat tanggapan pengaduan: N hari kerja (Senin–Jumat, bukan hari libur) setelah tiket dibuat. */
export function tambahHariKerja(awal: Date, jumlah: number, libur: ReadonlySet<string>) {
  const hasil = new Date(awal); let sisa = jumlah;
  while (sisa > 0) {
    hasil.setUTCDate(hasil.getUTCDate() + 1);
    const w = bagianWib(hasil);
    if (w.hariKe !== 0 && w.hariKe !== 6 && !libur.has(w.kunci)) sisa -= 1;
  }
  return hasil;
}
