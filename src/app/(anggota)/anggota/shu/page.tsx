import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata = { title: "SHU Saya" };

export default async function ShuAnggotaPage() {
  const anggota = await requireAnggota();
  // Hanya SHU milik anggota ini dan hanya periode yang sudah dibagikan.
  const rows = await prisma.shuAnggota.findMany({ where: { anggotaId: anggota.id, periode: { status: "DIBAGIKAN" } }, include: { periode: true }, orderBy: { periode: { tahun: "desc" } } });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keuangan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Sisa Hasil Usaha (SHU)</h1><p className="mt-2 text-sm text-slate-500">SHU dibagikan ke simpanan sukarela Anda. Jasa modal dihitung dari saldo simpanan, jasa pinjaman dari bunga yang Anda bayar.</p></div>
    <Card><CardHeader><CardTitle>{rows.length} periode</CardTitle></CardHeader><CardContent className="p-0"><Table emptyMessage="Belum ada SHU yang dibagikan." rows={rows} columns={[
      { key: "tahun", label: "Tahun", render: (r) => <strong>{r.periode.tahun}</strong> },
      { key: "jasaModal", label: "Jasa modal", render: (r) => formatRupiah(r.jasaModal, true) },
      { key: "jasaPinjaman", label: "Jasa pinjaman", render: (r) => formatRupiah(r.jasaPinjaman, true) },
      { key: "total", label: "Total SHU", render: (r) => <strong className="text-green-700">{formatRupiah(r.total, true)}</strong> },
      { key: "dibagikan", label: "Dibagikan", render: (r) => <span>{r.periode.dibagikanPada ? formatTanggal(r.periode.dibagikanPada) : "-"} <Badge variant="success">Masuk simpanan sukarela</Badge></span> },
    ]} /></CardContent></Card>
  </div>;
}
