"use server";

import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { susunIsiAkad } from "@/lib/akad";
import { GalatBisnis, jalankan, SUDAH_DIPROSES } from "@/lib/aksi";
import { isAngsuranPayable } from "@/lib/angsuran";
import { ambilIp, catatAudit } from "@/lib/audit";
import { buangBerkasPrivat, hashBerkas, simpanBerkasPrivat } from "@/lib/berkas";
import { hariTerlambat } from "@/lib/denda";
import { kirimEmail } from "@/lib/email";
import { namaSama } from "@/lib/nama";
import { buatNotifikasi } from "@/lib/notifikasi";
import { requireAnggota } from "@/lib/otorisasi";
import { getBatas } from "@/lib/pengaturan";
import { hitungPelunasan } from "@/lib/pelunasan";
import { prisma } from "@/lib/prisma";
import { dec, kodeUnikAcak } from "@/lib/uang";
import { ajukanPembayaranSchema, akadSchema, dariForm, kycSchema, rekeningSchema, restrukturSchema, uangSchema } from "@/lib/validasi";

// Semua query di sini difilter dengan anggota.id milik user yang login (cegah IDOR); data milik anggota lain dianggap tidak ada.

type AnggotaLogin = Awaited<ReturnType<typeof requireAnggota>>;

async function pastikanPassword(anggota: AnggotaLogin, password: string) {
  if (!(await bcrypt.compare(password, anggota.user.password))) throw new GalatBisnis("Password salah. Perubahan tidak disimpan.");
}

/** Rekening tujuan pencairan dikunci selama ada pinjaman yang sudah disetujui tetapi belum dicairkan. */
async function pastikanRekeningTidakTerkunci(anggotaId: string) {
  const menunggu = await prisma.pinjaman.count({ where: { anggotaId, status: "DISETUJUI" } });
  if (menunggu > 0) throw new GalatBisnis("Rekening terkunci karena ada pinjaman yang sudah disetujui dan menunggu pencairan.");
}

function pastikanNamaPemilik(anggota: AnggotaLogin, atasNama: string) {
  if (!namaSama(anggota.user.nama, atasNama)) throw new GalatBisnis(`Nama pemilik rekening harus sama dengan nama Anda (${anggota.user.nama}). Gelar dan huruf besar/kecil diabaikan.`);
}

/** Notifikasi dalam aplikasi + email setiap perubahan rekening. Kegagalan email tidak membatalkan perubahan. */
async function beritahuPerubahanRekening(anggota: AnggotaLogin, aksi: string, rekening: { namaBank: string; noRekening: string }) {
  const ringkas = `${rekening.namaBank} ${rekening.noRekening.slice(0, 3)}${"*".repeat(Math.max(0, rekening.noRekening.length - 6))}${rekening.noRekening.slice(-3)}`;
  const pesan = `Rekening ${ringkas} ${aksi}. Jika ini bukan Anda, segera hubungi pengurus koperasi.`;
  const emailStatus = await kirimEmail(anggota.user.email, "Perubahan rekening bank — BuyaLater", `<p>Halo ${anggota.user.nama},</p><p>${pesan}</p><p>Email ini dikirim otomatis oleh sistem BuyaLater.</p>`);
  await buatNotifikasi({ userId: anggota.userId, tipe: "INFO", judul: "Rekening bank diperbarui", pesan, link: "/anggota/rekening", emailStatus });
}

// ---------- Rekening ----------
export async function createRekening(formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const { password, ...d } = rekeningSchema.parse(dariForm(formData));
    await pastikanPassword(anggota, password);
    pastikanNamaPemilik(anggota, d.atasNama);
    await pastikanRekeningTidakTerkunci(anggota.id);
    const baru = await prisma.$transaction(async (tx) => {
      const jumlah = await tx.rekeningAnggota.count({ where: { anggotaId: anggota.id } });
      const r = await tx.rekeningAnggota.create({ data: { anggotaId: anggota.id, ...d, isUtama: jumlah === 0 } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "RekeningAnggota", entitasId: r.id, dataBaru: r });
      return r;
    });
    await beritahuPerubahanRekening(anggota, "ditambahkan", baru);
    revalidatePath("/anggota/rekening");
    return "Rekening ditambahkan. Pemberitahuan dikirim ke email Anda.";
  });
}

export async function updateRekening(id: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const { password, ...d } = rekeningSchema.parse(dariForm(formData));
    await pastikanPassword(anggota, password);
    pastikanNamaPemilik(anggota, d.atasNama);
    await pastikanRekeningTidakTerkunci(anggota.id);
    await prisma.$transaction(async (tx) => {
      const lama = await tx.rekeningAnggota.findFirst({ where: { id, anggotaId: anggota.id } });
      if (!lama) throw new GalatBisnis("Rekening tidak ditemukan.");
      await tx.rekeningAnggota.update({ where: { id }, data: d });
      await catatAudit(tx, { userId: anggota.userId, aksi: "UPDATE", entitas: "RekeningAnggota", entitasId: id, dataLama: lama, dataBaru: d });
    });
    await beritahuPerubahanRekening(anggota, "diubah", d);
    revalidatePath("/anggota/rekening");
    return "Rekening diperbarui. Pemberitahuan dikirim ke email Anda.";
  });
}

export async function setRekeningUtama(id: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    await pastikanPassword(anggota, String(formData.get("password") ?? ""));
    await pastikanRekeningTidakTerkunci(anggota.id);
    const rekening = await prisma.$transaction(async (tx) => {
      const r = await tx.rekeningAnggota.findFirst({ where: { id, anggotaId: anggota.id } });
      if (!r) throw new GalatBisnis("Rekening tidak ditemukan.");
      await tx.rekeningAnggota.updateMany({ where: { anggotaId: anggota.id }, data: { isUtama: false } });
      await tx.rekeningAnggota.update({ where: { id }, data: { isUtama: true } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "UPDATE", entitas: "RekeningAnggota", entitasId: id, dataLama: { isUtama: r.isUtama }, dataBaru: { isUtama: true } });
      return r;
    });
    await beritahuPerubahanRekening(anggota, "dijadikan rekening utama", rekening);
    revalidatePath("/anggota/rekening");
    return "Rekening utama diganti. Pemberitahuan dikirim ke email Anda.";
  });
}

export async function deleteRekening(id: string) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    await pastikanRekeningTidakTerkunci(anggota.id);
    const hapus = await prisma.$transaction(async (tx) => {
      const rekening = await tx.rekeningAnggota.findFirst({ where: { id, anggotaId: anggota.id }, include: { pencairan: true } });
      if (!rekening) throw new GalatBisnis("Rekening tidak ditemukan.");
      if (rekening.pencairan.length > 0) throw new GalatBisnis("Rekening ini sudah dipakai untuk pencairan pinjaman dan tidak dapat dihapus.");
      await tx.rekeningAnggota.delete({ where: { id } });
      if (rekening.isUtama) {
        const next = await tx.rekeningAnggota.findFirst({ where: { anggotaId: anggota.id }, orderBy: { createdAt: "asc" } });
        if (next) await tx.rekeningAnggota.update({ where: { id: next.id }, data: { isUtama: true } });
      }
      const { pencairan: _pencairan, ...data } = rekening;
      void _pencairan;
      await catatAudit(tx, { userId: anggota.userId, aksi: "DELETE", entitas: "RekeningAnggota", entitasId: id, dataLama: data });
      return data;
    });
    await beritahuPerubahanRekening(anggota, "dihapus", hapus);
    revalidatePath("/anggota/rekening");
    return "Rekening dihapus.";
  });
}

// ---------- KYC ----------
export async function kirimKyc(formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const d = kycSchema.parse(dariForm(formData));
    const ktp = formData.get("fotoKtp"); const swafoto = formData.get("swafoto");
    if (!(ktp instanceof File) || ktp.size === 0) throw new GalatBisnis("Foto KTP wajib diunggah.");
    if (!(swafoto instanceof File) || swafoto.size === 0) throw new GalatBisnis("Swafoto sambil memegang KTP wajib diunggah.");
    const terbaru = await prisma.verifikasiAnggota.findFirst({ where: { anggotaId: anggota.id }, orderBy: { createdAt: "desc" } });
    if (terbaru?.status === "MENUNGGU") throw new GalatBisnis("Verifikasi Anda sedang ditinjau pengurus.");
    if (terbaru?.status === "DITERIMA") throw new GalatBisnis("Identitas Anda sudah terverifikasi.");

    let ktpUrl: string | null = null; let selfieUrl: string | null = null;
    try {
      ktpUrl = await simpanBerkasPrivat(ktp, "KTP", anggota.id, anggota.userId);
      selfieUrl = await simpanBerkasPrivat(swafoto, "SWAFOTO", anggota.id, anggota.userId);
      await prisma.$transaction(async (tx) => {
        const ada = await tx.verifikasiAnggota.count({ where: { anggotaId: anggota.id, status: "MENUNGGU" } });
        if (ada > 0) throw new GalatBisnis("Verifikasi Anda sedang ditinjau pengurus.");
        const baru = await tx.verifikasiAnggota.create({ data: { anggotaId: anggota.id, fotoKtpPath: ktpUrl!, swafotoKtpPath: selfieUrl!, penghasilanBulanan: d.penghasilanBulanan, pekerjaan: d.pekerjaan } });
        await tx.anggota.update({ where: { id: anggota.id }, data: { fotoKtp: ktpUrl, statusVerifikasi: "PENDING", catatanVerifikasi: null } });
        await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "VerifikasiAnggota", entitasId: baru.id, dataBaru: { status: "MENUNGGU", pekerjaan: d.pekerjaan, penghasilanBulanan: d.penghasilanBulanan } });
      });
    } catch (error) {
      await buangBerkasPrivat(ktpUrl); await buangBerkasPrivat(selfieUrl);
      throw error;
    }
    revalidatePath("/anggota/verifikasi"); revalidatePath("/admin/verifikasi-anggota");
    return "Dokumen terkirim dan menunggu verifikasi pengurus.";
  });
}

// ---------- Akad digital ----------
export async function setujuiAkad(pinjamanId: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const d = akadSchema.parse(dariForm(formData));
    await pastikanPassword(anggota, d.password);
    const batas = await getBatas();
    const ip = await ambilIp(); const ua = (await headers()).get("user-agent")?.slice(0, 190) ?? null;
    await prisma.$transaction(async (tx) => {
      const pinjaman = await tx.pinjaman.findFirst({ where: { id: pinjamanId, anggotaId: anggota.id }, include: { akad: true } });
      if (!pinjaman) throw new GalatBisnis("Pinjaman tidak ditemukan.");
      if (pinjaman.status !== "DISETUJUI") throw new GalatBisnis("Akad hanya dapat disetujui untuk pinjaman yang sudah disetujui manajer dan belum dicairkan.");
      if (pinjaman.akad) throw new GalatBisnis("Akad sudah disetujui sebelumnya.");
      const isiAkad = susunIsiAkad({ pinjamanId, anggota: { nama: anggota.user.nama, noAnggota: anggota.noAnggota, nik: anggota.nik, alamat: anggota.alamat }, jumlah: pinjaman.jumlah, bungaPersen: pinjaman.bungaPersen, tenorBulan: pinjaman.tenorBulan, totalBayar: pinjaman.totalBayar, tanggalPersetujuan: pinjaman.tanggalDisetujui ?? new Date(), dendaPersenPerHari: (await tx.pengaturan.findFirst())?.dendaPersenPerHari ?? "0.1", batasDendaPersen: batas.batasDendaPersen });
      const akad = await tx.akadPinjaman.create({ data: { pinjamanId, isiAkad, ipAddress: ip, userAgent: ua } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "AkadPinjaman", entitasId: akad.id, dataBaru: { pinjamanId, ipAddress: ip } });
    });
    revalidatePath(`/anggota/pinjaman/${pinjamanId}`); revalidatePath(`/anggota/pinjaman/${pinjamanId}/akad`); revalidatePath("/admin/pencairan"); revalidatePath(`/admin/pencairan/${pinjamanId}`);
    return "Akad disetujui. Pengurus dapat memproses pencairan dana Anda.";
  });
}

// ---------- Pembayaran angsuran ----------
const PESAN_BUKTI_GANDA = "Bukti pembayaran ini sudah pernah diunggah. Gunakan bukti transfer yang berbeda.";

async function bacaBukti(formData: FormData) {
  const bukti = formData.get("buktiBayar");
  if (!(bukti instanceof File) || bukti.size === 0) throw new GalatBisnis("Bukti pembayaran wajib diunggah.");
  const hash = await hashBerkas(bukti);
  if (await prisma.pembayaran.findUnique({ where: { hashBukti: hash }, select: { id: true } })) throw new GalatBisnis(PESAN_BUKTI_GANDA);
  return { bukti, hash };
}

const ubahDuplikat = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && String(error.meta?.target ?? "").includes("hashBukti")) return new GalatBisnis(PESAN_BUKTI_GANDA);
  return error;
};

export async function ajukanPembayaran(angsuranId: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const { rekeningKoperasiId, jumlahTransfer } = ajukanPembayaranSchema.parse(dariForm(formData));
    // Angsuran milik anggota lain diperlakukan seperti tidak ada.
    const awal = await prisma.angsuran.findFirst({ where: { id: angsuranId, pinjaman: { anggotaId: anggota.id } }, include: { pinjaman: true } });
    if (!awal) throw new GalatBisnis("Angsuran tidak ditemukan.");
    const rekening = await prisma.rekeningKoperasi.findUnique({ where: { id: rekeningKoperasiId } });
    if (!rekening || !rekening.isAktif) throw new GalatBisnis("Rekening tujuan tidak valid.");
    const { bukti, hash } = await bacaBukti(formData);
    const buktiBayarUrl = await simpanBerkasPrivat(bukti, "BUKTI_BAYAR", anggota.id, anggota.userId);

    try {
      await prisma.$transaction(async (tx) => {
        if (!(await isAngsuranPayable(awal.pinjamanId, awal.angsuranKe, tx))) throw new GalatBisnis(`Selesaikan angsuran sebelumnya (ke-${awal.angsuranKe - 1}) terlebih dahulu.`);
        // Atomik: hanya satu pengajuan yang bisa mengubah status dari BELUM/TERLAMBAT; klik ganda atau dua tab langsung ditolak.
        const hasil = await tx.angsuran.updateMany({ where: { id: angsuranId, status: { in: ["BELUM", "TERLAMBAT"] } }, data: { status: "MENUNGGU_VERIFIKASI" } });
        if (hasil.count === 0) throw new GalatBisnis(awal.status === "LUNAS" ? "Angsuran ini sudah lunas." : SUDAH_DIPROSES);
        const angsuran = await tx.angsuran.findUniqueOrThrow({ where: { id: angsuranId } });
        // Tagihan selalu dihitung dari database (sisa angsuran + denda + kode unik), bukan dari klien.
        const sisa = dec(angsuran.jumlah).plus(dec(angsuran.denda)).minus(dec(angsuran.terbayar));
        const pembayaran = await tx.pembayaran.create({ data: { angsuranId, anggotaId: anggota.id, rekeningKoperasiId, jumlahBayar: angsuran.jumlah, dendaDibayar: angsuran.denda, buktiBayarUrl, status: "MENUNGGU", kodeUnik: angsuran.kodeUnik, jumlahTagihan: sisa.plus(angsuran.kodeUnik), jumlahTransfer, hashBukti: hash } });
        await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "Pembayaran", entitasId: pembayaran.id, dataBaru: pembayaran });
      });
    } catch (error) {
      await buangBerkasPrivat(buktiBayarUrl);
      throw ubahDuplikat(error);
    }

    revalidatePath(`/anggota/bayar/${angsuranId}`); revalidatePath("/anggota/pembayaran"); revalidatePath(`/anggota/pinjaman/${awal.pinjamanId}`); revalidatePath("/anggota/riwayat");
    return "Bukti pembayaran terkirim dan menunggu verifikasi.";
  });
}

// ---------- Pelunasan dipercepat ----------
export async function ajukanPelunasan(pinjamanId: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const rekeningKoperasiId = String(formData.get("rekeningKoperasiId") ?? "");
    const jumlahTransfer = uangSchema("Jumlah transfer").parse(String(formData.get("jumlahTransfer") ?? ""));
    const rekening = await prisma.rekeningKoperasi.findUnique({ where: { id: rekeningKoperasiId } });
    if (!rekening || !rekening.isAktif) throw new GalatBisnis("Rekening tujuan tidak valid.");
    const awal = await prisma.pinjaman.findFirst({ where: { id: pinjamanId, anggotaId: anggota.id } });
    if (!awal) throw new GalatBisnis("Pinjaman tidak ditemukan.");
    const { bukti, hash } = await bacaBukti(formData);
    const buktiBayarUrl = await simpanBerkasPrivat(bukti, "BUKTI_BAYAR", anggota.id, anggota.userId);
    try {
      await prisma.$transaction(async (tx) => {
        const pinjaman = await tx.pinjaman.findFirst({ where: { id: pinjamanId, anggotaId: anggota.id }, include: { angsuran: { orderBy: { angsuranKe: "asc" } } } });
        if (!pinjaman || pinjaman.status !== "DICAIRKAN") throw new GalatBisnis("Pinjaman ini tidak dapat dilunasi.");
        if (pinjaman.angsuran.some((a) => a.status === "MENUNGGU_VERIFIKASI")) throw new GalatBisnis("Masih ada pembayaran yang menunggu verifikasi. Tunggu hingga selesai diproses.");
        const pelunasan = hitungPelunasan(pinjaman, pinjaman.angsuran);
        if (!pelunasan) throw new GalatBisnis("Seluruh angsuran sudah lunas.");
        const jangkar = pinjaman.angsuran.find((a) => a.status !== "LUNAS")!;
        const hasil = await tx.angsuran.updateMany({ where: { id: jangkar.id, status: { in: ["BELUM", "TERLAMBAT"] } }, data: { status: "MENUNGGU_VERIFIKASI" } });
        if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
        const kode = kodeUnikAcak();
        const pembayaran = await tx.pembayaran.create({ data: { angsuranId: jangkar.id, anggotaId: anggota.id, rekeningKoperasiId, jumlahBayar: pelunasan.total, dendaDibayar: 0, buktiBayarUrl, status: "MENUNGGU", kodeUnik: kode, jumlahTagihan: pelunasan.total.plus(kode), jumlahTransfer, hashBukti: hash, isPelunasan: true } });
        await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "Pembayaran", entitasId: pembayaran.id, dataBaru: { ...pembayaran, jenis: "pelunasan dipercepat" } });
      });
    } catch (error) {
      await buangBerkasPrivat(buktiBayarUrl);
      throw ubahDuplikat(error);
    }
    revalidatePath(`/anggota/pinjaman/${pinjamanId}`); revalidatePath("/anggota/pembayaran");
    return "Bukti pelunasan terkirim dan menunggu verifikasi.";
  });
}

// ---------- Restrukturisasi ----------
export async function ajukanRestrukturisasi(pinjamanId: string, formData: FormData) {
  return jalankan(async () => {
    const anggota = await requireAnggota();
    const d = restrukturSchema.parse(dariForm(formData));
    const batas = await getBatas();
    const sekarang = new Date();
    await prisma.$transaction(async (tx) => {
      const pinjaman = await tx.pinjaman.findFirst({ where: { id: pinjamanId, anggotaId: anggota.id }, include: { angsuran: true, restrukturisasi: { where: { status: "DIAJUKAN" } } } });
      if (!pinjaman || pinjaman.status !== "DICAIRKAN") throw new GalatBisnis("Pinjaman ini tidak dapat direstrukturisasi.");
      const tunggakan = pinjaman.angsuran.filter((a) => a.status !== "LUNAS").reduce((maks, a) => Math.max(maks, hariTerlambat(a.tanggalJatuhTempo, sekarang)), 0);
      if (tunggakan <= batas.maksHariTunggakan) throw new GalatBisnis(`Restrukturisasi hanya untuk tunggakan lebih dari ${batas.maksHariTunggakan} hari.`);
      if (pinjaman.restrukturisasi.length > 0) throw new GalatBisnis("Sudah ada pengajuan restrukturisasi yang menunggu keputusan.");
      if (d.tenorBaru <= pinjaman.tenorBulan) throw new GalatBisnis(`Tenor baru harus lebih dari tenor saat ini (${pinjaman.tenorBulan} bulan).`);
      if (d.tenorBaru > pinjaman.tenorBulan + 24 || d.tenorBaru > 60) throw new GalatBisnis("Perpanjangan tenor maksimal 24 bulan dan total tenor maksimal 60 bulan.");
      const baru = await tx.restrukturisasi.create({ data: { pinjamanId, tenorLama: pinjaman.tenorBulan, tenorBaru: d.tenorBaru, alasan: d.alasan } });
      await catatAudit(tx, { userId: anggota.userId, aksi: "CREATE", entitas: "Restrukturisasi", entitasId: baru.id, dataBaru: baru });
    });
    revalidatePath(`/anggota/pinjaman/${pinjamanId}`); revalidatePath(`/anggota/pinjaman/${pinjamanId}/restrukturisasi`); revalidatePath("/admin/restrukturisasi");
    return "Pengajuan restrukturisasi terkirim dan menunggu keputusan manajer.";
  });
}

export async function tandaiSemuaDibaca() {
  const anggota = await requireAnggota();
  await prisma.notifikasi.updateMany({ where: { userId: anggota.userId, sudahDibaca: false }, data: { sudahDibaca: true } });
  revalidatePath("/anggota", "layout");
}
