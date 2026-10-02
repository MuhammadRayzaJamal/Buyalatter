import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { createRekeningKoperasi, deleteRekeningKoperasi, updateRekeningKoperasi } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function AdminRekeningKoperasiPage() {
  await requireRole(...AKSES.konten);
  const items = await prisma.rekeningKoperasi.findMany({ orderBy: { namaBank: "asc" } });

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Konfigurasi sistem</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Rekening koperasi</h1><p className="mt-2 text-sm text-slate-500">Kelola rekening tujuan pembayaran angsuran anggota.</p></div>

    <Card>
      <CardHeader><CardTitle>Tambah rekening</CardTitle></CardHeader>
      <CardContent>
        <form action={createRekeningKoperasi} className="grid gap-4 sm:grid-cols-3">
          <Input id="namaBank" label="Nama bank" name="namaBank" placeholder="Contoh: BCA" required />
          <Input id="noRekening" label="Nomor rekening" name="noRekening" required />
          <Input id="atasNama" label="Atas nama" name="atasNama" placeholder="Koperasi BuyaLater" required />
          <Button className="w-fit sm:col-span-3" type="submit">Tambah rekening</Button>
        </form>
      </CardContent>
    </Card>

    {items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((item) => (
      <Card key={item.id}>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900">{item.namaBank}</h2>
            <Badge variant={item.isAktif ? "success" : "neutral"}>{item.isAktif ? "Aktif" : "Nonaktif"}</Badge>
          </div>
          <form action={updateRekeningKoperasi.bind(null, item.id)} className="space-y-3">
            <Input defaultValue={item.namaBank} id={`namaBank-${item.id}`} label="Nama bank" name="namaBank" required />
            <Input defaultValue={item.noRekening} id={`noRekening-${item.id}`} label="Nomor rekening" name="noRekening" required />
            <Input defaultValue={item.atasNama} id={`atasNama-${item.id}`} label="Atas nama" name="atasNama" required />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input defaultChecked={item.isAktif} name="isAktif" type="checkbox" /> Aktif</label>
            <Button size="sm" type="submit">Simpan</Button>
          </form>
          <DeleteForm action={deleteRekeningKoperasi.bind(null, item.id)} message={`Rekening ${item.namaBank} - ${item.noRekening} akan dihapus.`} title="Hapus rekening koperasi?" />
        </CardContent>
      </Card>
    ))}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada rekening koperasi.</CardContent></Card>}
  </div>;
}
