/* eslint-disable @next/next/no-img-element -- KTP photo is served from an authenticated API route, not a static/public asset next/image can optimize */
import { samarkanNik } from "@/lib/nik";
import { requireAnggota } from "@/lib/otorisasi";
import { formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, KtpForm } from "@/components/member/member-forms";
import { PrivasiAkun } from "@/components/member/privasi-akun";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const verifikasiVariant = { PENDING: "warning", TERVERIFIKASI: "success", DITOLAK: "danger" } as const;
const verifikasiLabel = { PENDING: "Menunggu verifikasi", TERVERIFIKASI: "Terverifikasi", DITOLAK: "Ditolak" } as const;

export default async function ProfilPage() {
  const anggota = await requireAnggota();
  const [persetujuan, belumSelesai] = await Promise.all([
    prisma.persetujuanData.findMany({ where: { userId: anggota.userId }, orderBy: { waktu: "desc" } }),
    prisma.pinjaman.count({ where: { anggotaId: anggota.id, status: { in: ["DIAJUKAN", "DISETUJUI", "DICAIRKAN"] } } }),
  ]);
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Akun saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Profil anggota</h1><p className="mt-2 text-sm text-slate-500">Perbarui informasi kontak yang digunakan koperasi.</p></div><div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"><div className="space-y-5"><Card><CardHeader><CardTitle>Informasi keanggotaan</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="text-xs text-slate-400">Nomor anggota</p><p className="mt-1 font-bold text-slate-800">{anggota.noAnggota}</p></div><div><p className="text-xs text-slate-400">NIK</p><p className="mt-1 font-bold text-slate-800">{samarkanNik(anggota.nik)}</p></div><div><p className="text-xs text-slate-400">Tanggal masuk</p><p className="mt-1 font-bold text-slate-800">{formatTanggal(anggota.tanggalMasuk)}</p></div><div><p className="text-xs text-slate-400">Status keanggotaan</p><p className="mt-1 font-bold text-green-700">{anggota.status}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Verifikasi KTP</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="text-xs text-slate-400">Status verifikasi</p><p className="mt-1.5"><Badge variant={verifikasiVariant[anggota.statusVerifikasi]}>{verifikasiLabel[anggota.statusVerifikasi]}</Badge></p></div>{anggota.statusVerifikasi === "DITOLAK" && anggota.catatanVerifikasi && <div className="rounded-lg bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">Alasan penolakan: {anggota.catatanVerifikasi} Unggah ulang foto KTP yang jelas di bawah ini.</div>}{anggota.fotoKtp && <img alt="Foto KTP" className="h-40 w-full rounded-lg border object-cover" src={`/api/anggota/${anggota.id}/ktp`} />}<KtpForm needsReupload={anggota.statusVerifikasi === "DITOLAK"} /></CardContent></Card></div><Card><CardHeader><CardTitle>Edit informasi profil</CardTitle></CardHeader><CardContent><ProfileForm profile={{ nama: anggota.user.nama, email: anggota.user.email, noHp: anggota.noHp, alamat: anggota.alamat, foto: anggota.foto }} /></CardContent></Card></div><PrivasiAkun persetujuan={persetujuan} pinjamanBelumSelesai={belumSelesai} /></div>;
}
