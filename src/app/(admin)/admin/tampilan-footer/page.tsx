import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { IKON_OPTIONS } from "@/lib/ikon";
import { KOLOM_LABEL, PLATFORM_LABEL } from "@/lib/situs";
import { createMediaSosial, createMenuFooter, createMetodePembayaran, deleteMediaSosial, deleteMenuFooter, deleteMetodePembayaran, updateMediaSosial, updateMenuFooter, updateMetodePembayaran, updateSitus } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Input } from "@/components/ui/input";
import { Checkbox, Select, Textarea } from "@/components/admin/form-fields";

export const dynamic = "force-dynamic";

type Menu = Awaited<ReturnType<typeof prisma.menuFooter.findMany>>[number];
type Sosial = Awaited<ReturnType<typeof prisma.mediaSosial.findMany>>[number];
type Metode = Awaited<ReturnType<typeof prisma.metodePembayaran.findMany>>[number];

function MenuFields({ item }: { item?: Menu }) {
  const k = item?.id ?? "baru";
  return <>
    <Select defaultValue={item?.kolom ?? "LAYANAN"} id={`kolom-${k}`} label="Kolom" name="kolom">{Object.entries(KOLOM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
    <Input defaultValue={item?.label} id={`label-${k}`} label="Label" name="label" required />
    <Input defaultValue={item?.href} id={`href-${k}`} label="Link" name="href" placeholder="/tentang atau https://…" required />
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
  </>;
}
function SosialFields({ item }: { item?: Sosial }) {
  const k = item?.id ?? "baru";
  return <>
    <Select defaultValue={item?.platform ?? "INSTAGRAM"} id={`platform-${k}`} label="Platform" name="platform">{Object.entries(PLATFORM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
    <Input defaultValue={item?.url} id={`url-${k}`} label="URL" name="url" placeholder="https://instagram.com/akun" required type="url" />
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
    <Checkbox defaultChecked={item?.isAktif ?? true} id={`aktif-${k}`} label="Aktif (tampil di footer)" name="isAktif" />
  </>;
}
function MetodeFields({ item }: { item?: Metode }) {
  const k = item?.id ?? "baru";
  return <>
    <Input defaultValue={item?.nama} id={`nama-${k}`} label="Nama metode" name="nama" required />
    <Select defaultValue={item?.ikon ?? "bank"} id={`ikon-${k}`} label="Ikon" name="ikon">{IKON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
    <Input defaultValue={item?.urutan ?? 0} id={`urutan-${k}`} label="Urutan" name="urutan" step="1" type="number" />
  </>;
}

export default async function AdminTampilanFooterPage() {
  await requireRole(...AKSES.konten);
  const [situs, menu, sosial, metode] = await Promise.all([
    prisma.pengaturan.findFirst(),
    prisma.menuFooter.findMany({ orderBy: [{ kolom: "asc" }, { urutan: "asc" }] }),
    prisma.mediaSosial.findMany({ orderBy: { urutan: "asc" } }),
    prisma.metodePembayaran.findMany({ orderBy: { urutan: "asc" } }),
  ]);
  return <div className="space-y-10">
    <div><p className="text-sm font-semibold text-green">Konten publik</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Tampilan footer</h1><p className="mt-2 text-sm text-slate-500">Kelola identitas, kontak, menu, media sosial, dan metode pembayaran yang tampil di footer seluruh halaman publik.</p></div>

    <Card><CardHeader><CardTitle>Identitas &amp; kontak</CardTitle></CardHeader><CardContent><form action={updateSitus} className="grid gap-4 sm:grid-cols-2">
      <Input defaultValue={situs?.namaInstansi ?? "BuyaLater"} id="namaInstansi" label="Nama instansi" name="namaInstansi" required />
      <Input defaultValue={situs?.emailCs ?? ""} id="emailCs" label="Email CS" name="emailCs" placeholder="halo@buyalater.id" type="email" />
      <Input defaultValue={situs?.teleponCs ?? ""} id="teleponCs" label="Telepon CS" name="teleponCs" placeholder="(021) 1234-5678" />
      <Input defaultValue={situs?.whatsappCs ?? ""} id="whatsappCs" label="WhatsApp CS" name="whatsappCs" placeholder="0812-3456-7890" />
      <Input className="sm:col-span-2" defaultValue={situs?.alamatPusat ?? ""} id="alamatPusat" label="Alamat pusat" name="alamatPusat" />
      <Textarea className="sm:col-span-2" defaultValue={situs?.deskripsiFooter ?? ""} id="deskripsiFooter" label="Deskripsi footer" name="deskripsiFooter" />
      <Button className="w-fit" type="submit">Simpan identitas</Button>
    </form><p className="mt-3 text-xs text-slate-400">Kolom yang dikosongkan memakai nilai bawaan. Jam operasional diambil dari kantor pusat di Kantor Cabang.</p></CardContent></Card>

    <section className="space-y-4"><h2 className="text-xl font-bold text-slate-900">Menu footer</h2>
      <Card><CardHeader><CardTitle>Tambah menu</CardTitle></CardHeader><CardContent><form action={createMenuFooter} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MenuFields /><Button className="w-fit" type="submit">Tambah menu</Button></form></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">{menu.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="mb-3"><Badge variant="info">{KOLOM_LABEL[item.kolom]}</Badge></div><form action={updateMenuFooter.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><MenuFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form><div className="mt-3"><DeleteForm action={deleteMenuFooter.bind(null, item.id)} message={`Menu "${item.label}" akan dihapus dari footer.`} title="Hapus menu?" /></div></CardContent></Card>)}</div>
      {!menu.length && <p className="text-sm text-slate-500">Belum ada menu; footer memakai tautan kosong.</p>}
    </section>

    <section className="space-y-4"><h2 className="text-xl font-bold text-slate-900">Media sosial</h2>
      <Card><CardHeader><CardTitle>Tambah media sosial</CardTitle></CardHeader><CardContent><form action={createMediaSosial} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SosialFields /><Button className="w-fit" type="submit">Tambah</Button></form></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">{sosial.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="mb-3 flex gap-2"><Badge>{PLATFORM_LABEL[item.platform]}</Badge>{!item.isAktif && <Badge variant="warning">Nonaktif</Badge>}</div><form action={updateMediaSosial.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2"><SosialFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form><div className="mt-3"><DeleteForm action={deleteMediaSosial.bind(null, item.id)} message={`Tautan ${PLATFORM_LABEL[item.platform]} akan dihapus.`} title="Hapus media sosial?" /></div></CardContent></Card>)}</div>
    </section>

    <section className="space-y-4"><h2 className="text-xl font-bold text-slate-900">Metode pembayaran</h2>
      <Card><CardHeader><CardTitle>Tambah metode pembayaran</CardTitle></CardHeader><CardContent><form action={createMetodePembayaran} className="grid gap-4 sm:grid-cols-3"><MetodeFields /><Button className="w-fit" type="submit">Tambah</Button></form></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">{metode.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-secondary"><DynamicIcon name={item.ikon} /></span>{item.nama}</div><form action={updateMetodePembayaran.bind(null, item.id)} className="grid gap-3 sm:grid-cols-3"><MetodeFields item={item} /><Button className="w-fit" size="sm" type="submit">Simpan</Button></form><div className="mt-3"><DeleteForm action={deleteMetodePembayaran.bind(null, item.id)} message={`Metode "${item.nama}" akan dihapus.`} title="Hapus metode pembayaran?" /></div></CardContent></Card>)}</div>
    </section>
  </div>;
}
