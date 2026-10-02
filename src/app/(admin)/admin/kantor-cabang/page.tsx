import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { createKantor, deleteKantor, updateKantor } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

function Fields({ item }: { item?: Awaited<ReturnType<typeof prisma.kantorCabang.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.nama} id={`nama-${k}`} label="Nama kantor" name="nama" required />
    <Input defaultValue={item?.kota} id={`kota-${k}`} label="Kota" name="kota" required />
    <Input className="sm:col-span-2" defaultValue={item?.alamat} id={`alamat-${k}`} label="Alamat" name="alamat" required />
    <Input defaultValue={item?.telepon ?? ""} id={`telepon-${k}`} label="Telepon" name="telepon" />
    <Input defaultValue={item?.jamOperasional ?? ""} id={`jam-${k}`} label="Jam operasional" name="jamOperasional" placeholder="Senin–Jumat, 08.00–16.00 WIB" />
    <Input defaultValue={item ? Number(item.latitude) : ""} id={`lat-${k}`} inputMode="decimal" label="Latitude" name="latitude" placeholder="-6.9175" required />
    <Input defaultValue={item ? Number(item.longitude) : ""} id={`lng-${k}`} inputMode="decimal" label="Longitude" name="longitude" placeholder="107.6191" required />
    <Checkbox className="sm:col-span-2" defaultChecked={item?.isPusat ?? false} id={`pusat-${k}`} label="Kantor pusat (hanya satu; yang lain otomatis dilepas)" name="isPusat" />
  </>;
}

export default async function AdminKantorCabangPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.kantorCabang.findMany({ orderBy: [{ isPusat: "desc" }, { nama: "asc" }] });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola kantor cabang</h1><p className="mt-2 text-sm text-slate-500">Ditampilkan di halaman Kantor Cabang beserta peta OpenStreetMap. Cari koordinat di openstreetmap.org (klik kanan pada peta → &ldquo;Show address&rdquo;).</p></div>
    <Card><CardHeader><CardTitle>Tambah kantor</CardTitle></CardHeader><CardContent><form action={createKantor} className="grid gap-4 sm:grid-cols-2"><Fields /><Button className="w-fit" type="submit">Tambah kantor</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardContent className="p-5">
      <div className="mb-4 flex items-center gap-2"><p className="font-bold text-slate-800">{item.nama}</p>{item.isPusat && <Badge variant="info">Kantor pusat</Badge>}</div>
      <form action={updateKantor.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><Fields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deleteKantor.bind(null, item.id)} message={`Kantor "${item.nama}" akan dihapus permanen.`} title="Hapus kantor?" /></div>
    </CardContent></Card>)}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada kantor cabang.</CardContent></Card>}
  </div>;
}
