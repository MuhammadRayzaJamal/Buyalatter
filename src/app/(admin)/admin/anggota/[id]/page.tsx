import Link from "next/link";
import { notFound } from "next/navigation";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal, initials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOL, tambah } from "@/lib/uang";

export const dynamic = "force-dynamic";

const verifikasiVariant = { PENDING: "warning", TERVERIFIKASI: "success", DITOLAK: "danger" } as const;
const verifikasiLabel = { PENDING: "Menunggu verifikasi", TERVERIFIKASI: "Terverifikasi", DITOLAK: "Ditolak" } as const;

export default async function DetailAnggotaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...AKSES.anggota); const { id } = await params; const member = await prisma.anggota.findUnique({ where: { id }, include: { user: true, simpanan: true, pinjaman: true } }); if (!member) notFound();
  return <div className="space-y-8"><div className="flex items-end justify-between"><div><Link className="text-sm font-bold text-navy hover:underline" href="/admin/anggota">← Kembali ke anggota</Link><div className="mt-4 flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-navy">{initials(member.user.nama)}</span><div><h1 className="text-3xl font-bold tracking-tight text-slate-900">{member.user.nama}</h1><p className="mt-1 text-sm text-slate-500">{member.noAnggota} · {member.user.email}</p></div></div></div><Button href={`/admin/anggota/${id}/edit`} variant="outline">Edit profil</Button></div><div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Informasi pribadi</CardTitle></CardHeader><CardContent className="grid gap-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-400">NIK</p><p className="mt-1 font-semibold">{member.nik}</p></div><div><p className="text-xs text-slate-400">No. HP</p><p className="mt-1 font-semibold">{member.noHp}</p></div><div className="sm:col-span-2"><p className="text-xs text-slate-400">Alamat</p><p className="mt-1 font-semibold">{member.alamat}</p></div><div><p className="text-xs text-slate-400">Tanggal masuk</p><p className="mt-1 font-semibold">{formatTanggal(member.tanggalMasuk)}</p></div><div><p className="text-xs text-slate-400">Status</p><p className="mt-1"><Badge variant={member.status === "AKTIF" ? "success" : "neutral"}>{member.status}</Badge></p></div><div><p className="text-xs text-slate-400">Verifikasi KTP</p><p className="mt-1"><Badge variant={verifikasiVariant[member.statusVerifikasi]}>{verifikasiLabel[member.statusVerifikasi]}</Badge></p></div></CardContent></Card><Card><CardHeader><CardTitle>Ringkasan transaksi</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Total simpanan</span><strong>{formatRupiah(member.simpanan.reduce(tambah("jumlah"), NOL))}</strong></div><div className="flex justify-between"><span className="text-slate-500">Jumlah pinjaman</span><strong>{member.pinjaman.length}</strong></div><div className="flex justify-between"><span className="text-slate-500">Pinjaman aktif</span><strong>{member.pinjaman.filter((item) => item.status === "DISETUJUI").length}</strong></div></CardContent></Card></div><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Dokumen KTP</CardTitle>{member.statusVerifikasi === "PENDING" && <Link className="text-xs font-bold text-navy hover:underline" href="/admin/verifikasi">Verifikasi sekarang →</Link>}</div></CardHeader><CardContent>{member.fotoKtp ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={`Foto KTP ${member.user.nama}`} className="h-64 w-full max-w-md rounded-lg border object-cover" src={member.fotoKtp ?? ""} />
  ) : <p className="text-sm text-slate-500">Anggota ini belum mengunggah foto KTP.</p>}{member.catatanVerifikasi && <p className="mt-4 text-sm text-slate-500">Catatan verifikasi: {member.catatanVerifikasi}</p>}</CardContent></Card></div>;
}