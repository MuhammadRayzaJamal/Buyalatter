import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { hariTerlambat, levelTunggakan, linkWhatsApp } from "@/lib/denda";
import { getPengaturanTagihan } from "@/lib/pengaturan";
import { kirimPengingatManual } from "../actions";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HasilPengecekan, TombolPengecekan } from "@/components/admin/cek-pengecekan";
import { NOL, tambah } from "@/lib/uang";

export const dynamic = "force-dynamic";

const warna = {
  ringan: { chip: "bg-amber-100 text-amber-800", bar: "border-l-amber-400!", label: "1–7 hari" },
  tinggi: { chip: "bg-orange-100 text-orange-800", bar: "border-l-orange-500!", label: "8 hari+" },
  kritis: { chip: "bg-red-100 text-red-700", bar: "border-l-red-600!", label: "Kritis" },
} as const;

export default async function AdminTunggakanPage({ searchParams }: { searchParams: Promise<{ dicek?: string; terkirim?: string }> }) {
  await requireRole(...AKSES.tunggakan);
  await syncStatusTerlambat();
  const { dicek, terkirim } = await searchParams;
  const { batasKritis } = await getPengaturanTagihan();
  const items = await prisma.angsuran.findMany({
    where: { status: "TERLAMBAT", pinjaman: { status: "DICAIRKAN" } },
    include: { pinjaman: { include: { anggota: { include: { user: true } } } } },
    orderBy: { tanggalJatuhTempo: "asc" },
  });
  const rows = items.map((item) => ({ item, hari: hariTerlambat(item.tanggalJatuhTempo) }));
  const totalDenda = items.reduce(tambah("denda"), NOL);
  const totalTagihan = items.reduce(tambah("jumlah"), NOL).plus(totalDenda);
  const anggotaTelat = new Set(items.map((item) => item.pinjaman.anggotaId)).size;
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-green">Penagihan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Tunggakan angsuran</h1><p className="mt-2 text-sm text-slate-500">Anggota yang terlambat membayar. Denda dihitung otomatis setiap hari pukul 08.00 atau saat pengecekan dijalankan manual.</p></div><TombolPengecekan returnTo="/admin/tunggakan" /></div>
    <HasilPengecekan dicek={dicek} />
    {terkirim && <div className="rounded-xl bg-green-50 px-5 py-4 text-sm text-green-800"><strong>Pengingat terkirim</strong> ke notifikasi anggota (dan email jika Mailtrap dikonfigurasi). Lihat log di halaman Pengingat.</div>}
    <div className="grid gap-5 md:grid-cols-3">
      <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Anggota menunggak</p><p className="mt-2 text-2xl font-bold text-slate-900">{anggotaTelat}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Total denda berjalan</p><p className="mt-2 text-2xl font-bold text-red-600">{formatRupiah(totalDenda)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Total tagihan tertunggak</p><p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(totalTagihan)}</p></CardContent></Card>
    </div>
    <Card>
      <CardHeader><CardTitle>{items.length} angsuran terlambat</CardTitle><p className="mt-1 text-xs text-slate-500">Kuning 1–7 hari · oranye 8–{batasKritis} hari · merah lebih dari {batasKritis} hari</p></CardHeader>
      <CardContent className="p-0">
        {rows.length ? <div className="divide-y divide-slate-100">{rows.map(({ item, hari }) => {
          const anggota = item.pinjaman.anggota; const level = levelTunggakan(hari, batasKritis); const denda = item.denda; const jumlah = item.jumlah;
          return <div className={`flex flex-col gap-4 border-l-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${warna[level].bar}`} key={item.id}>
            <div className="min-w-0"><p className="font-bold text-slate-800">{anggota.user.nama} <span className="font-normal text-slate-400">· {anggota.noAnggota}</span></p><p className="mt-1 text-sm text-slate-500">Angsuran ke-{item.angsuranKe} · jatuh tempo {formatTanggal(item.tanggalJatuhTempo)} · {formatRupiah(jumlah)} + denda <span className="font-semibold text-red-600">{formatRupiah(denda)}</span></p></div>
            <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${warna[level].chip}`}>Terlambat {hari} hari</span><strong className="text-sm">{formatRupiah(jumlah.plus(denda))}</strong>
              <form action={kirimPengingatManual.bind(null, item.id)}><Button size="sm" type="submit" variant="outline">Kirim pengingat</Button></form>
              <Button href={linkWhatsApp(anggota.noHp, { nama: anggota.user.nama, angsuranKe: item.angsuranKe, jumlah, denda, jatuhTempo: item.tanggalJatuhTempo })} rel="noopener noreferrer" size="sm" target="_blank" variant="secondary">Kirim Pengingat WhatsApp</Button></div>
          </div>;
        })}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada tunggakan. Semua angsuran aktif dibayar tepat waktu.</p>}
      </CardContent>
    </Card>
  </div>;
}
