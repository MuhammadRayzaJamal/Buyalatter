import { NextResponse } from "next/server";
import { cobaAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";

/** Salinan data pribadi anggota yang sedang login (hak akses data, UU PDP). Tanpa hash password dan tanpa berkas gambar. */
export async function GET() {
  const anggota = await cobaAnggota();
  if (!anggota) return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  const id = anggota.id;
  const [simpanan, penarikan, pinjaman, rekening, kyc, persetujuan, pengaduan, mutasi, notifikasi, shu] = await Promise.all([
    prisma.simpanan.findMany({ where: { anggotaId: id }, orderBy: { tanggal: "asc" } }),
    prisma.penarikan.findMany({ where: { anggotaId: id }, orderBy: { tanggal: "asc" } }),
    prisma.pinjaman.findMany({ where: { anggotaId: id }, include: { angsuran: { orderBy: { angsuranKe: "asc" } }, pencairan: true, akad: { select: { disetujuiPada: true, ipAddress: true } } }, orderBy: { tanggalPengajuan: "asc" } }),
    prisma.rekeningAnggota.findMany({ where: { anggotaId: id } }),
    prisma.verifikasiAnggota.findMany({ where: { anggotaId: id }, select: { pekerjaan: true, penghasilanBulanan: true, status: true, alasanTolak: true, tanggalVerifikasi: true, createdAt: true } }),
    prisma.persetujuanData.findMany({ where: { userId: anggota.userId }, orderBy: { waktu: "asc" } }),
    prisma.pengaduan.findMany({ where: { anggotaId: id }, orderBy: { createdAt: "asc" } }),
    prisma.mutasi.findMany({ where: { anggotaId: id }, orderBy: { createdAt: "asc" } }),
    prisma.notifikasi.findMany({ where: { userId: anggota.userId }, orderBy: { createdAt: "asc" } }),
    prisma.shuAnggota.findMany({ where: { anggotaId: id }, include: { periode: { select: { tahun: true, status: true } } } }),
  ]);
  const data = {
    diunduhPada: new Date(),
    catatan: "Salinan data pribadi Anda di BuyaLater. Hash password dan berkas gambar (KTP, swafoto, bukti) tidak disertakan.",
    akun: { nama: anggota.user.nama, email: anggota.user.email, dibuatPada: anggota.user.createdAt },
    anggota: { noAnggota: anggota.noAnggota, nik: anggota.nik, alamat: anggota.alamat, noHp: anggota.noHp, tanggalMasuk: anggota.tanggalMasuk, status: anggota.status, statusVerifikasi: anggota.statusVerifikasi },
    simpanan, penarikan, pinjaman, rekening, verifikasiIdentitas: kyc, persetujuanData: persetujuan, pengaduan, mutasi, notifikasi, shu,
  };
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="data-pribadi-${anggota.noAnggota}.json"`, "Cache-Control": "private, no-store" } });
}
