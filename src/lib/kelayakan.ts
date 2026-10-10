import { hariTerlambat } from "@/lib/denda";
import { formatRupiah } from "@/lib/format";
import { kycTerbaru } from "@/lib/kyc";
import { hitungSaldo } from "@/lib/mutasi";
import { getBatas } from "@/lib/pengaturan";
import { prisma } from "@/lib/prisma";
import { hitungPinjaman } from "@/lib/bunga";
import { MAKS_TUNGGAKAN_WAJIB_BULAN, tunggakanWajibBulan } from "@/lib/wajib";
import { Decimal, dec, NOL, type MasukanUang } from "@/lib/uang";

export type Syarat = { kode: string; label: string; terpenuhi: boolean; detail: string };
export type HasilKelayakan = { layak: boolean; syarat: Syarat[]; plafon: Decimal; maksAngsuranPerBulan: Decimal | null; penghasilan: Decimal | null };

const HARI_MS = 24 * 60 * 60 * 1000;
function selisihBulan(dari: Date, ke: Date) {
  return (ke.getFullYear() - dari.getFullYear()) * 12 + (ke.getMonth() - dari.getMonth()) - (ke.getDate() < dari.getDate() ? 1 : 0);
}

/**
 * Memeriksa kelayakan anggota mengajukan pinjaman. Tanpa `permintaan`, hasilnya dipakai untuk checklist dan plafon;
 * dengan `permintaan` (jumlah + tenor), plafon dan rasio angsuran diperiksa terhadap nominal yang diajukan.
 * Semua angka batas berasal dari Pengaturan.
 */
export async function cekKelayakan(anggotaId: string, permintaan?: { jumlah: MasukanUang; tenorBulan: number }, sekarang = new Date()): Promise<HasilKelayakan> {
  const [batas, anggota, kyc, saldo, aktif, pokokDibayar, wajibBayar] = await Promise.all([
    getBatas(),
    prisma.anggota.findUnique({ where: { id: anggotaId } }),
    kycTerbaru(anggotaId),
    hitungSaldo(prisma, anggotaId),
    prisma.pinjaman.count({ where: { anggotaId, status: { in: ["DIAJUKAN", "DISETUJUI", "DICAIRKAN"] } } }),
    prisma.simpanan.aggregate({ where: { anggotaId, jenis: "POKOK" }, _sum: { jumlah: true } }),
    prisma.simpanan.findMany({ where: { anggotaId, jenis: "WAJIB" }, select: { tanggal: true } }),
  ]);
  if (!anggota) return { layak: false, syarat: [], plafon: NOL, maksAngsuranPerBulan: null, penghasilan: null };

  // Tunggakan > batas hari dalam periode terakhir: angsuran yang dibayar terlambat atau masih menunggak.
  const awalPeriode = new Date(sekarang); awalPeriode.setMonth(awalPeriode.getMonth() - batas.periodeTunggakanBulan);
  const angsuran = await prisma.angsuran.findMany({ where: { pinjaman: { anggotaId }, tanggalJatuhTempo: { gte: awalPeriode, lt: sekarang } }, select: { tanggalJatuhTempo: true, tanggalBayar: true, status: true } });
  const hariMaks = angsuran.reduce((maks, a) => {
    const hari = a.status === "LUNAS" && a.tanggalBayar ? Math.floor((a.tanggalBayar.getTime() - a.tanggalJatuhTempo.getTime()) / HARI_MS) : a.status === "LUNAS" ? 0 : hariTerlambat(a.tanggalJatuhTempo, sekarang);
    return Math.max(maks, hari);
  }, 0);

  const lama = selisihBulan(anggota.tanggalMasuk, sekarang);
  const kycDiterima = kyc?.status === "DITERIMA";
  const penghasilan = kycDiterima ? dec(kyc!.penghasilanBulanan) : null;
  const plafon = Decimal.min(saldo.times(batas.plafonKaliSimpanan), batas.maksPinjaman);
  const maksAngsuran = penghasilan ? penghasilan.times(batas.maksRasioAngsuranPersen).div(100).toDecimalPlaces(2, Decimal.ROUND_DOWN) : null;

  const wajib = tunggakanWajibBulan(anggota.tanggalMasuk, wajibBayar.map((w) => w.tanggal), sekarang);
  const pokokTerbayar = dec(pokokDibayar._sum.jumlah);
  // Biaya dan cicilan dihitung dengan bunga per tahun, metode, dan biaya admin dari Pengaturan (sama dengan ringkasan sebelum akad).
  const cicilanMaks = permintaan ? hitungPinjaman({ pokok: permintaan.jumlah, bungaTahun: batas.bungaPinjamanPerTahun, tenorBulan: permintaan.tenorBulan, metode: batas.metodeBunga, biayaAdminPersen: batas.biayaAdminPersen }).jadwal.reduce((m, j) => Decimal.max(m, j), NOL) : null;

  const syarat: Syarat[] = [
    { kode: "anggota", label: "Anggota aktif dan terverifikasi", terpenuhi: anggota.status === "AKTIF" && anggota.statusVerifikasi === "TERVERIFIKASI", detail: anggota.status !== "AKTIF" ? "Keanggotaan tidak aktif." : anggota.statusVerifikasi === "TERVERIFIKASI" ? "Keanggotaan Anda sudah diverifikasi pengurus." : anggota.statusVerifikasi === "DITOLAK" ? "Verifikasi keanggotaan ditolak; hubungi pengurus." : "Keanggotaan Anda masih menunggu verifikasi pengurus." },
    { kode: "pokok", label: "Simpanan pokok sudah dibayar", terpenuhi: pokokTerbayar.gte(batas.simpananPokok), detail: pokokTerbayar.gte(batas.simpananPokok) ? `Simpanan pokok ${formatRupiah(pokokTerbayar)} sudah tercatat.` : `Simpanan pokok yang diwajibkan ${formatRupiah(batas.simpananPokok)}, baru tercatat ${formatRupiah(pokokTerbayar)}.` },
    { kode: "wajib", label: `Simpanan wajib rutin (tidak menunggak lebih dari ${MAKS_TUNGGAKAN_WAJIB_BULAN} bulan)`, terpenuhi: wajib.tunggakan <= MAKS_TUNGGAKAN_WAJIB_BULAN, detail: wajib.tunggakan <= MAKS_TUNGGAKAN_WAJIB_BULAN ? (wajib.tunggakan === 0 ? "Simpanan wajib lancar." : `Tunggakan simpanan wajib ${wajib.tunggakan} bulan (masih dalam batas).`) : `Simpanan wajib menunggak ${wajib.tunggakan} bulan. Lunasi melalui teller sebelum mengajukan pinjaman.` },
    { kode: "kyc", label: "Identitas (KYC) terverifikasi", terpenuhi: kycDiterima, detail: kycDiterima ? "Verifikasi identitas diterima." : kyc?.status === "MENUNGGU" ? "Verifikasi sedang ditinjau pengurus." : kyc?.status === "DITOLAK" ? `Verifikasi ditolak${kyc.alasanTolak ? `: ${kyc.alasanTolak}` : "."}` : "Belum mengajukan verifikasi identitas." },
    { kode: "lama", label: `Anggota minimal ${batas.minLamaAnggotaBulan} bulan`, terpenuhi: lama >= batas.minLamaAnggotaBulan, detail: `Lama keanggotaan ${Math.max(0, lama)} bulan.` },
    { kode: "aktif", label: "Tidak ada pinjaman aktif lain", terpenuhi: aktif === 0, detail: aktif === 0 ? "Tidak ada pinjaman yang sedang berjalan." : `Ada ${aktif} pinjaman yang belum selesai.` },
    { kode: "plafon", label: `Plafon maksimal ${batas.plafonKaliSimpanan.toString()}× saldo simpanan`, terpenuhi: permintaan ? dec(permintaan.jumlah).lte(plafon) : plafon.gte(batas.minPinjaman), detail: `Saldo simpanan ${formatRupiah(saldo)} → plafon ${formatRupiah(plafon)}${permintaan && dec(permintaan.jumlah).gt(plafon) ? `; pengajuan ${formatRupiah(permintaan.jumlah)} melebihi plafon.` : "."}` },
    { kode: "rasio", label: `Angsuran maksimal ${batas.maksRasioAngsuranPersen.toString()}% penghasilan`, terpenuhi: !maksAngsuran ? false : cicilanMaks ? cicilanMaks.lte(maksAngsuran) : maksAngsuran.gt(0), detail: !maksAngsuran ? "Penghasilan belum diverifikasi." : cicilanMaks ? `Cicilan ${formatRupiah(cicilanMaks)}/bulan, batas ${formatRupiah(maksAngsuran)}.` : `Angsuran maksimal ${formatRupiah(maksAngsuran)}/bulan.` },
    { kode: "tunggakan", label: `Tidak menunggak > ${batas.maksHariTunggakan} hari dalam ${batas.periodeTunggakanBulan} bulan terakhir`, terpenuhi: hariMaks <= batas.maksHariTunggakan, detail: hariMaks > batas.maksHariTunggakan ? `Pernah menunggak ${hariMaks} hari.` : "Riwayat pembayaran baik." },
  ];
  return { layak: syarat.every((s) => s.terpenuhi), syarat, plafon, maksAngsuranPerBulan: maksAngsuran, penghasilan };
}
