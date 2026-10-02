import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPinjamanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole(...AKSES.pinjaman); const params = await searchParams; const page = Math.max(1, Number(params.page ?? 1) || 1); const pageSize = 10;
  const [loans, total] = await Promise.all([
    prisma.pinjaman.findMany({ include: { anggota: { include: { user: true } } }, orderBy: { tanggalPengajuan: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.pinjaman.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Semua pinjaman</h1><p className="mt-2 text-sm text-slate-500">Tinjau pengajuan dan status pinjaman anggota.</p></div><Card><CardHeader><CardTitle>{total} pinjaman tercatat</CardTitle></CardHeader><CardContent className="p-0"><Table columns={[{ key: "anggota", label: "Anggota", render: (row) => <span className="font-semibold text-slate-800">{row.anggota.user.nama}</span> }, { key: "jumlah", label: "Jumlah", render: (row) => <strong>{formatRupiah(row.jumlah)}</strong> }, { key: "tenorBulan", label: "Tenor", render: (row) => `${row.tenorBulan} bulan` }, { key: "tanggalPengajuan", label: "Pengajuan", render: (row) => formatTanggal(row.tanggalPengajuan) }, { key: "status", label: "Status", render: (row) => <Badge variant={row.status === "LUNAS" ? "success" : row.status === "DITOLAK" ? "danger" : row.status === "DIAJUKAN" ? "warning" : "info"}>{row.status}</Badge> }, { key: "aksi", label: "Aksi", render: (row) => <div className="flex items-center gap-3"><Link className="text-xs font-bold text-navy hover:underline" href={`/admin/pinjaman/${row.id}`}>Detail</Link>{row.status === "DISETUJUI" && <Link className="text-xs font-bold text-green-700 hover:underline" href={`/admin/pencairan/${row.id}`}>Cairkan</Link>}</div> }]} rows={loans} emptyMessage="Belum ada pengajuan pinjaman." /><Pagination currentPage={page} totalPages={totalPages} basePath="/admin/pinjaman" /></CardContent></Card><div className="flex flex-wrap gap-3"><Button href="/admin/pencairan" variant="outline">Kelola pencairan</Button><Button href="/admin/angsuran" variant="outline">Kelola pembayaran angsuran</Button></div></div>;
}