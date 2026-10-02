import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { createMember } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export default async function TambahAnggotaPage() {
  await requireRole(...AKSES.anggotaKelola);
  return <div className="mx-auto max-w-3xl space-y-8"><div><Link className="text-sm font-bold text-navy hover:underline" href="/admin/anggota">← Kembali ke anggota</Link><h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Tambah anggota</h1></div><Card><CardHeader><CardTitle>Data anggota baru</CardTitle></CardHeader><CardContent><AksiForm resetSetelahSukses aksi={createMember} className="grid gap-4 sm:grid-cols-2"><Input className="sm:col-span-2" id="nama" label="Nama lengkap" name="nama" required /><Input id="email" label="Email" name="email" required type="email" /><Input id="password" label="Password awal" minLength={8} name="password" required type="password" /><Input id="nik" label="NIK" name="nik" required /><Input id="noHp" label="Nomor HP" name="noHp" required /><Input className="sm:col-span-2" id="alamat" label="Alamat" name="alamat" required /><Input id="tanggalMasuk" label="Tanggal masuk" name="tanggalMasuk" required type="date" /><div className="flex items-end gap-3"><TombolKirim >Simpan anggota</TombolKirim><Button href="/admin/anggota" variant="outline" type="button">Batal</Button></div></AksiForm></CardContent></Card></div>;
}