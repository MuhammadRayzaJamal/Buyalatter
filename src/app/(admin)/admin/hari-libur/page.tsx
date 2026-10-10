import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { hapusHariLibur, tambahHariLibur } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { DeleteForm } from "@/components/ui/delete-form";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hari Libur" };

export default async function HariLiburPage() {
  await requireRole(...AKSES.hariLibur);
  const daftar = await prisma.hariLibur.findMany({ orderBy: { tanggal: "asc" } });
  const format = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const perTahun = Object.entries(Object.groupBy(daftar, (h) => h.tanggal.getUTCFullYear())).sort(([a], [b]) => Number(b) - Number(a));
  return <div className="mx-auto max-w-3xl space-y-8">
    <div><p className="text-sm font-semibold text-green">Penagihan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Hari libur nasional</h1><p className="mt-2 text-sm text-slate-500">Pada hari-hari ini pengingat dan penagihan tidak dikirim, dan hari ini tidak dihitung sebagai hari kerja untuk target tanggapan pengaduan. Periksa daftar terhadap SKB 3 Menteri terbaru.</p></div>
    <Card><CardHeader><CardTitle>Tambah hari libur</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={tambahHariLibur} className="grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end" resetSetelahSukses>
        <Input id="tanggal" label="Tanggal" name="tanggal" required type="date" />
        <Input id="keterangan" label="Keterangan" name="keterangan" placeholder="Contoh: Hari Raya Idul Fitri" required />
        <TombolKirim>Tambah</TombolKirim>
      </AksiForm>
    </CardContent></Card>
    {perTahun.length ? perTahun.map(([tahun, hari]) => <Card key={tahun}><CardHeader><CardTitle>{tahun} · {hari?.length} hari</CardTitle></CardHeader><CardContent className="p-0"><ul className="divide-y divide-slate-100">{hari?.map((h) => <li className="flex items-center justify-between gap-4 px-5 py-3 text-sm" key={h.id}><span><strong className="text-slate-800">{h.keterangan}</strong><span className="ml-2 text-slate-500">{format.format(h.tanggal)}</span></span><DeleteForm action={hapusHariLibur.bind(null, h.id)} compact message={`${h.keterangan} akan dihapus dari daftar hari libur.`} title="Hapus hari libur?" /></li>)}</ul></CardContent></Card>) : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada hari libur.</CardContent></Card>}
  </div>;
}
