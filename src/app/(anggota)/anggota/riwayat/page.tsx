import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
  const anggota = await requireAnggota();
  await syncStatusTerlambat();
  const [savings, withdrawals, loans, installments] = await Promise.all([prisma.simpanan.findMany({ where: { anggotaId: anggota.id } }), prisma.penarikan.findMany({ where: { anggotaId: anggota.id } }), prisma.pinjaman.findMany({ where: { anggotaId: anggota.id } }), prisma.angsuran.findMany({ where: { pinjaman: { anggotaId: anggota.id } } })]);
  const transactions = [...savings.map((item) => ({ id: `s-${item.id}`, tanggal: item.tanggal, jenis: `Simpanan ${item.jenis}`, jumlah: item.jumlah, negatif: false, status: "BERHASIL" })), ...withdrawals.map((item) => ({ id: `w-${item.id}`, tanggal: item.tanggal, jenis: "Penarikan", jumlah: item.jumlah, negatif: true, status: item.status })), ...loans.map((item) => ({ id: `p-${item.id}`, tanggal: item.tanggalPengajuan, jenis: "Pengajuan pinjaman", jumlah: item.jumlah, negatif: false, status: item.status })), ...installments.map((item) => ({ id: `a-${item.id}`, tanggal: item.tanggalBayar ?? item.tanggalJatuhTempo, jenis: `Angsuran ke-${item.angsuranKe}`, jumlah: item.jumlah, negatif: true, status: item.status }))].sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Aktivitas akun</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Riwayat transaksi</h1><p className="mt-2 text-sm text-slate-500">Semua aktivitas simpanan, pinjaman, dan pembayaran Anda.</p></div><Card><CardHeader><CardTitle>{transactions.length} transaksi tercatat</CardTitle></CardHeader><CardContent className="p-0"><Table columns={[{ key: "tanggal", label: "Tanggal", render: (row) => formatTanggal(row.tanggal) }, { key: "jenis", label: "Transaksi" }, { key: "jumlah", label: "Nominal", render: (row) => <strong className={row.negatif ? "text-red-600" : "text-green-700"}>{row.negatif ? "-" : "+"}{formatRupiah(row.jumlah)}</strong> }, { key: "status", label: "Status", render: (row) => <Badge variant={row.status === "LUNAS" || row.status === "BERHASIL" || row.status === "DISETUJUI" || row.status === "DICAIRKAN" ? "success" : row.status === "DITOLAK" || row.status === "TERLAMBAT" ? "danger" : row.status === "MENUNGGU_VERIFIKASI" ? "info" : "warning"}>{row.status}</Badge> }]} rows={transactions.map((item) => ({ ...item, id: item.id }))} /></CardContent></Card></div>;
}