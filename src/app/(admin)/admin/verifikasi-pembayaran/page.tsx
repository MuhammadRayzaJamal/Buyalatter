import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminVerifikasiPembayaranPage() {
  await requireRole(...AKSES.verifikasiPembayaran);
  const pembayaran = await prisma.pembayaran.findMany({
    where: { status: "MENUNGGU" },
    include: { anggota: { include: { user: true } }, angsuran: { include: { pinjaman: true } } },
    orderBy: { tanggalBayar: "asc" },
  });

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Verifikasi pembayaran</h1><p className="mt-2 text-sm text-slate-500">Tinjau bukti transfer angsuran dari anggota.</p></div>
    <Card>
      <CardHeader><CardTitle>{pembayaran.length} menunggu verifikasi</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table
          columns={[
            { key: "anggota", label: "Anggota", render: (row) => <span className="font-semibold text-slate-800">{row.anggota.user.nama}</span> },
            { key: "angsuran", label: "Angsuran", render: (row) => `Ke-${row.angsuran.angsuranKe}` },
            { key: "jumlah", label: "Jumlah", render: (row) => <strong>{formatRupiah(row.jumlahBayar.plus(row.dendaDibayar))}</strong> },
            { key: "tanggal", label: "Diajukan", render: (row) => formatTanggal(row.tanggalBayar) },
            { key: "aksi", label: "Aksi", render: (row) => <Link className="text-xs font-bold text-navy hover:underline" href={`/admin/verifikasi-pembayaran/${row.id}`}>Tinjau</Link> },
          ]}
          emptyMessage="Tidak ada pembayaran yang menunggu verifikasi."
          rows={pembayaran}
        />
      </CardContent>
    </Card>
  </div>;
}
