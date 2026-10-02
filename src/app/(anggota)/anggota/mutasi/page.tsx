import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { hitungSaldo } from "@/lib/mutasi";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buku Mutasi" };

const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default async function MutasiAnggotaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const anggota = await requireAnggota();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1); const pageSize = 15;
  // Semua query difilter anggotaId milik user yang login.
  const [rows, total, saldo] = await Promise.all([
    prisma.mutasi.findMany({ where: { anggotaId: anggota.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.mutasi.count({ where: { anggotaId: anggota.id } }),
    hitungSaldo(prisma, anggota.id),
  ]);
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keuangan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Buku mutasi</h1><p className="mt-2 text-sm text-slate-500">Catatan setiap transaksi uang pada akun Anda. Saldo dihitung dari mutasi.</p></div>
    <Card><CardContent className="p-6"><p className="text-xs text-slate-500">Saldo simpanan</p><p className="mt-2 font-heading text-3xl font-extrabold text-navy">{formatRupiah(saldo, true)}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>{total} mutasi</CardTitle></CardHeader><CardContent className="p-0">
      <Table emptyMessage="Belum ada mutasi." rows={rows} columns={[
        { key: "createdAt", label: "Waktu", render: (r) => waktu.format(r.createdAt) },
        { key: "jenis", label: "Jenis", render: (r) => <Badge variant={r.jenis === "KOREKSI" ? "warning" : "info"}>{r.jenis}</Badge> },
        { key: "jumlah", label: "Jumlah", render: (r) => <strong className={r.arah === "MASUK" ? "text-green-700" : "text-red-600"}>{r.arah === "MASUK" ? "+" : "−"}{formatRupiah(r.jumlah, true)}</strong> },
        { key: "saldoSetelah", label: "Saldo setelah", render: (r) => formatRupiah(r.saldoSetelah, true) },
        { key: "keterangan", label: "Keterangan", render: (r) => r.keterangan ?? "-" },
      ]} />
      <Pagination basePath="/anggota/mutasi" currentPage={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} />
    </CardContent></Card>
  </div>;
}
