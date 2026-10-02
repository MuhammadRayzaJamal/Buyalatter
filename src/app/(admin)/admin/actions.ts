"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma, type Tx } from "@/lib/prisma";
import { GalatBisnis, jalankan, SUDAH_DIPROSES } from "@/lib/aksi";
import { isAngsuranPayable, markPinjamanLunasIfComplete } from "@/lib/angsuran";
import { catatAudit } from "@/lib/audit";
import { buangBerkasPrivat, simpanBerkasPrivat, simpanGambarPublik } from "@/lib/berkas";
import { cekJatuhTempo, kirimPengingatAngsuran } from "@/lib/cekJatuhTempo";
import { hariTerlambat, hitungDenda } from "@/lib/denda";
import { formatRupiah } from "@/lib/format";
import { alokasiPembayaran, hitungPelunasan } from "@/lib/pelunasan";
import { batasiDenda, sisaKuotaDenda } from "@/lib/denda-batas";
import { ambilDasarShu, hitungPembagianShu } from "@/lib/shu";
import { catatMutasi, hitungSaldo, kunciAnggota } from "@/lib/mutasi";
import { buatNotifikasi, userIdDariAnggota } from "@/lib/notifikasi";
import { getBatas, getPengaturanTagihan } from "@/lib/pengaturan";
import { Decimal, dec, jadwalAngsuran, kodeUnikAcak, NOL } from "@/lib/uang";
import {
  diterimaSchema, shuSchema, anggotaBaruSchema, anggotaUbahSchema, galeriSchema, artikelSchema, rekeningKoperasiSchema, bannerSchema, testimoniSchema, mitraSchema, pencapaianSchema, penghargaanSchema, kantorSchema, menuFooterSchema, mediaSosialSchema, metodePembayaranSchema, ajukanPembayaranSchema as _unused, bayarTunaiSchema, buatSimpananSchema, dariForm, dendaSchema, koreksiSchema,
  penggunaBaruSchema, pencairanSchema, pengaturanSchema, situsSchema, tolakSchema, ubahPeranSchema, verifikasiAnggotaSchema,
} from "@/lib/validasi";
import type { PosisiBanner } from "@prisma/client";

void _unused;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function resolveImageUrl(formData: FormData, folder: "galeri" | "berita" | "banner" | "testimoni" | "mitra", fallback: string, fileKey = "gambarFile", urlKey = "gambarUrl") {
  const file = formData.get(fileKey);
  if (file instanceof File && file.size > 0) {
    const saved = await simpanGambarPublik(file, folder);
    if (saved) return saved;
  }
  return text(formData, urlKey) || fallback;
}

const STATUS_PINJAMAN_AKTIF = ["DIAJUKAN", "DISETUJUI", "DICAIRKAN"] as const;

/** Anggota tidak boleh dinonaktifkan/dihapus selama punya pinjaman aktif atau saldo simpanan. */
async function pastikanBolehNonaktif(tx: Tx, anggotaId: string) {
  const aktif = await tx.pinjaman.count({ where: { anggotaId, status: { in: [...STATUS_PINJAMAN_AKTIF] } } });
  if (aktif > 0) throw new GalatBisnis("Anggota masih memiliki pinjaman aktif sehingga tidak dapat dinonaktifkan.");
  const saldo = await hitungSaldo(tx, anggotaId);
  if (saldo.gt(0)) throw new GalatBisnis(`Anggota masih memiliki saldo simpanan ${formatRupiah(saldo)}. Selesaikan penarikan terlebih dahulu.`);
}

// ---------- Anggota ----------
export async function createMember(formData: FormData) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.anggotaKelola);
    const d = anggotaBaruSchema.parse(dariForm(formData));
    const [emailAda, nikAda] = await Promise.all([prisma.user.findUnique({ where: { email: d.email } }), prisma.anggota.findFirst({ where: { nik: d.nik, OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } })]);
    if (emailAda) throw new GalatBisnis("Email tersebut sudah terdaftar.");
    if (nikAda) throw new GalatBisnis("NIK tersebut sudah terdaftar.");
    const password = await bcrypt.hash(d.password, 10);
    await prisma.$transaction(async (tx) => {
      // Hitung termasuk anggota yang sudah di-soft-delete supaya nomor anggota tidak pernah bentrok.
      const jumlah = await tx.anggota.count({ where: { OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } });
      const user = await tx.user.create({
        data: { nama: d.nama, email: d.email, password, role: "ANGGOTA", anggota: { create: { noAnggota: `BL-${new Date().getFullYear()}-${String(jumlah + 1).padStart(3, "0")}`, nik: d.nik, alamat: d.alamat, noHp: d.noHp, tanggalMasuk: new Date(d.tanggalMasuk), status: "AKTIF", statusVerifikasi: "TERVERIFIKASI", diverifikasiPada: new Date() } } },
        include: { anggota: true },
      });
      await catatAudit(tx, { userId: admin.id, aksi: "CREATE", entitas: "Anggota", entitasId: user.anggota!.id, dataBaru: { ...user.anggota, nama: user.nama, email: user.email } });
    });
    revalidatePath("/admin/anggota");
    return "Anggota berhasil ditambahkan.";
  });
}

export async function verifikasiAnggota(id: string, status: "TERVERIFIKASI" | "DITOLAK", formData: FormData) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.verifikasi);
    const { catatan } = verifikasiAnggotaSchema.parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const lama = await tx.anggota.findUnique({ where: { id } });
      if (!lama) throw new GalatBisnis("Anggota tidak ditemukan.");
      const hasil = await tx.anggota.updateMany({ where: { id, statusVerifikasi: "PENDING" }, data: { statusVerifikasi: status, catatanVerifikasi: catatan, diverifikasiPada: new Date() } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      await catatAudit(tx, { userId: admin.id, aksi: "UPDATE", entitas: "Anggota", entitasId: id, dataLama: { statusVerifikasi: lama.statusVerifikasi }, dataBaru: { statusVerifikasi: status, catatanVerifikasi: catatan } });
    });
    revalidatePath("/admin/verifikasi"); revalidatePath("/admin/anggota"); revalidatePath(`/admin/anggota/${id}`);
    return status === "TERVERIFIKASI" ? "Anggota diverifikasi." : "Verifikasi ditolak.";
  });
}

export async function updateMember(id: string, formData: FormData) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.anggotaKelola);
    const d = anggotaUbahSchema.parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUnique({ where: { id }, include: { user: true } });
      if (!anggota) throw new GalatBisnis("Anggota tidak ditemukan.");
      if (d.status === "NONAKTIF" && anggota.status === "AKTIF") await pastikanBolehNonaktif(tx, id);
      await tx.anggota.update({ where: { id }, data: { nik: d.nik, alamat: d.alamat, noHp: d.noHp, status: d.status } });
      await tx.user.update({ where: { id: anggota.userId }, data: { nama: d.nama, email: d.email } });
      await catatAudit(tx, { userId: admin.id, aksi: "UPDATE", entitas: "Anggota", entitasId: id, dataLama: { nama: anggota.user.nama, email: anggota.user.email, nik: anggota.nik, alamat: anggota.alamat, noHp: anggota.noHp, status: anggota.status }, dataBaru: d });
    });
    revalidatePath("/admin/anggota"); revalidatePath(`/admin/anggota/${id}`);
    return "Data anggota diperbarui.";
  });
}

/** Soft delete: baris tetap ada (riwayat transaksi aman) tetapi disembunyikan dan tidak bisa login. */
export async function deleteMember(id: string) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.anggotaKelola);
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUnique({ where: { id } });
      if (!anggota) throw new GalatBisnis("Anggota tidak ditemukan.");
      await pastikanBolehNonaktif(tx, id);
      await tx.anggota.update({ where: { id }, data: { deletedAt: new Date(), status: "NONAKTIF" } });
      await catatAudit(tx, { userId: admin.id, aksi: "DELETE", entitas: "Anggota", entitasId: id, dataLama: { status: anggota.status, deletedAt: null }, dataBaru: { status: "NONAKTIF", deletedAt: "soft delete" } });
    });
    revalidatePath("/admin/anggota");
    return "Anggota dihapus (soft delete).";
  });
}

// ---------- Simpanan, penarikan, buku mutasi ----------
export async function createSimpanan(formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.simpananInput);
    const batas = await getBatas();
    const d = buatSimpananSchema(batas).parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUnique({ where: { id: d.anggotaId } });
      if (!anggota) throw new GalatBisnis("Anggota tidak ditemukan.");
      if (anggota.status !== "AKTIF") throw new GalatBisnis("Anggota tidak aktif.");
      const simpanan = await tx.simpanan.create({ data: { anggotaId: d.anggotaId, jenis: d.jenis, jumlah: d.jumlah, tanggal: new Date(d.tanggal), keterangan: d.keterangan } });
      await catatMutasi(tx, { anggotaId: d.anggotaId, jenis: "SIMPANAN", arah: "MASUK", jumlah: d.jumlah, referensiId: simpanan.id, keterangan: `Simpanan ${d.jenis.toLowerCase()}${d.keterangan ? ` — ${d.keterangan}` : ""}` });
      await catatAudit(tx, { userId: user.id, aksi: "CREATE", entitas: "Simpanan", entitasId: simpanan.id, dataBaru: simpanan });
    });
    revalidatePath("/admin/simpanan"); revalidatePath("/admin/mutasi");
    return "Simpanan berhasil dicatat.";
  });
}

async function prosesPenarikan(id: string, status: "DISETUJUI" | "DITOLAK") {
  const user = await requireRole(...AKSES.penarikan);
  await prisma.$transaction(async (tx) => {
    const lama = await tx.penarikan.findUnique({ where: { id } });
    if (!lama) throw new GalatBisnis("Penarikan tidak ditemukan.");
    // Kunci anggota lebih dulu agar pengecekan saldo dan pencatatan mutasi tidak balapan dengan transaksi lain.
    await tx.$queryRaw`SELECT id FROM Anggota WHERE id = ${lama.anggotaId} FOR UPDATE`;
    const hasil = await tx.penarikan.updateMany({ where: { id, status: "PENDING" }, data: { status } });
    if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
    if (status === "DISETUJUI") await catatMutasi(tx, { anggotaId: lama.anggotaId, jenis: "PENARIKAN", arah: "KELUAR", jumlah: lama.jumlah, referensiId: id, keterangan: "Penarikan simpanan sukarela" });
    await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Penarikan", entitasId: id, dataLama: { status: "PENDING" }, dataBaru: { status } });
  });
  revalidatePath("/admin/penarikan"); revalidatePath("/admin/mutasi");
}
export async function setujuiPenarikan(id: string) { return jalankan(async () => { await prosesPenarikan(id, "DISETUJUI"); return "Penarikan disetujui."; }); }
export async function tolakPenarikan(id: string) { return jalankan(async () => { await prosesPenarikan(id, "DITOLAK"); return "Penarikan ditolak."; }); }

export async function catatKoreksi(formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.mutasiKoreksi);
    const d = koreksiSchema.parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const anggota = await tx.anggota.findUnique({ where: { id: d.anggotaId } });
      if (!anggota) throw new GalatBisnis("Anggota tidak ditemukan.");
      const baris = await catatMutasi(tx, { anggotaId: d.anggotaId, jenis: "KOREKSI", arah: d.arah, jumlah: d.jumlah, keterangan: d.keterangan });
      await catatAudit(tx, { userId: user.id, aksi: "CREATE", entitas: "Mutasi", entitasId: baris.id, dataBaru: baris });
    });
    revalidatePath("/admin/mutasi");
    return "Koreksi dicatat sebagai mutasi baru.";
  });
}

// ---------- Pinjaman dan pencairan ----------
async function putuskanPinjaman(id: string, status: "DISETUJUI" | "DITOLAK") {
  const user = await requireRole(...AKSES.pinjamanSetujui);
  const pinjaman = await prisma.$transaction(async (tx) => {
    const lama = await tx.pinjaman.findUnique({ where: { id } });
    if (!lama) throw new GalatBisnis("Pinjaman tidak ditemukan.");
    // Pemisahan tugas: penginput tidak boleh menyetujui pinjamannya sendiri.
    if (status === "DISETUJUI" && lama.dibuatOlehId && lama.dibuatOlehId === user.id) throw new GalatBisnis("Pinjaman tidak dapat disetujui oleh pengguna yang sama dengan penginputnya.");
    const hasil = await tx.pinjaman.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status, disetujuiOlehId: user.id, tanggalDisetujui: status === "DISETUJUI" ? new Date() : null } });
    if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
    await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Pinjaman", entitasId: id, dataLama: { status: "DIAJUKAN" }, dataBaru: { status, disetujuiOlehId: user.id } });
    return lama;
  });
  const userId = await userIdDariAnggota(pinjaman.anggotaId);
  if (userId) await buatNotifikasi(status === "DISETUJUI"
    ? { userId, tipe: "INFO", judul: "Pinjaman disetujui — setujui akad", pesan: `Pengajuan pinjaman ${formatRupiah(pinjaman.jumlah)} telah disetujui. Baca dan setujui akad digital agar dana dapat dicairkan.`, link: `/anggota/pinjaman/${id}/akad` }
    : { userId, tipe: "INFO", judul: "Pinjaman ditolak", pesan: `Pengajuan pinjaman ${formatRupiah(pinjaman.jumlah)} belum dapat disetujui.`, link: `/anggota/pinjaman/${id}` });
  revalidatePath("/admin/pinjaman"); revalidatePath(`/admin/pinjaman/${id}`); revalidatePath("/admin/pencairan");
}
export async function setujuiPinjaman(id: string) { return jalankan(async () => { await putuskanPinjaman(id, "DISETUJUI"); return "Pinjaman disetujui."; }); }
export async function tolakPinjaman(id: string) { return jalankan(async () => { await putuskanPinjaman(id, "DITOLAK"); return "Pinjaman ditolak."; }); }

export async function prosesPencairan(pinjamanId: string, formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.pencairan);
    const d = pencairanSchema.parse(dariForm(formData));
    const batas = await getBatas();

    // Pencairan di atas batas wajib Manajer (Admin tidak cukup).
    if (d.jumlahDicairkan.gt(batas.batasPencairanManajer) && user.role !== "MANAJER") {
      throw new GalatBisnis(`Pencairan di atas ${formatRupiah(batas.batasPencairanManajer)} wajib diproses oleh Manajer.`);
    }

    const awal = await prisma.pinjaman.findUnique({ where: { id: pinjamanId }, include: { pencairan: true } });
    if (!awal) throw new GalatBisnis("Pinjaman tidak ditemukan.");
    if (awal.status !== "DISETUJUI" || awal.pencairan) throw new GalatBisnis(SUDAH_DIPROSES);
    if (!(await prisma.akadPinjaman.findUnique({ where: { pinjamanId }, select: { id: true } }))) throw new GalatBisnis("Pencairan belum dapat diproses: anggota belum menyetujui akad digital.");
    if (d.jumlahDicairkan.gt(awal.jumlah)) throw new GalatBisnis("Jumlah dicairkan tidak boleh melebihi jumlah pinjaman.");
    if (d.biayaAdmin.gte(d.jumlahDicairkan)) throw new GalatBisnis("Biaya admin tidak valid.");
    const rekening = await prisma.rekeningAnggota.findFirst({ where: { id: d.rekeningAnggotaId, anggotaId: awal.anggotaId } });
    if (!rekening) throw new GalatBisnis("Rekening tujuan bukan milik anggota ini.");

    let buktiTransferUrl: string | null = null;
    const buktiFile = formData.get("buktiTransfer");
    if (buktiFile instanceof File && buktiFile.size > 0) buktiTransferUrl = await simpanBerkasPrivat(buktiFile, "BUKTI_TRANSFER", awal.anggotaId, user.id);

    const tanggalPencairan = new Date();
    try {
      await prisma.$transaction(async (tx) => {
        if ((await tx.akadPinjaman.count({ where: { pinjamanId } })) === 0) throw new GalatBisnis("Pencairan belum dapat diproses: anggota belum menyetujui akad digital.");
        const hasil = await tx.pinjaman.updateMany({ where: { id: pinjamanId, status: "DISETUJUI" }, data: { status: "DICAIRKAN" } });
        if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
        const pencairan = await tx.pencairan.create({ data: { pinjamanId, rekeningAnggotaId: d.rekeningAnggotaId, jumlahDicairkan: d.jumlahDicairkan, biayaAdmin: d.biayaAdmin, tanggalPencairan, buktiTransferUrl, diprosesOlehId: user.id, catatan: d.catatan } });
        const jadwal = jadwalAngsuran(awal.totalBayar, awal.tenorBulan);
        await tx.angsuran.createMany({
          data: jadwal.map((jumlah, index) => {
            const jatuhTempo = new Date(tanggalPencairan);
            jatuhTempo.setMonth(jatuhTempo.getMonth() + index + 1);
            return { pinjamanId, angsuranKe: index + 1, jumlah, tanggalJatuhTempo: jatuhTempo, status: "BELUM" as const, kodeUnik: kodeUnikAcak() };
          }),
        });
        await catatMutasi(tx, { anggotaId: awal.anggotaId, jenis: "PENCAIRAN", arah: "KELUAR", jumlah: d.jumlahDicairkan, referensiId: pencairan.id, keterangan: `Pencairan pinjaman${d.biayaAdmin.gt(0) ? ` (biaya admin ${formatRupiah(d.biayaAdmin)})` : ""}` });
        await catatAudit(tx, { userId: user.id, aksi: "CREATE", entitas: "Pencairan", entitasId: pencairan.id, dataBaru: pencairan });
        await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Pinjaman", entitasId: pinjamanId, dataLama: { status: "DISETUJUI" }, dataBaru: { status: "DICAIRKAN" } });
      });
    } catch (error) {
      await buangBerkasPrivat(buktiTransferUrl);
      throw error;
    }

    const userIdPencairan = await userIdDariAnggota(awal.anggotaId);
    if (userIdPencairan) await buatNotifikasi({ userId: userIdPencairan, tipe: "PENCAIRAN", judul: "Pinjaman dicairkan", pesan: `Dana ${formatRupiah(d.jumlahDicairkan)} sudah ditransfer ke rekening kamu. Angsuran pertama jatuh tempo bulan depan.`, link: `/anggota/pinjaman/${pinjamanId}` });
    revalidatePath("/admin/pencairan"); revalidatePath(`/admin/pencairan/${pinjamanId}`); revalidatePath("/admin/pinjaman"); revalidatePath(`/admin/pinjaman/${pinjamanId}`); revalidatePath("/admin/angsuran"); revalidatePath("/admin/mutasi");
    return "Pencairan berhasil diproses.";
  });
}

// ---------- Rekening koperasi ----------
export async function createRekeningKoperasi(formData: FormData) {
  await requireRole(...AKSES.konten);
  const { isAktif: _a, ...d } = rekeningKoperasiSchema.parse(dariForm(formData)); void _a;
  await prisma.rekeningKoperasi.create({ data: d });
  revalidatePath("/admin/rekening-koperasi");
}

export async function updateRekeningKoperasi(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  await prisma.rekeningKoperasi.update({ where: { id }, data: rekeningKoperasiSchema.parse(dariForm(formData)) });
  revalidatePath("/admin/rekening-koperasi");
}

export async function deleteRekeningKoperasi(id: string) {
  await requireRole(...AKSES.konten);
  await prisma.rekeningKoperasi.delete({ where: { id } });
  revalidatePath("/admin/rekening-koperasi");
}

// ---------- Angsuran dan pembayaran ----------
export async function bayarAngsuranTunai(id: string, formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.angsuranTunai);
    const { tanggalBayar } = bayarTunaiSchema.parse(dariForm(formData));
    const info = await prisma.$transaction(async (tx) => {
      const angsuran = await tx.angsuran.findUnique({ where: { id }, include: { pinjaman: true } });
      if (!angsuran) throw new GalatBisnis("Angsuran tidak ditemukan.");
      if (angsuran.status === "MENUNGGU_VERIFIKASI") throw new GalatBisnis("Ada bukti pembayaran yang menunggu verifikasi untuk angsuran ini. Verifikasi dahulu di halaman Verifikasi Pembayaran.");
      if (!(await isAngsuranPayable(angsuran.pinjamanId, angsuran.angsuranKe, tx))) throw new GalatBisnis(`Lunasi angsuran sebelumnya (ke-${angsuran.angsuranKe - 1}) terlebih dahulu.`);
      const anggotaId = angsuran.pinjaman.anggotaId;
      await kunciAnggota(tx, anggotaId);
      const alokasi = alokasiPembayaran(angsuran, dec(angsuran.jumlah).plus(angsuran.denda).minus(angsuran.terbayar));
      const hasil = await tx.angsuran.updateMany({ where: { id, status: { in: ["BELUM", "TERLAMBAT"] } }, data: { status: "LUNAS", tanggalBayar: new Date(tanggalBayar), terbayar: dec(angsuran.jumlah).plus(angsuran.denda) } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      if (alokasi.pokok.gt(0)) await catatMutasi(tx, { anggotaId, jenis: "ANGSURAN", arah: "MASUK", jumlah: alokasi.pokok, referensiId: id, keterangan: `Angsuran ke-${angsuran.angsuranKe} (tunai)` });
      if (alokasi.denda.gt(0)) await catatMutasi(tx, { anggotaId, jenis: "DENDA", arah: "MASUK", jumlah: alokasi.denda, referensiId: id, keterangan: `Denda angsuran ke-${angsuran.angsuranKe} (tunai)` });
      await markPinjamanLunasIfComplete(angsuran.pinjamanId, tx);
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Angsuran", entitasId: id, dataLama: { status: angsuran.status }, dataBaru: { status: "LUNAS", tanggalBayar, metode: "tunai" } });
      return { anggotaId, pinjamanId: angsuran.pinjamanId, angsuranKe: angsuran.angsuranKe };
    });
    const userIdTunai = await userIdDariAnggota(info.anggotaId);
    if (userIdTunai) await buatNotifikasi({ userId: userIdTunai, tipe: "PEMBAYARAN", judul: `Angsuran ke-${info.angsuranKe} lunas`, pesan: "Pembayaran tunai angsuran kamu sudah dicatat koperasi.", link: `/anggota/pinjaman/${info.pinjamanId}` });
    revalidatePath("/admin/angsuran"); revalidatePath("/admin/pinjaman"); revalidatePath("/admin/mutasi");
    return "Pembayaran tunai dicatat.";
  });
}

export async function updateDendaAngsuran(id: string, formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.angsuranDenda);
    const { denda } = dendaSchema.parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const lama = await tx.angsuran.findUnique({ where: { id } });
      if (!lama) throw new GalatBisnis("Angsuran tidak ditemukan.");
      const kuota = await sisaKuotaDenda(tx, lama.pinjamanId, id);
      if (denda.gt(kuota)) throw new GalatBisnis(`Total denda pinjaman dibatasi maksimal ${formatRupiah(kuota)} untuk angsuran ini (batas % dari pokok di Pengaturan).`);
      const hasil = await tx.angsuran.updateMany({ where: { id, status: { in: ["BELUM", "TERLAMBAT"] } }, data: { denda } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Angsuran", entitasId: id, dataLama: { denda: lama.denda }, dataBaru: { denda } });
    });
    revalidatePath("/admin/angsuran");
    return "Denda diperbarui.";
  });
}

export async function terimaPembayaran(id: string, formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.verifikasiPembayaran);
    const { jumlahDiterima } = diterimaSchema.parse(dariForm(formData));
    const info = await prisma.$transaction(async (tx) => {
      const awal = await tx.pembayaran.findUnique({ where: { id }, select: { anggotaId: true } });
      if (!awal) throw new GalatBisnis("Pembayaran tidak ditemukan.");
      await kunciAnggota(tx, awal.anggotaId);
      const pembayaran = await tx.pembayaran.findUniqueOrThrow({ where: { id }, include: { angsuran: { include: { pinjaman: { include: { angsuran: { orderBy: { angsuranKe: "asc" } } } } } }, anggota: { select: { userId: true } } } });
      if (pembayaran.status !== "MENUNGGU") throw new GalatBisnis(SUDAH_DIPROSES);
      const { angsuran } = pembayaran; const pinjaman = angsuran.pinjaman; const sekarang = new Date();
      let status: "DITERIMA" | "SEBAGIAN" = "DITERIMA"; let kelebihan = NOL; let ringkasan = ""; let pokokBagian = NOL; let dendaBagian = NOL;

      if (pembayaran.isPelunasan) {
        const pelunasan = hitungPelunasan(pinjaman, pinjaman.angsuran);
        if (!pelunasan) throw new GalatBisnis(SUDAH_DIPROSES);
        if (jumlahDiterima.lt(pelunasan.total)) throw new GalatBisnis(`Jumlah diterima kurang dari nilai pelunasan (${formatRupiah(pelunasan.total)}). Tolak pembayaran ini dan minta anggota mengajukan ulang.`);
        kelebihan = jumlahDiterima.minus(pelunasan.total); dendaBagian = pelunasan.denda; pokokBagian = Decimal.max(NOL, pelunasan.total.minus(pelunasan.denda));
        for (const a of pinjaman.angsuran.filter((x) => x.status !== "LUNAS")) {
          await tx.angsuran.update({ where: { id: a.id }, data: { status: "LUNAS", tanggalBayar: sekarang, terbayar: dec(a.jumlah).plus(a.denda) } });
        }
        await tx.pinjaman.update({ where: { id: pinjaman.id }, data: { status: "LUNAS" } });
        ringkasan = "Pelunasan dipercepat diterima; pinjaman dinyatakan lunas.";
      } else {
        const alokasi = alokasiPembayaran(angsuran, jumlahDiterima);
        if (alokasi.diterapkan.lte(0)) throw new GalatBisnis("Angsuran ini sudah tidak memiliki sisa tagihan.");
        kelebihan = alokasi.kelebihan; pokokBagian = alokasi.pokok; dendaBagian = alokasi.denda;
        status = alokasi.lunas ? "DITERIMA" : "SEBAGIAN";
        const angsuranBaru = await tx.angsuran.updateMany({ where: { id: angsuran.id, status: "MENUNGGU_VERIFIKASI" }, data: { status: alokasi.lunas ? "LUNAS" : angsuran.tanggalJatuhTempo < sekarang ? "TERLAMBAT" : "BELUM", terbayar: dec(angsuran.terbayar).plus(alokasi.diterapkan), ...(alokasi.lunas ? { tanggalBayar: pembayaran.tanggalBayar } : {}) } });
        if (angsuranBaru.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
        if (alokasi.lunas) await markPinjamanLunasIfComplete(angsuran.pinjamanId, tx);
        ringkasan = alokasi.lunas ? "Pembayaran diterima dan angsuran lunas." : `Pembayaran kurang: baru ${formatRupiah(alokasi.diterapkan)} dari sisa tagihan ${formatRupiah(alokasi.sisaSebelum)} yang terbayar. Lengkapi sisanya.`;
      }

      // Klaim atomik: hanya satu verifikator yang bisa mengubah MENUNGGU → status akhir.
      const hasil = await tx.pembayaran.updateMany({ where: { id, status: "MENUNGGU" }, data: { status, diverifikasiOlehId: user.id, tanggalVerifikasi: sekarang, jumlahBayar: pokokBagian, dendaDibayar: dendaBagian, kelebihan } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);

      const anggotaId = pembayaran.anggotaId; const ke = angsuran.angsuranKe;
      if (pokokBagian.gt(0)) await catatMutasi(tx, { anggotaId, jenis: "ANGSURAN", arah: "MASUK", jumlah: pokokBagian, referensiId: id, keterangan: pembayaran.isPelunasan ? "Pelunasan dipercepat (transfer)" : `Angsuran ke-${ke} (transfer${status === "SEBAGIAN" ? ", sebagian" : ""})` });
      if (dendaBagian.gt(0)) await catatMutasi(tx, { anggotaId, jenis: "DENDA", arah: "MASUK", jumlah: dendaBagian, referensiId: id, keterangan: `Denda angsuran ke-${ke} (transfer)` });
      if (kelebihan.gt(0)) {
        // Kelebihan transfer (termasuk kode unik) masuk ke simpanan sukarela anggota.
        const simpanan = await tx.simpanan.create({ data: { anggotaId, jenis: "SUKARELA", jumlah: kelebihan, keterangan: `Kelebihan pembayaran angsuran ke-${ke}` } });
        await catatMutasi(tx, { anggotaId, jenis: "SIMPANAN", arah: "MASUK", jumlah: kelebihan, referensiId: simpanan.id, keterangan: `Kelebihan pembayaran angsuran ke-${ke} → simpanan sukarela` });
        await catatAudit(tx, { userId: user.id, aksi: "CREATE", entitas: "Simpanan", entitasId: simpanan.id, dataBaru: simpanan });
      }
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Pembayaran", entitasId: id, dataLama: { status: "MENUNGGU", jumlahTransfer: pembayaran.jumlahTransfer }, dataBaru: { status, jumlahDiterima, kelebihan, diverifikasiOlehId: user.id } });
      return { userId: pembayaran.anggota.userId, angsuranKe: ke, status, kelebihan, ringkasan };
    });
    await buatNotifikasi({ userId: info.userId, tipe: "PEMBAYARAN", judul: info.status === "SEBAGIAN" ? `Pembayaran angsuran ke-${info.angsuranKe} baru sebagian` : `Pembayaran angsuran ke-${info.angsuranKe} diterima`, pesan: `${info.ringkasan}${info.kelebihan.gt(0) ? ` Kelebihan ${formatRupiah(info.kelebihan)} masuk ke simpanan sukarela Anda.` : ""}`, link: "/anggota/pembayaran" });
    revalidatePath("/admin/verifikasi-pembayaran"); revalidatePath(`/admin/verifikasi-pembayaran/${id}`); revalidatePath("/admin/angsuran"); revalidatePath("/admin/pinjaman"); revalidatePath("/admin/mutasi");
    return info.ringkasan;
  });
}

export async function tolakPembayaran(id: string, formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.verifikasiPembayaran);
    const { alasan } = tolakSchema.parse(dariForm(formData));
    const info = await prisma.$transaction(async (tx) => {
      const pembayaran = await tx.pembayaran.findUnique({ where: { id }, include: { angsuran: true, anggota: { select: { userId: true } } } });
      if (!pembayaran) throw new GalatBisnis("Pembayaran tidak ditemukan.");
      const hasil = await tx.pembayaran.updateMany({ where: { id, status: "MENUNGGU" }, data: { status: "DITOLAK", alasanTolak: alasan, diverifikasiOlehId: user.id, tanggalVerifikasi: new Date() } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      const angsuranBaru = await tx.angsuran.updateMany({ where: { id: pembayaran.angsuranId, status: "MENUNGGU_VERIFIKASI" }, data: { status: pembayaran.angsuran.tanggalJatuhTempo < new Date() ? "TERLAMBAT" : "BELUM" } });
      if (angsuranBaru.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Pembayaran", entitasId: id, dataLama: { status: "MENUNGGU" }, dataBaru: { status: "DITOLAK", alasanTolak: alasan } });
      return { userId: pembayaran.anggota.userId, angsuranKe: pembayaran.angsuran.angsuranKe, angsuranId: pembayaran.angsuranId };
    });
    await buatNotifikasi({ userId: info.userId, tipe: "PEMBAYARAN", judul: `Pembayaran angsuran ke-${info.angsuranKe} ditolak`, pesan: `Alasan: ${alasan}. Silakan unggah ulang bukti pembayaran.`, link: `/anggota/bayar/${info.angsuranId}` });
    revalidatePath("/admin/verifikasi-pembayaran"); revalidatePath(`/admin/verifikasi-pembayaran/${id}`); revalidatePath("/admin/angsuran");
    return "Pembayaran ditolak.";
  });
}

// ---------- Pengguna (staf) ----------
export async function buatPengguna(formData: FormData) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.pengguna);
    const d = penggunaBaruSchema.parse(dariForm(formData));
    if (await prisma.user.findUnique({ where: { email: d.email } })) throw new GalatBisnis("Email tersebut sudah terdaftar.");
    const password = await bcrypt.hash(d.password, 10);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { nama: d.nama, email: d.email, password, role: d.role } });
      await catatAudit(tx, { userId: admin.id, aksi: "CREATE", entitas: "User", entitasId: user.id, dataBaru: { nama: user.nama, email: user.email, role: user.role } });
    });
    revalidatePath("/admin/pengguna");
    return "Pengguna ditambahkan.";
  });
}

export async function ubahPeran(id: string, formData: FormData) {
  return jalankan(async () => {
    const admin = await requireRole(...AKSES.pengguna);
    const { role } = ubahPeranSchema.parse(dariForm(formData));
    if (id === admin.id) throw new GalatBisnis("Anda tidak dapat mengubah peran akun sendiri.");
    await prisma.$transaction(async (tx) => {
      const lama = await tx.user.findUnique({ where: { id } });
      if (!lama || lama.role === "ANGGOTA") throw new GalatBisnis("Pengguna tidak ditemukan.");
      await tx.user.update({ where: { id }, data: { role } });
      await catatAudit(tx, { userId: admin.id, aksi: "UPDATE", entitas: "User", entitasId: id, dataLama: { role: lama.role }, dataBaru: { role } });
    });
    revalidatePath("/admin/pengguna");
    return "Peran diperbarui.";
  });
}

export async function createGaleri(formData: FormData) {
  await requireRole(...AKSES.konten);
  const gambarUrl = await resolveImageUrl(formData, "galeri", "");
  if (!gambarUrl) throw new Error("Unggah gambar atau isi URL gambar.");
  await prisma.galeri.create({ data: { ...galeriSchema.parse(dariForm(formData)), gambarUrl } });
  revalidatePath("/admin/galeri"); revalidatePath("/galeri");
}

export async function updateGaleri(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  const existing = await prisma.galeri.findUnique({ where: { id } });
  const gambarUrl = await resolveImageUrl(formData, "galeri", existing?.gambarUrl ?? "");
  await prisma.galeri.update({ where: { id }, data: { ...galeriSchema.parse(dariForm(formData)), gambarUrl } });
  revalidatePath("/admin/galeri"); revalidatePath("/galeri");
}

export async function deleteGaleri(id: string) {
  await requireRole(...AKSES.konten); await prisma.galeri.update({ where: { id }, data: { deletedAt: new Date() } }); revalidatePath("/admin/galeri"); revalidatePath("/galeri");
}

export async function createArtikel(formData: FormData) {
  await requireRole(...AKSES.konten);
  const gambarUrl = await resolveImageUrl(formData, "berita", "");
  await prisma.artikel.create({ data: { ...artikelSchema.parse(dariForm(formData)), gambarUrl: gambarUrl || null } });
  revalidatePath("/admin/berita"); revalidatePath("/berita");
}

export async function updateArtikel(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  const existing = await prisma.artikel.findUnique({ where: { id } });
  const gambarUrl = await resolveImageUrl(formData, "berita", existing?.gambarUrl ?? "");
  await prisma.artikel.update({ where: { id }, data: { ...artikelSchema.parse(dariForm(formData)), gambarUrl: gambarUrl || null } });
  revalidatePath("/admin/berita"); revalidatePath("/berita");
}

export async function deleteArtikel(id: string) {
  await requireRole(...AKSES.konten);
  const artikel = await prisma.artikel.findUnique({ where: { id } });
  if (artikel) await prisma.artikel.update({ where: { id }, data: { deletedAt: new Date(), slug: `${artikel.slug}-dihapus-${Date.now()}` } }); // slug dilepas agar bisa dipakai lagi
  revalidatePath("/admin/berita"); revalidatePath("/berita");
}

export async function updatePengaturan(formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.pengaturan);
    const data = pengaturanSchema.parse(dariForm(formData));
    await prisma.$transaction(async (tx) => {
      const current = await tx.pengaturan.findFirst();
      const saved = current ? await tx.pengaturan.update({ where: { id: current.id }, data }) : await tx.pengaturan.create({ data });
      await catatAudit(tx, { userId: user.id, aksi: current ? "UPDATE" : "CREATE", entitas: "Pengaturan", entitasId: saved.id, dataLama: current ?? undefined, dataBaru: saved });
    });
    revalidatePath("/admin/pengaturan");
    return "Pengaturan disimpan.";
  });
}

const revalidateTagihan = () => { revalidatePath("/admin/tunggakan"); revalidatePath("/admin/pengingat"); revalidatePath("/admin/angsuran"); revalidatePath("/admin/dashboard"); };

/** Tombol "Jalankan Pengecekan Sekarang" — logika sama dengan cron harian. */
export async function jalankanPengecekan(returnTo: string) {
  await requireRole(...AKSES.pengingat);
  const hasil = await cekJatuhTempo();
  revalidateTagihan();
  const tujuan = ["/admin/tunggakan", "/admin/pengingat"].includes(returnTo) ? returnTo : "/admin/tunggakan";
  redirect(`${tujuan}?dicek=${hasil.pengingat}.${hasil.terlambat}.${hasil.email}.${hasil.dilewati}`);
}

/** Kirim pengingat manual (notifikasi + email) untuk satu angsuran; sengaja tidak terkena batas 1x/hari. */
export async function kirimPengingatManual(angsuranId: string) {
  await requireRole(...AKSES.pengingat);
  const angsuran = await prisma.angsuran.findUnique({ where: { id: angsuranId }, include: { pinjaman: { include: { anggota: { include: { user: true } } } } } });
  if (!angsuran) throw new Error("Angsuran tidak ditemukan.");
  if (angsuran.status === "LUNAS" || angsuran.status === "MENUNGGU_VERIFIKASI") throw new Error("Angsuran ini tidak perlu diingatkan.");
  const { dendaPersenPerHari } = await getPengaturanTagihan();
  const hari = hariTerlambat(angsuran.tanggalJatuhTempo);
  const denda = hari > 0 ? await batasiDenda(prisma, angsuran, hitungDenda(dec(angsuran.jumlah).minus(dec(angsuran.terbayar)), dendaPersenPerHari, hari)) : NOL;
  if (hari > 0) await prisma.angsuran.update({ where: { id: angsuranId }, data: { status: "TERLAMBAT", denda } });
  await kirimPengingatAngsuran(angsuran, hari, denda);
  revalidateTagihan();
  redirect("/admin/tunggakan?terkirim=1");
}


// ---------- Konten publik (Tahap 9B) ----------
const tanggalAwal = (value: string) => (value ? new Date(`${value}T00:00:00`) : null);
const tanggalAkhir = (value: string) => (value ? new Date(`${value}T23:59:59.999`) : null);
const revalidateKonten = () => { revalidatePath("/"); revalidatePath("/tentang"); };

function dataBanner(formData: FormData, gambarUrl: string) {
  const d = bannerSchema.parse(dariForm(formData));
  const mulai = tanggalAwal(d.tanggalMulai ?? ""); const selesai = tanggalAkhir(d.tanggalSelesai ?? "");
  if (mulai && selesai && selesai < mulai) throw new GalatBisnis("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  return { judul: d.judul, subjudul: d.subjudul, gambarUrl, linkTujuan: d.linkTujuan, teksTombol: d.teksTombol, posisi: d.posisi as PosisiBanner, urutan: d.urutan, isAktif: d.isAktif, tanggalMulai: mulai, tanggalSelesai: selesai };
}

export async function createBanner(formData: FormData) {
  await requireRole(...AKSES.konten);
  const gambarUrl = await resolveImageUrl(formData, "banner", "");
  if (!gambarUrl) throw new Error("Unggah gambar atau isi URL gambar banner.");
  await prisma.banner.create({ data: dataBanner(formData, gambarUrl) });
  revalidatePath("/admin/banner"); revalidateKonten();
}

export async function updateBanner(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new Error("Banner tidak ditemukan.");
  const gambarUrl = await resolveImageUrl(formData, "banner", existing.gambarUrl);
  await prisma.banner.update({ where: { id }, data: dataBanner(formData, gambarUrl) });
  revalidatePath("/admin/banner"); revalidateKonten();
}

export async function deleteBanner(id: string) {
  await requireRole(...AKSES.konten); await prisma.banner.delete({ where: { id } }); revalidatePath("/admin/banner"); revalidateKonten();
}

function dataTestimoni(formData: FormData, fotoUrl: string | null) {
  return { ...testimoniSchema.parse(dariForm(formData)), fotoUrl };
}

export async function createTestimoni(formData: FormData) {
  await requireRole(...AKSES.konten);
  const fotoUrl = (await resolveImageUrl(formData, "testimoni", "", "fotoFile", "fotoUrl")) || null;
  await prisma.testimoni.create({ data: dataTestimoni(formData, fotoUrl) });
  revalidatePath("/admin/testimoni"); revalidateKonten();
}

export async function updateTestimoni(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  const existing = await prisma.testimoni.findUnique({ where: { id } });
  if (!existing) throw new Error("Testimoni tidak ditemukan.");
  const fotoUrl = (await resolveImageUrl(formData, "testimoni", existing.fotoUrl ?? "", "fotoFile", "fotoUrl")) || null;
  await prisma.testimoni.update({ where: { id }, data: dataTestimoni(formData, fotoUrl) });
  revalidatePath("/admin/testimoni"); revalidateKonten();
}

export async function deleteTestimoni(id: string) {
  await requireRole(...AKSES.konten); await prisma.testimoni.delete({ where: { id } }); revalidatePath("/admin/testimoni"); revalidateKonten();
}

function dataMitra(formData: FormData) {
  return mitraSchema.parse(dariForm(formData));
}

export async function createMitra(formData: FormData) {
  await requireRole(...AKSES.konten);
  const logoUrl = await resolveImageUrl(formData, "mitra", "", "logoFile", "logoUrl");
  if (!logoUrl) throw new Error("Unggah logo atau isi URL logo mitra.");
  const data = { ...dataMitra(formData), logoUrl };
  await prisma.$transaction(async (tx) => {
    if (data.isUnggulan) await tx.mitra.updateMany({ where: { isUnggulan: true }, data: { isUnggulan: false } }); // hanya satu sorotan
    await tx.mitra.create({ data });
  });
  revalidatePath("/admin/mitra"); revalidateKonten(); revalidatePath("/mitra");
}

export async function updateMitra(id: string, formData: FormData) {
  await requireRole(...AKSES.konten);
  const existing = await prisma.mitra.findUnique({ where: { id } });
  if (!existing) throw new Error("Mitra tidak ditemukan.");
  const logoUrl = await resolveImageUrl(formData, "mitra", existing.logoUrl, "logoFile", "logoUrl");
  const data = { ...dataMitra(formData), logoUrl };
  await prisma.$transaction(async (tx) => {
    if (data.isUnggulan) await tx.mitra.updateMany({ where: { id: { not: id }, isUnggulan: true }, data: { isUnggulan: false } });
    await tx.mitra.update({ where: { id }, data });
  });
  revalidatePath("/admin/mitra"); revalidateKonten();
}

export async function deleteMitra(id: string) {
  await requireRole(...AKSES.konten); await prisma.mitra.update({ where: { id }, data: { deletedAt: new Date(), isUnggulan: false } }); revalidatePath("/admin/mitra"); revalidateKonten();
}

function dataPencapaian(formData: FormData) {
  const d = pencapaianSchema.parse(dariForm(formData));
  if (d.tahun < 1900) throw new GalatBisnis("Tahun tidak valid.");
  return d;
}

export async function createPencapaian(formData: FormData) {
  await requireRole(...AKSES.konten); await prisma.pencapaian.create({ data: dataPencapaian(formData) }); revalidatePath("/admin/pencapaian"); revalidateKonten();
}

export async function updatePencapaian(id: string, formData: FormData) {
  await requireRole(...AKSES.konten); await prisma.pencapaian.update({ where: { id }, data: dataPencapaian(formData) }); revalidatePath("/admin/pencapaian"); revalidateKonten();
}

export async function deletePencapaian(id: string) {
  await requireRole(...AKSES.konten); await prisma.pencapaian.delete({ where: { id } }); revalidatePath("/admin/pencapaian"); revalidateKonten();
}

// ---------- Tahap 10A: mitra detail, penghargaan, kantor cabang, tampilan footer ----------
const revalidateSitus = () => { revalidatePath("/", "layout"); revalidatePath("/mitra"); revalidatePath("/tentang"); revalidatePath("/kantor-cabang"); };

function dataPenghargaan(formData: FormData) {
  const d = penghargaanSchema.parse(dariForm(formData));
  if (d.tahun < 1900) throw new GalatBisnis("Tahun tidak valid.");
  return d;
}
export async function createPenghargaan(formData: FormData) { await requireRole(...AKSES.konten); await prisma.penghargaan.create({ data: dataPenghargaan(formData) }); revalidatePath("/admin/penghargaan"); revalidateSitus(); }
export async function updatePenghargaan(id: string, formData: FormData) { await requireRole(...AKSES.konten); await prisma.penghargaan.update({ where: { id }, data: dataPenghargaan(formData) }); revalidatePath("/admin/penghargaan"); revalidateSitus(); }
export async function deletePenghargaan(id: string) { await requireRole(...AKSES.konten); await prisma.penghargaan.delete({ where: { id } }); revalidatePath("/admin/penghargaan"); revalidateSitus(); }

function dataKantor(formData: FormData) {
  return kantorSchema.parse(dariForm(formData));
}
export async function createKantor(formData: FormData) {
  await requireRole(...AKSES.konten); const data = dataKantor(formData);
  await prisma.$transaction(async (tx) => { if (data.isPusat) await tx.kantorCabang.updateMany({ where: { isPusat: true }, data: { isPusat: false } }); await tx.kantorCabang.create({ data }); });
  revalidatePath("/admin/kantor-cabang"); revalidateSitus();
}
export async function updateKantor(id: string, formData: FormData) {
  await requireRole(...AKSES.konten); const data = dataKantor(formData);
  await prisma.$transaction(async (tx) => { if (data.isPusat) await tx.kantorCabang.updateMany({ where: { id: { not: id }, isPusat: true }, data: { isPusat: false } }); await tx.kantorCabang.update({ where: { id }, data }); });
  revalidatePath("/admin/kantor-cabang"); revalidateSitus();
}
export async function deleteKantor(id: string) { await requireRole(...AKSES.konten); await prisma.kantorCabang.delete({ where: { id } }); revalidatePath("/admin/kantor-cabang"); revalidateSitus(); }

// --- Tampilan footer ---
const revalidateFooter = () => { revalidatePath("/admin/tampilan-footer"); revalidateSitus(); };
export async function updateSitus(formData: FormData) {
  const user = await requireRole(...AKSES.pengaturan);
  const data = situsSchema.parse(dariForm(formData));
  const batas = await getBatas();
  await prisma.$transaction(async (tx) => {
    const current = await tx.pengaturan.findFirst();
    const saved = current ? await tx.pengaturan.update({ where: { id: current.id }, data }) : await tx.pengaturan.create({ data: { ...data, bungaDefault: batas.bungaDefault, simpananPokok: 100000, simpananWajib: 50000 } });
    await catatAudit(tx, { userId: user.id, aksi: current ? "UPDATE" : "CREATE", entitas: "Pengaturan", entitasId: saved.id, dataLama: current ? { namaInstansi: current.namaInstansi, deskripsiFooter: current.deskripsiFooter, emailCs: current.emailCs, teleponCs: current.teleponCs, whatsappCs: current.whatsappCs, alamatPusat: current.alamatPusat } : undefined, dataBaru: data });
  });
  revalidateFooter();
}

function dataMenu(formData: FormData) { return menuFooterSchema.parse(dariForm(formData)); }
export async function createMenuFooter(formData: FormData) { await requireRole(...AKSES.konten); await prisma.menuFooter.create({ data: dataMenu(formData) }); revalidateFooter(); }
export async function updateMenuFooter(id: string, formData: FormData) { await requireRole(...AKSES.konten); await prisma.menuFooter.update({ where: { id }, data: dataMenu(formData) }); revalidateFooter(); }
export async function deleteMenuFooter(id: string) { await requireRole(...AKSES.konten); await prisma.menuFooter.delete({ where: { id } }); revalidateFooter(); }

function dataSosial(formData: FormData) { return mediaSosialSchema.parse(dariForm(formData)); }
export async function createMediaSosial(formData: FormData) { await requireRole(...AKSES.konten); await prisma.mediaSosial.create({ data: dataSosial(formData) }); revalidateFooter(); }
export async function updateMediaSosial(id: string, formData: FormData) { await requireRole(...AKSES.konten); await prisma.mediaSosial.update({ where: { id }, data: dataSosial(formData) }); revalidateFooter(); }
export async function deleteMediaSosial(id: string) { await requireRole(...AKSES.konten); await prisma.mediaSosial.delete({ where: { id } }); revalidateFooter(); }

function dataMetode(formData: FormData) { return metodePembayaranSchema.parse(dariForm(formData)); }
export async function createMetodePembayaran(formData: FormData) { await requireRole(...AKSES.konten); await prisma.metodePembayaran.create({ data: dataMetode(formData) }); revalidateFooter(); }
export async function updateMetodePembayaran(id: string, formData: FormData) { await requireRole(...AKSES.konten); await prisma.metodePembayaran.update({ where: { id }, data: dataMetode(formData) }); revalidateFooter(); }
export async function deleteMetodePembayaran(id: string) { await requireRole(...AKSES.konten); await prisma.metodePembayaran.delete({ where: { id } }); revalidateFooter(); }

// ---------- Tahap 11B: KYC, restrukturisasi, SHU ----------
async function putuskanKyc(id: string, status: "DITERIMA" | "DITOLAK", formData: FormData) {
  const user = await requireRole(...AKSES.verifikasiAnggota);
  const alasan = String(formData.get("alasan") ?? "").trim();
  if (status === "DITOLAK" && alasan.length < 3) throw new GalatBisnis("Alasan penolakan wajib diisi.");
  const info = await prisma.$transaction(async (tx) => {
    const kyc = await tx.verifikasiAnggota.findUnique({ where: { id }, include: { anggota: { select: { userId: true } } } });
    if (!kyc) throw new GalatBisnis("Pengajuan tidak ditemukan.");
    const hasil = await tx.verifikasiAnggota.updateMany({ where: { id, status: "MENUNGGU" }, data: { status, alasanTolak: status === "DITOLAK" ? alasan.slice(0, 190) : null, diverifikasiOlehId: user.id, tanggalVerifikasi: new Date() } });
    if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
    await tx.anggota.update({ where: { id: kyc.anggotaId }, data: { statusVerifikasi: status === "DITERIMA" ? "TERVERIFIKASI" : "DITOLAK", catatanVerifikasi: status === "DITOLAK" ? alasan.slice(0, 190) : null, diverifikasiPada: new Date() } });
    await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "VerifikasiAnggota", entitasId: id, dataLama: { status: "MENUNGGU" }, dataBaru: { status, alasanTolak: alasan || null } });
    return kyc.anggota.userId;
  });
  await buatNotifikasi({ userId: info, tipe: "INFO", judul: status === "DITERIMA" ? "Identitas terverifikasi" : "Verifikasi identitas ditolak", pesan: status === "DITERIMA" ? "Verifikasi identitas Anda diterima. Anda dapat mengajukan pinjaman jika memenuhi syarat." : `Verifikasi ditolak: ${alasan}. Kirim ulang dokumen Anda.`, link: "/anggota/verifikasi" });
  revalidatePath("/admin/verifikasi-anggota"); revalidatePath("/anggota/verifikasi");
}
export async function terimaKyc(id: string, formData: FormData) { return jalankan(async () => { await putuskanKyc(id, "DITERIMA", formData); return "Verifikasi diterima."; }); }
export async function tolakKyc(id: string, formData: FormData) { return jalankan(async () => { await putuskanKyc(id, "DITOLAK", formData); return "Verifikasi ditolak."; }); }

async function putuskanRestrukturisasi(id: string, status: "DISETUJUI" | "DITOLAK") {
  const user = await requireRole(...AKSES.restrukturisasiKeputusan);
  const info = await prisma.$transaction(async (tx) => {
    const req = await tx.restrukturisasi.findUnique({ where: { id }, include: { pinjaman: { include: { anggota: { select: { userId: true, id: true } }, angsuran: { orderBy: { angsuranKe: "asc" } } } } } });
    if (!req) throw new GalatBisnis("Pengajuan tidak ditemukan.");
    await kunciAnggota(tx, req.pinjaman.anggota.id);
    const hasil = await tx.restrukturisasi.updateMany({ where: { id, status: "DIAJUKAN" }, data: { status, diprosesOlehId: user.id, diprosesPada: new Date() } });
    if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
    if (status === "DISETUJUI") {
      const pinjaman = req.pinjaman;
      if (pinjaman.status !== "DICAIRKAN") throw new GalatBisnis("Pinjaman tidak lagi berstatus berjalan.");
      const belum = pinjaman.angsuran.filter((a) => a.status !== "LUNAS");
      if (belum.some((a) => a.status === "MENUNGGU_VERIFIKASI")) throw new GalatBisnis("Ada pembayaran yang menunggu verifikasi. Selesaikan dahulu sebelum menyetujui restrukturisasi.");
      const lunasCount = pinjaman.angsuran.length - belum.length;
      // Sisa tagihan pokok+bunga (tanpa denda) dibagi ulang; denda yang sudah berjalan tetap melekat pada barisnya.
      const pokokTerbayar = (a: (typeof belum)[number]) => Decimal.max(NOL, dec(a.terbayar).minus(dec(a.denda)));
      const sisa = belum.reduce((t, a) => t.plus(dec(a.jumlah)).minus(pokokTerbayar(a)), NOL);
      const jumlahBaru = req.tenorBaru - lunasCount;
      const jadwal = jadwalAngsuran(sisa, jumlahBaru);
      const sekarang = new Date();
      const jatuhTempo = (k: number) => { const d = new Date(sekarang); d.setMonth(d.getMonth() + k); return d; };
      for (const [i, a] of belum.entries()) {
        await tx.angsuran.update({ where: { id: a.id }, data: { jumlah: jadwal[i], tanggalJatuhTempo: jatuhTempo(i + 1), status: "BELUM", terbayar: dec(a.terbayar).minus(pokokTerbayar(a)) } });
      }
      for (let k = belum.length; k < jumlahBaru; k += 1) {
        await tx.angsuran.create({ data: { pinjamanId: pinjaman.id, angsuranKe: lunasCount + k + 1, jumlah: jadwal[k], tanggalJatuhTempo: jatuhTempo(k + 1), status: "BELUM", kodeUnik: kodeUnikAcak() } });
      }
      await tx.pinjaman.update({ where: { id: pinjaman.id }, data: { tenorBulan: req.tenorBaru } });
    }
    await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "Restrukturisasi", entitasId: id, dataLama: { status: "DIAJUKAN", tenor: req.tenorLama }, dataBaru: { status, tenor: req.tenorBaru } });
    return { userId: req.pinjaman.anggota.userId, pinjamanId: req.pinjamanId, tenorBaru: req.tenorBaru };
  });
  await buatNotifikasi({ userId: info.userId, tipe: "INFO", judul: status === "DISETUJUI" ? "Restrukturisasi disetujui" : "Restrukturisasi ditolak", pesan: status === "DISETUJUI" ? `Tenor pinjaman diperpanjang menjadi ${info.tenorBaru} bulan. Jadwal angsuran sudah diperbarui.` : "Pengajuan restrukturisasi belum dapat disetujui.", link: `/anggota/pinjaman/${info.pinjamanId}` });
  revalidatePath("/admin/restrukturisasi"); revalidatePath(`/anggota/pinjaman/${info.pinjamanId}`); revalidatePath("/admin/angsuran");
}
export async function setujuiRestrukturisasi(id: string) { return jalankan(async () => { await putuskanRestrukturisasi(id, "DISETUJUI"); return "Restrukturisasi disetujui dan jadwal angsuran diperbarui."; }); }
export async function tolakRestrukturisasi(id: string) { return jalankan(async () => { await putuskanRestrukturisasi(id, "DITOLAK"); return "Restrukturisasi ditolak."; }); }

export async function hitungShu(formData: FormData) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.shu);
    const d = shuSchema.parse(dariForm(formData));
    const dasar = await ambilDasarShu(d.tahun);
    const bagian = hitungPembagianShu({ totalShu: d.totalShu, persenJasaModal: d.persenJasaModal, persenJasaPinjaman: d.persenJasaPinjaman, modal: dasar.modal, jasa: dasar.jasa });
    await prisma.$transaction(async (tx) => {
      const lama = await tx.periodeShu.findUnique({ where: { tahun: d.tahun } });
      if (lama?.status === "DIBAGIKAN") throw new GalatBisnis(`SHU tahun ${d.tahun} sudah dibagikan dan tidak dapat dihitung ulang.`);
      const data = { totalShu: d.totalShu, persenJasaModal: d.persenJasaModal, persenJasaPinjaman: d.persenJasaPinjaman };
      const periode = lama ? await tx.periodeShu.update({ where: { id: lama.id }, data }) : await tx.periodeShu.create({ data: { tahun: d.tahun, ...data } });
      await tx.shuAnggota.deleteMany({ where: { periodeId: periode.id } });
      await tx.shuAnggota.createMany({ data: bagian.filter((b) => b.total.gt(0)).map((b) => ({ periodeId: periode.id, ...b })) });
      await catatAudit(tx, { userId: user.id, aksi: lama ? "UPDATE" : "CREATE", entitas: "PeriodeShu", entitasId: periode.id, dataLama: lama ?? undefined, dataBaru: { ...data, penerima: bagian.filter((b) => b.total.gt(0)).length } });
    });
    revalidatePath("/admin/shu");
    return `SHU ${d.tahun} dihitung untuk ${bagian.filter((b) => b.total.gt(0)).length} anggota (status DRAFT).`;
  });
}

export async function bagikanShu(periodeId: string) {
  return jalankan(async () => {
    const user = await requireRole(...AKSES.shu);
    const penerima = await prisma.$transaction(async (tx) => {
      const periode = await tx.periodeShu.findUnique({ where: { id: periodeId }, include: { anggota: true } });
      if (!periode) throw new GalatBisnis("Periode SHU tidak ditemukan.");
      const hasil = await tx.periodeShu.updateMany({ where: { id: periodeId, status: "DRAFT" }, data: { status: "DIBAGIKAN", dibagikanPada: new Date() } });
      if (hasil.count === 0) throw new GalatBisnis(SUDAH_DIPROSES);
      for (const baris of periode.anggota) {
        if (baris.total.lte(0)) continue;
        // SHU dibagikan ke simpanan sukarela anggota (tercatat sebagai Simpanan + Mutasi).
        const simpanan = await tx.simpanan.create({ data: { anggotaId: baris.anggotaId, jenis: "SUKARELA", jumlah: baris.total, keterangan: `SHU tahun ${periode.tahun}` } });
        await catatMutasi(tx, { anggotaId: baris.anggotaId, jenis: "SIMPANAN", arah: "MASUK", jumlah: baris.total, referensiId: simpanan.id, keterangan: `SHU tahun ${periode.tahun} (jasa modal ${formatRupiah(baris.jasaModal)} + jasa pinjaman ${formatRupiah(baris.jasaPinjaman)})` });
      }
      await catatAudit(tx, { userId: user.id, aksi: "UPDATE", entitas: "PeriodeShu", entitasId: periodeId, dataLama: { status: "DRAFT" }, dataBaru: { status: "DIBAGIKAN", penerima: periode.anggota.length } });
      return periode.anggota.map((a) => ({ anggotaId: a.anggotaId, total: a.total, tahun: periode.tahun }));
    });
    for (const p of penerima) {
      const userId = await userIdDariAnggota(p.anggotaId);
      if (userId) await buatNotifikasi({ userId, tipe: "INFO", judul: `SHU ${p.tahun} dibagikan`, pesan: `SHU ${p.tahun} sebesar ${formatRupiah(p.total)} sudah masuk ke simpanan sukarela Anda.`, link: "/anggota/shu" });
    }
    revalidatePath("/admin/shu"); revalidatePath("/admin/mutasi");
    return `SHU dibagikan kepada ${penerima.length} anggota.`;
  });
}
