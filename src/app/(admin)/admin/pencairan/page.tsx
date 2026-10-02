import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPencairanPage() {
  await requireRole(...AKSES.pencairan);
  const pinjaman = await prisma.pinjaman.findMany({
    where: { status: "DISETUJUI" },
    include: { anggota: { include: { user: true } } },
    orderBy: { tanggalDisetujui: "asc" },
  });

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pencairan pinjaman</h1><p className="mt-2 text-sm text-slate-500">Pinjaman yang sudah disetujui dan menunggu dicairkan ke rekening anggota.</p></div>
    <Card>
      <CardHeader><CardTitle>{pinjaman.length} menunggu pencairan</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table
          columns={[
            { key: "anggota", label: "Anggota", render: (row) => <span className="font-semibold text-slate-800">{row.anggota.user.nama}</span> },
            { key: "jumlah", label: "Jumlah", render: (row) => <strong>{formatRupiah(row.jumlah)}</strong> },
            { key: "tenorBulan", label: "Tenor", render: (row) => `${row.tenorBulan} bulan` },
            { key: "tanggalDisetujui", label: "Disetujui", render: (row) => (row.tanggalDisetujui ? formatTanggal(row.tanggalDisetujui) : "-") },
            { key: "aksi", label: "Aksi", render: (row) => <Link className="text-xs font-bold text-navy hover:underline" href={`/admin/pencairan/${row.id}`}>Proses pencairan</Link> },
          ]}
          emptyMessage="Tidak ada pinjaman yang menunggu pencairan."
          rows={pinjaman}
        />
      </CardContent>
    </Card>
    <Button href="/admin/pinjaman" variant="outline">Lihat semua pinjaman</Button>
  </div>;
}
