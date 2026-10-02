import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { IKON_OPTIONS } from "@/lib/ikon";
import { createPenghargaan, deletePenghargaan, updatePenghargaan } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

function Fields({ item }: { item?: Awaited<ReturnType<typeof prisma.penghargaan.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input className="sm:col-span-2" defaultValue={item?.judul} id={`judul-${k}`} label="Judul penghargaan" name="judul" required />
    <Input defaultValue={item?.pemberi} id={`pemberi-${k}`} label="Pemberi" name="pemberi" required />
    <Input defaultValue={item?.tahun ?? new Date().getFullYear()} id={`tahun-${k}`} label="Tahun" max="2100" min="1900" name="tahun" required type="number" />
    <Select defaultValue={item?.ikon ?? "award"} id={`ikon-${k}`} label="Ikon" name="ikon">{IKON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
    <Textarea className="sm:col-span-2" defaultValue={item?.deskripsi ?? ""} id={`deskripsi-${k}`} label="Deskripsi (opsional)" name="deskripsi" />
  </>;
}

export default async function AdminPenghargaanPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.penghargaan.findMany({ orderBy: [{ urutan: "asc" }, { tahun: "desc" }] });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola penghargaan</h1><p className="mt-2 text-sm text-slate-500">Penghargaan ditampilkan di halaman Tentang Kami, diurutkan menurut nomor urutan.</p></div>
    <Card><CardHeader><CardTitle>Tambah penghargaan</CardTitle></CardHeader><CardContent><form action={createPenghargaan} className="grid gap-4 sm:grid-cols-2"><Fields /><Button className="w-fit" type="submit">Tambah penghargaan</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent className="p-5">
      <div className="mb-4 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><DynamicIcon name={item.ikon} /></span><div><p className="font-bold text-slate-800">{item.judul}</p><p className="text-xs text-slate-500">{item.pemberi} · {item.tahun}</p></div></div>
      <form action={updatePenghargaan.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><Fields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deletePenghargaan.bind(null, item.id)} message={`Penghargaan "${item.judul}" akan dihapus permanen.`} title="Hapus penghargaan?" /></div>
    </CardContent></Card>)}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada penghargaan.</CardContent></Card>}
  </div>;
}
