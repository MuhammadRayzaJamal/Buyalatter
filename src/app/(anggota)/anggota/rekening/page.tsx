import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { createRekening, deleteRekening, updateRekening, setRekeningUtama } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

export default async function RekeningAnggotaPage() {
  const anggota = await requireAnggota();
  const [rekening, terkunci] = await Promise.all([prisma.rekeningAnggota.findMany({ where: { anggotaId: anggota.id }, orderBy: { createdAt: "asc" } }), prisma.pinjaman.count({ where: { anggotaId: anggota.id, status: "DISETUJUI" } })]);

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keuangan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Rekening bank</h1><p className="mt-2 text-sm text-slate-500">Kelola rekening tujuan pencairan pinjaman. Nama pemilik harus sama dengan nama Anda, dan setiap perubahan meminta password serta dikirim sebagai notifikasi + email.</p></div>

    {terkunci > 0 && <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-800"><strong>Rekening terkunci.</strong> Ada pinjaman yang sudah disetujui dan menunggu pencairan; rekening tidak dapat ditambah, diubah, atau dihapus sampai dana dicairkan.</CardContent></Card>}

    <Card>
      <CardHeader><CardTitle>Tambah rekening</CardTitle></CardHeader>
      <CardContent>
        <AksiForm aksi={createRekening} className="grid gap-4 sm:grid-cols-3">
          <Input id="namaBank" label="Nama bank" name="namaBank" placeholder="Contoh: BCA" required />
          <Input id="noRekening" label="Nomor rekening" name="noRekening" required />
          <Input defaultValue={anggota.user.nama} id="atasNama" label="Atas nama (sama dengan nama anggota)" name="atasNama" required />
          <Input autoComplete="current-password" className="sm:col-span-3" id="passwordTambah" label="Password Anda (konfirmasi)" name="password" required type="password" />
          <TombolKirim className="w-fit sm:col-span-3" disabled={terkunci > 0}>Tambah rekening</TombolKirim>
        </AksiForm>
      </CardContent>
    </Card>

    {rekening.length ? <div className="grid gap-5 md:grid-cols-2">{rekening.map((item) => (
      <Card key={item.id}>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900">{item.namaBank}</h2>
            {item.isUtama && <Badge variant="success">Utama</Badge>}
          </div>
          <AksiForm aksi={updateRekening.bind(null, item.id)} className="space-y-3">
            <Input defaultValue={item.namaBank} id={`namaBank-${item.id}`} label="Nama bank" name="namaBank" required />
            <Input defaultValue={item.noRekening} id={`noRekening-${item.id}`} label="Nomor rekening" name="noRekening" required />
            <Input defaultValue={item.atasNama} id={`atasNama-${item.id}`} label="Atas nama" name="atasNama" required />
            <Input autoComplete="current-password" id={`password-${item.id}`} label="Password Anda (konfirmasi)" name="password" required type="password" />
            <TombolKirim disabled={terkunci > 0} size="sm">Simpan</TombolKirim>
          </AksiForm>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!item.isUtama && <AksiForm aksi={setRekeningUtama.bind(null, item.id)} className="flex flex-wrap items-center gap-2"><input aria-label="Password Anda" autoComplete="current-password" className="h-9 w-40 rounded-[10px] border border-slate-200 px-3 text-xs" name="password" placeholder="Password Anda" required type="password" /><TombolKirim disabled={terkunci > 0} size="sm" variant="outline">Jadikan utama</TombolKirim></AksiForm>}
            <DeleteForm action={deleteRekening.bind(null, item.id)} message={`Rekening ${item.namaBank} - ${item.noRekening} akan dihapus.`} title="Hapus rekening?" />
          </div>
        </CardContent>
      </Card>
    ))}</div> : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada rekening. Tambahkan rekening untuk dapat mengajukan pinjaman.</CardContent></Card>}
  </div>;
}
