import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const statusVariant = { MENUNGGU: "warning", DITERIMA: "success", DITOLAK: "danger", SEBAGIAN: "warning" } as const;
const statusLabel = { MENUNGGU: "Menunggu verifikasi", DITERIMA: "Diterima", DITOLAK: "Ditolak", SEBAGIAN: "Sebagian (kurang bayar)" } as const;

export default async function PembayaranAnggotaPage() {
  const anggota = await requireAnggota();
  const pembayaran = await prisma.pembayaran.findMany({
    where: { anggotaId: anggota.id },
    include: { angsuran: { include: { pinjaman: true } }, rekeningKoperasi: true },
    orderBy: { tanggalBayar: "desc" },
  });

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keuangan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Riwayat pembayaran</h1><p className="mt-2 text-sm text-slate-500">Status pembayaran angsuran yang pernah kamu ajukan.</p></div>
    <Card>
      <CardHeader><CardTitle>{pembayaran.length} pembayaran tercatat</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table
          columns={[
            { key: "tanggal", label: "Tanggal", render: (row) => formatTanggal(row.tanggalBayar) },
            { key: "angsuran", label: "Angsuran", render: (row) => `Ke-${row.angsuran.angsuranKe} · ${formatRupiah(row.angsuran.jumlah)}` },
            { key: "rekening", label: "Rekening tujuan", render: (row) => `${row.rekeningKoperasi.namaBank} · ${row.rekeningKoperasi.noRekening}` },
            { key: "jumlah", label: "Jumlah dibayar", render: (row) => <strong>{formatRupiah(row.jumlahBayar.plus(row.dendaDibayar))}</strong> },
            { key: "status", label: "Status", render: (row) => <div><Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>{row.status === "DITOLAK" && row.alasanTolak && <p className="mt-1 text-xs text-red-600">{row.alasanTolak}</p>}</div> },
          ]}
          emptyMessage="Belum ada pembayaran yang diajukan."
          rows={pembayaran}
        />
      </CardContent>
    </Card>
  </div>;
}
