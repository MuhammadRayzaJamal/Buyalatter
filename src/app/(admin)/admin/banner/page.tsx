import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { statusBanner } from "@/lib/banner";
import { createBanner, deleteBanner, updateBanner } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Checkbox, Select } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

const status = { tayang: { variant: "success", text: "Tayang" }, terjadwal: { variant: "info", text: "Terjadwal" }, berakhir: { variant: "neutral", text: "Berakhir" }, nonaktif: { variant: "warning", text: "Nonaktif" } } as const;
const tgl = (date: Date | null) => (date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");

function BannerFields({ item }: { item?: Awaited<ReturnType<typeof prisma.banner.findMany>>[number] }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.judul} id={`judul-${k}`} label="Judul" name="judul" required />
    <Input defaultValue={item?.subjudul ?? ""} id={`subjudul-${k}`} label="Subjudul" name="subjudul" />
    <Input accept="image/*" id={`file-${k}`} label={item ? "Ganti gambar (opsional)" : "Unggah gambar"} name="gambarFile" type="file" />
    <Input defaultValue={item?.gambarUrl ?? ""} id={`url-${k}`} label={item ? "Atau URL gambar" : "Atau URL gambar (wajib jika tidak unggah file)"} name="gambarUrl" placeholder="https://picsum.photos/seed/banner/1600/600" type="url" />
    <Input defaultValue={item?.linkTujuan ?? ""} id={`link-${k}`} label="Link tujuan" name="linkTujuan" placeholder="/register" />
    <Input defaultValue={item?.teksTombol ?? ""} id={`tombol-${k}`} label="Teks tombol" name="teksTombol" placeholder="Daftar Sekarang" />
    <Select defaultValue={item?.posisi ?? "HERO"} id={`posisi-${k}`} label="Posisi" name="posisi"><option value="HERO">Hero (beranda)</option><option value="FOOTER">Footer</option><option value="SIDEBAR">Sidebar</option></Select>
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
    <Input defaultValue={tgl(item?.tanggalMulai ?? null)} id={`mulai-${k}`} label="Tanggal mulai (kosong = langsung)" name="tanggalMulai" type="date" />
    <Input defaultValue={tgl(item?.tanggalSelesai ?? null)} id={`selesai-${k}`} label="Tanggal selesai (kosong = tanpa batas)" name="tanggalSelesai" type="date" />
    <Checkbox defaultChecked={item?.isAktif ?? true} id={`aktif-${k}`} label="Aktif" name="isAktif" />
  </>;
}

export default async function AdminBannerPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.banner.findMany({ orderBy: [{ posisi: "asc" }, { urutan: "asc" }] });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Kelola banner</h1><p className="mt-2 text-sm text-slate-500">Banner tampil di situs hanya jika aktif dan hari ini berada di antara tanggal mulai dan selesai.</p></div>
    <Card><CardHeader><CardTitle>Tambah banner</CardTitle></CardHeader><CardContent><form action={createBanner} className="grid gap-4 sm:grid-cols-2"><BannerFields /><Button className="w-fit" type="submit">Tambah banner</Button></form></CardContent></Card>
    {items.length ? <div className="grid gap-5 lg:grid-cols-2">{items.map((item) => { const st = status[statusBanner(item)]; return <Card key={item.id}><CardContent className="p-5">
      <PreviewImage alt={item.judul} className="mb-4 aspect-[8/3] w-full rounded-lg object-cover" src={item.gambarUrl} />
      <div className="mb-4 flex items-center gap-2"><Badge variant={st.variant}>{st.text}</Badge><Badge>{item.posisi}</Badge></div>
      <form action={updateBanner.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><BannerFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form>
      <div className="mt-3"><DeleteForm action={deleteBanner.bind(null, item.id)} message={`Banner "${item.judul}" akan dihapus permanen.`} title="Hapus banner?" /></div>
    </CardContent></Card>; })}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada banner.</CardContent></Card>}
  </div>;
}
