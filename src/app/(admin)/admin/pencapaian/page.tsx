import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { IKON_OPTIONS } from "@/lib/ikon";
import { createPencapaian, deletePencapaian, updatePencapaian } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

function PencapaianFields({ item }: { item?: Awaited<ReturnType<typeof prisma.pencapaian.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.tahun ?? new Date().getFullYear()} id={`tahun-${k}`} label="Tahun" max="2100" min="1900" name="tahun" required type="number" />
    <Select defaultValue={item?.ikon ?? "trending"} id={`ikon-${k}`} label="Ikon" name="ikon">{IKON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
    <Input className="sm:col-span-2" defaultValue={item?.judul} id={`judul-${k}`} label="Judul" name="judul" required />
    <Textarea className="sm:col-span-2" defaultValue={item?.deskripsi} id={`deskripsi-${k}`} label="Deskripsi" name="deskripsi" required />
  </>;
}

export default async function AdminPencapaianPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.pencapaian.findMany({ orderBy: { tahun: "desc" } });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola pencapaian</h1><p className="mt-2 text-sm text-slate-500">Tonggak perjalanan BuyaLater untuk timeline portofolio, diurutkan dari tahun terbaru.</p></div>
    <Card><CardHeader><CardTitle>Tambah pencapaian</CardTitle></CardHeader><CardContent><form action={createPencapaian} className="grid gap-4 sm:grid-cols-2"><PencapaianFields /><Button className="w-fit" type="submit">Tambah pencapaian</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent className="p-5">
      <p className="mb-4 text-3xl font-black text-secondary">{item.tahun}</p>
      <form action={updatePencapaian.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><PencapaianFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deletePencapaian.bind(null, item.id)} message={`Pencapaian "${item.judul}" akan dihapus permanen.`} title="Hapus pencapaian?" /></div>
    </CardContent></Card>)}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada pencapaian.</CardContent></Card>}
  </div>;
}
