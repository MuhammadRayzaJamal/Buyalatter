import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPengaturanTagihan } from "@/lib/pengaturan";
import { hariKenaDenda, hariTerlambat, hitungDenda } from "@/lib/denda";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { kirimEmail, templateEmailAngsuran } from "@/lib/email";
import { batasiDenda } from "@/lib/denda-batas";
import { buatNotifikasi } from "@/lib/notifikasi";
import { ambilLibur, catatLogPenagihan } from "@/lib/penagihan";
import { awalHariWib, cekJadwalPenagihan } from "@/lib/penagihan-aturan";
import { dec, type Decimal } from "@/lib/uang";

const angsuranInclude = { pinjaman: { include: { anggota: { include: { user: true } } } } } satisfies Prisma.AngsuranInclude;
type AngsuranLengkap = Prisma.AngsuranGetPayload<{ include: typeof angsuranInclude }>;

export type HasilCek = { pengingat: number; terlambat: number; email: number; dilewati: number; ditunda: string | null };

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Membuat notifikasi dalam aplikasi + email untuk satu angsuran, hanya ke anggota yang bersangkutan, dan mencatat bukti di LogPenagihan.
 * Pemanggil bertanggung jawab memeriksa jadwal (Senin–Sabtu 08.00–20.00 WIB, bukan hari libur) dan batas 1 pengingat per hari.
 */
export async function kirimPengingatAngsuran(angsuran: AngsuranLengkap, hari: number, denda: Decimal, dikirimOlehId: string | null = null) {
  const user = angsuran.pinjaman.anggota.user;
  const jumlah = dec(angsuran.jumlah);
  const terlambat = hari > 0;
  const link = `/anggota/bayar/${angsuran.id}`;
  const judul = terlambat ? `Angsuran ke-${angsuran.angsuranKe} terlambat ${hari} hari` : `Angsuran ke-${angsuran.angsuranKe} segera jatuh tempo`;
  const pesan = terlambat
    ? `Jatuh tempo ${formatTanggal(angsuran.tanggalJatuhTempo)}. ${denda.gt(0) ? `Denda saat ini ${formatRupiah(denda)}; total tagihan ${formatRupiah(jumlah.plus(denda))}.` : `Masih dalam masa tenggang, belum ada denda. Tagihan ${formatRupiah(jumlah)}.`} Jika ada kendala, silakan hubungi pengurus untuk dibicarakan secara kekeluargaan.`
    : `Jatuh tempo ${formatTanggal(angsuran.tanggalJatuhTempo)} sebesar ${formatRupiah(jumlah)}. Mohon siapkan pembayaran melalui portal anggota.`;
  const email = templateEmailAngsuran({ nama: user.nama, angsuranKe: angsuran.angsuranKe, jumlah, denda, jatuhTempo: angsuran.tanggalJatuhTempo, hariTerlambat: hari, link: `${appUrl()}${link}` });
  const emailStatus = await kirimEmail(user.email, email.subject, email.html);
  await buatNotifikasi({ userId: user.id, angsuranId: angsuran.id, judul, pesan, tipe: terlambat ? "TERLAMBAT" : "PENGINGAT", link, emailStatus });
  const anggotaId = angsuran.pinjaman.anggotaId;
  await catatLogPenagihan(prisma, { anggotaId, angsuranId: angsuran.id, saluran: "NOTIFIKASI", isiPesan: `${judul}. ${pesan}`, dikirimOlehId });
  if (emailStatus === "TERKIRIM") await catatLogPenagihan(prisma, { anggotaId, angsuranId: angsuran.id, saluran: "EMAIL", isiPesan: `${email.subject} — ${pesan}`, dikirimOlehId });
  return emailStatus;
}

/**
 * Pengecekan jatuh tempo: menandai angsuran terlambat + menghitung denda, lalu membuat
 * notifikasi (maks. 1 per angsuran per hari). Dipakai oleh cron harian dan tombol admin.
 */
export async function cekJatuhTempo(sekarang = new Date()): Promise<HasilCek> {
  const { dendaPersenPerHari, hariPengingat, masaTenggang } = await getPengaturanTagihan();
  const awalHariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const batasPengingat = new Date(awalHariIni); batasPengingat.setDate(batasPengingat.getDate() + hariPengingat + 1);
  const aktif = { pinjaman: { status: "DICAIRKAN" as const } };

  const [lewat, akanJatuhTempo, libur] = await Promise.all([
    prisma.angsuran.findMany({ where: { ...aktif, status: { in: ["BELUM", "TERLAMBAT"] }, tanggalJatuhTempo: { lt: sekarang } }, include: angsuranInclude, orderBy: { tanggalJatuhTempo: "asc" } }),
    prisma.angsuran.findMany({ where: { ...aktif, status: "BELUM", tanggalJatuhTempo: { gte: sekarang, lt: batasPengingat } }, include: angsuranInclude, orderBy: { tanggalJatuhTempo: "asc" } }),
    ambilLibur(),
  ]);

  const hasil: HasilCek = { pengingat: 0, terlambat: 0, email: 0, dilewati: 0, ditunda: null };
  const catat = (status: string) => { if (status === "TERKIRIM") hasil.email += 1; };

  // Status terlambat dan denda selalu diperbarui; ini perhitungan, bukan komunikasi ke anggota.
  const dendaPerAngsuran = new Map<string, Decimal>();
  for (const item of lewat) {
    const hari = hariTerlambat(item.tanggalJatuhTempo, sekarang);
    // Denda dihitung dari sisa angsuran yang terlambat (bukan total pinjaman), setelah masa tenggang, dan dipangkas batas total denda (maks. 10% pokok).
    const denda = await batasiDenda(prisma, item, hitungDenda(dec(item.jumlah).minus(dec(item.terbayar)), dendaPersenPerHari, hariKenaDenda(hari, masaTenggang)));
    await prisma.angsuran.update({ where: { id: item.id }, data: { status: "TERLAMBAT", denda } });
    dendaPerAngsuran.set(item.id, denda);
  }

  // Pengingat hanya boleh dikirim Senin–Sabtu 08.00–20.00 WIB di luar hari libur; di luar itu ditunda sampai jadwal berikutnya.
  const jadwal = cekJadwalPenagihan(sekarang, libur);
  if (!jadwal.boleh) { hasil.ditunda = jadwal.alasan; return hasil; }

  // Maksimal 1 pengingat per anggota per hari (semua saluran): ambil angsuran paling lama menunggak, sisanya dilewati.
  const sudah = await prisma.logPenagihan.findMany({ where: { waktuKirim: { gte: awalHariWib(sekarang) } }, select: { anggotaId: true }, distinct: ["anggotaId"] });
  const sudahDiingatkan = new Set(sudah.map((item) => item.anggotaId));
  for (const item of [...lewat, ...akanJatuhTempo]) {
    const anggotaId = item.pinjaman.anggotaId;
    if (sudahDiingatkan.has(anggotaId)) { hasil.dilewati += 1; continue; }
    sudahDiingatkan.add(anggotaId);
    if (item.tanggalJatuhTempo.getTime() < sekarang.getTime()) {
      catat(await kirimPengingatAngsuran(item, hariTerlambat(item.tanggalJatuhTempo, sekarang), dendaPerAngsuran.get(item.id) ?? dec(0)));
      hasil.terlambat += 1;
    } else {
      catat(await kirimPengingatAngsuran(item, 0, dec(0)));
      hasil.pengingat += 1;
    }
  }
  return hasil;
}
