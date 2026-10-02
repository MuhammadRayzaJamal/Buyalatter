import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPengaturanTagihan } from "@/lib/pengaturan";
import { hariTerlambat, hitungDenda } from "@/lib/denda";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { kirimEmail, templateEmailAngsuran } from "@/lib/email";
import { batasiDenda } from "@/lib/denda-batas";
import { buatNotifikasi } from "@/lib/notifikasi";
import { dec, type Decimal } from "@/lib/uang";

const angsuranInclude = { pinjaman: { include: { anggota: { include: { user: true } } } } } satisfies Prisma.AngsuranInclude;
type AngsuranLengkap = Prisma.AngsuranGetPayload<{ include: typeof angsuranInclude }>;

export type HasilCek = { pengingat: number; terlambat: number; email: number; dilewati: number };

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Membuat notifikasi dalam aplikasi + email untuk satu angsuran. */
export async function kirimPengingatAngsuran(angsuran: AngsuranLengkap, hari: number, denda: Decimal) {
  const user = angsuran.pinjaman.anggota.user;
  const jumlah = dec(angsuran.jumlah);
  const terlambat = hari > 0;
  const link = `/anggota/bayar/${angsuran.id}`;
  const judul = terlambat ? `Angsuran ke-${angsuran.angsuranKe} terlambat ${hari} hari` : `Angsuran ke-${angsuran.angsuranKe} segera jatuh tempo`;
  const pesan = terlambat
    ? `Jatuh tempo ${formatTanggal(angsuran.tanggalJatuhTempo)}. Denda saat ini ${formatRupiah(denda)}; total tagihan ${formatRupiah(jumlah.plus(denda))}.`
    : `Jatuh tempo ${formatTanggal(angsuran.tanggalJatuhTempo)} sebesar ${formatRupiah(jumlah)}. Segera lakukan pembayaran.`;
  const email = templateEmailAngsuran({ nama: user.nama, angsuranKe: angsuran.angsuranKe, jumlah, denda, jatuhTempo: angsuran.tanggalJatuhTempo, hariTerlambat: hari, link: `${appUrl()}${link}` });
  const emailStatus = await kirimEmail(user.email, email.subject, email.html);
  await buatNotifikasi({ userId: user.id, angsuranId: angsuran.id, judul, pesan, tipe: terlambat ? "TERLAMBAT" : "PENGINGAT", link, emailStatus });
  return emailStatus;
}

/**
 * Pengecekan jatuh tempo: menandai angsuran terlambat + menghitung denda, lalu membuat
 * notifikasi (maks. 1 per angsuran per hari). Dipakai oleh cron harian dan tombol admin.
 */
export async function cekJatuhTempo(sekarang = new Date()): Promise<HasilCek> {
  const { dendaPersenPerHari, hariPengingat } = await getPengaturanTagihan();
  const awalHariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const batasPengingat = new Date(awalHariIni); batasPengingat.setDate(batasPengingat.getDate() + hariPengingat + 1);
  const aktif = { pinjaman: { status: "DICAIRKAN" as const } };

  const [lewat, akanJatuhTempo] = await Promise.all([
    prisma.angsuran.findMany({ where: { ...aktif, status: { in: ["BELUM", "TERLAMBAT"] }, tanggalJatuhTempo: { lt: sekarang } }, include: angsuranInclude }),
    prisma.angsuran.findMany({ where: { ...aktif, status: "BELUM", tanggalJatuhTempo: { gte: sekarang, lt: batasPengingat } }, include: angsuranInclude }),
  ]);

  const ids = [...lewat, ...akanJatuhTempo].map((item) => item.id);
  const sudah = ids.length ? await prisma.notifikasi.findMany({ where: { angsuranId: { in: ids }, tipe: { in: ["PENGINGAT", "TERLAMBAT"] }, createdAt: { gte: awalHariIni } }, select: { angsuranId: true } }) : [];
  const sudahHariIni = new Set(sudah.map((item) => item.angsuranId));

  const hasil: HasilCek = { pengingat: 0, terlambat: 0, email: 0, dilewati: 0 };
  const catat = (status: string) => { if (status === "TERKIRIM") hasil.email += 1; };

  for (const item of lewat) {
    const hari = hariTerlambat(item.tanggalJatuhTempo, sekarang);
    // Denda dihitung dari sisa tagihan dan dipangkas oleh batas total denda per pinjaman (default 10% pokok).
    const denda = await batasiDenda(prisma, item, hitungDenda(dec(item.jumlah).minus(dec(item.terbayar)), dendaPersenPerHari, hari));
    await prisma.angsuran.update({ where: { id: item.id }, data: { status: "TERLAMBAT", denda } });
    if (sudahHariIni.has(item.id)) { hasil.dilewati += 1; continue; }
    catat(await kirimPengingatAngsuran(item, hari, denda));
    hasil.terlambat += 1;
  }
  for (const item of akanJatuhTempo) {
    if (sudahHariIni.has(item.id)) { hasil.dilewati += 1; continue; }
    catat(await kirimPengingatAngsuran(item, 0, dec(0)));
    hasil.pengingat += 1;
  }
  return hasil;
}
