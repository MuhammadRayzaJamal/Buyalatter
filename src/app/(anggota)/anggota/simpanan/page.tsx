import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { NOL, tambah } from "@/lib/uang";

export const dynamic = "force-dynamic";

export default async function SimpananAnggotaPage() {
  const anggota = await requireAnggota();
  const data = await prisma.simpanan.findMany({ where: { anggotaId: anggota.id }, orderBy: { tanggal: "desc" } });
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Keuangan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Riwayat simpanan</h1><p className="mt-2 text-sm text-slate-500">Pantau setoran simpanan berdasarkan jenisnya.</p></div><div className="grid gap-5 md:grid-cols-3">{["POKOK", "WAJIB", "SUKARELA"].map((jenis) => <Card className="p-5" key={jenis}><p className="text-sm text-slate-500">Simpanan {jenis.toLowerCase()}</p><p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(data.filter((item) => item.jenis === jenis).reduce(tambah("jumlah"), NOL))}</p></Card>)}</div><Card><CardHeader><CardTitle>Semua transaksi simpanan</CardTitle></CardHeader><CardContent className="p-0"><Table columns={[{ key: "tanggal", label: "Tanggal", render: (row) => formatTanggal(row.tanggal) }, { key: "jenis", label: "Jenis", render: (row) => <Badge variant={row.jenis === "SUKARELA" ? "info" : "success"}>{row.jenis}</Badge> }, { key: "jumlah", label: "Jumlah", render: (row) => <strong>{formatRupiah(row.jumlah)}</strong> }, { key: "keterangan", label: "Keterangan" }]} rows={data.map((item) => ({ ...item, id: item.id }))} /></CardContent></Card></div>;
}