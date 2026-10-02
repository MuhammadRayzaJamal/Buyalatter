import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { createMitra, deleteMitra, updateMitra } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Select, Textarea } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

function MitraFields({ item }: { item?: Awaited<ReturnType<typeof prisma.mitra.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.nama} id={`nama-${k}`} label="Nama mitra" name="nama" required />
    <Input defaultValue={item?.website ?? ""} id={`website-${k}`} label="Website" name="website" placeholder="https://contoh.co.id" type="url" />
    <Input accept="image/*" id={`file-${k}`} label={item ? "Ganti logo (opsional)" : "Unggah logo"} name="logoFile" type="file" />
    <Input defaultValue={item?.logoUrl ?? ""} id={`url-${k}`} label={item ? "Atau URL / path logo" : "Atau URL logo (wajib jika tidak unggah file)"} name="logoUrl" placeholder="https://… atau /images/mitra/logo.svg" />
    <Input defaultValue={item?.kategori ?? ""} id={`kategori-${k}`} label="Kategori" name="kategori" placeholder="Bank Penyalur Dana" />
    <Input defaultValue={item?.tahunBermitra ?? ""} id={`tahun-${k}`} label="Bermitra sejak (tahun)" max="2100" min="1900" name="tahunBermitra" step="1" type="number" />
    <Textarea className="sm:col-span-2" defaultValue={item?.deskripsi ?? ""} id={`deskripsi-${k}`} label="Deskripsi" name="deskripsi" />
    <Select defaultValue={item?.tingkat ?? "PENDUKUNG"} id={`tingkat-${k}`} label="Tingkat" name="tingkat"><option value="STRATEGIS">Strategis</option><option value="PENDUKUNG">Pendukung</option></Select>
    <Input defaultValue={item?.warnaBrand ?? ""} id={`warna-${k}`} label="Warna brand (hex)" name="warnaBrand" pattern="^#[0-9a-fA-F]{6}$" placeholder="#1A2A6C" title="Format hex, mis. #1A2A6C" />
    <Input defaultValue={item?.namaPerwakilan ?? ""} id={`perwakilan-${k}`} label="Nama perwakilan" name="namaPerwakilan" />
    <Input defaultValue={item?.jabatanPerwakilan ?? ""} id={`jabatan-${k}`} label="Jabatan perwakilan" name="jabatanPerwakilan" />
    <Textarea className="sm:col-span-2" defaultValue={item?.kutipan ?? ""} id={`kutipan-${k}`} label="Kutipan dari mitra" name="kutipan" />
    <Checkbox defaultChecked={item?.isUnggulan ?? false} id={`unggulan-${k}`} label="Mitra unggulan / sorotan (hanya satu; yang lain otomatis dilepas)" name="isUnggulan" className="sm:col-span-2" />
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
  </>;
}

export default async function AdminMitraPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.mitra.findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }] });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola mitra</h1><p className="mt-2 text-sm text-slate-500">Logo mitra dan institusi yang bekerja sama dengan BuyaLater.</p></div>
    <Card><CardHeader><CardTitle>Tambah mitra</CardTitle></CardHeader><CardContent><form action={createMitra} className="grid gap-4 sm:grid-cols-2"><MitraFields /><Button className="w-fit" type="submit">Tambah mitra</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent className="p-5">
      <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-slate-50"><PreviewImage alt={item.nama} className="max-h-16 max-w-[70%] object-contain" src={item.logoUrl} /></div>
      <div className="mb-4 flex flex-wrap gap-2"><Badge variant={item.tingkat === "STRATEGIS" ? "info" : "neutral"}>{item.tingkat === "STRATEGIS" ? "Strategis" : "Pendukung"}</Badge>{item.isUnggulan && <Badge variant="warning">Sorotan</Badge>}{item.warnaBrand && <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><span className="h-3 w-3 rounded-full ring-1 ring-slate-200" style={{ background: item.warnaBrand }} />{item.warnaBrand}</span>}</div>
      <form action={updateMitra.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><MitraFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deleteMitra.bind(null, item.id)} message={`Mitra "${item.nama}" akan dihapus permanen.`} title="Hapus mitra?" /></div>
    </CardContent></Card>)}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada mitra.</CardContent></Card>}
  </div>;
}
