import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { createTestimoni, deleteTestimoni, updateTestimoni } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Checkbox, Select, Textarea } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

function TestimoniFields({ item }: { item?: Awaited<ReturnType<typeof prisma.testimoni.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.nama} id={`nama-${k}`} label="Nama" name="nama" required />
    <Input defaultValue={item?.pekerjaan ?? ""} id={`pekerjaan-${k}`} label="Pekerjaan" name="pekerjaan" />
    <Input defaultValue={item?.kota ?? ""} id={`kota-${k}`} label="Kota" name="kota" />
    <Select defaultValue={String(item?.rating ?? 5)} id={`rating-${k}`} label="Rating" name="rating">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}</Select>
    <Input accept="image/*" id={`file-${k}`} label={item ? "Ganti foto (opsional)" : "Unggah foto (opsional)"} name="fotoFile" type="file" />
    <Input defaultValue={item?.fotoUrl ?? ""} id={`url-${k}`} label="Atau URL foto" name="fotoUrl" type="url" />
    <Textarea className="sm:col-span-2" defaultValue={item?.isi} id={`isi-${k}`} label="Isi testimoni" name="isi" required />
    <Checkbox defaultChecked={item?.isTampil ?? true} id={`tampil-${k}`} label="Tampilkan di situs" name="isTampil" />
  </>;
}

export default async function AdminTestimoniPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.testimoni.findMany({ orderBy: { nama: "asc" } });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola testimoni</h1><p className="mt-2 text-sm text-slate-500">Kesan anggota tentang BuyaLater. Hanya yang bertanda &ldquo;Tampilkan&rdquo; yang muncul di situs.</p></div>
    <Card><CardHeader><CardTitle>Tambah testimoni</CardTitle></CardHeader><CardContent><form action={createTestimoni} className="grid gap-4 sm:grid-cols-2"><TestimoniFields /><Button className="w-fit" type="submit">Tambah testimoni</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent className="p-5">
      <div className="mb-4 flex items-center gap-3">{item.fotoUrl ? <PreviewImage alt={item.nama} className="h-12 w-12 rounded-full object-cover" src={item.fotoUrl} /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-secondary">{item.nama.slice(0, 1)}</span>}<div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{item.nama}</p><p className="text-xs text-amber-500">{"★".repeat(item.rating)}<span className="text-slate-300">{"★".repeat(5 - item.rating)}</span></p></div><Badge variant={item.isTampil ? "success" : "neutral"}>{item.isTampil ? "Tampil" : "Disembunyikan"}</Badge></div>
      <form action={updateTestimoni.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><TestimoniFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deleteTestimoni.bind(null, item.id)} message={`Testimoni dari "${item.nama}" akan dihapus permanen.`} title="Hapus testimoni?" /></div>
    </CardContent></Card>)}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada testimoni.</CardContent></Card>}
  </div>;
}
