import Link from "next/link";
import { notFound } from "next/navigation";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { updateMember } from "../../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

export default async function EditAnggotaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...AKSES.anggotaKelola); const { id } = await params; const member = await prisma.anggota.findUnique({ where: { id }, include: { user: true } }); if (!member) notFound();
  return <div className="mx-auto max-w-3xl space-y-8"><div><Link className="text-sm font-bold text-navy hover:underline" href={`/admin/anggota/${id}`}>← Kembali ke detail</Link><h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Edit anggota</h1></div><Card><CardHeader><CardTitle>{member.user.nama}</CardTitle></CardHeader><CardContent><AksiForm aksi={updateMember.bind(null, id)} className="grid gap-4 sm:grid-cols-2"><Input defaultValue={member.user.nama} id="nama" label="Nama lengkap" name="nama" required /><Input defaultValue={member.user.email} id="email" label="Email" name="email" required type="email" /><Input defaultValue={member.nik} id="nik" label="NIK" name="nik" required /><Input defaultValue={member.noHp} id="noHp" label="Nomor HP" name="noHp" required /><Input className="sm:col-span-2" defaultValue={member.alamat} id="alamat" label="Alamat" name="alamat" required /><label className="block space-y-1.5"><span className="block text-sm font-semibold text-slate-700">Status</span><select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue={member.status} name="status"><option value="AKTIF">Aktif</option><option value="NONAKTIF">Nonaktif</option></select></label><div className="flex items-end"><TombolKirim >Simpan perubahan</TombolKirim></div></AksiForm></CardContent></Card></div>;
}