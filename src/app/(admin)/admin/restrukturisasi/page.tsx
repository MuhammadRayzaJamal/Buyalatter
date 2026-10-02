import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { setujuiRestrukturisasi, tolakRestrukturisasi } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restrukturisasi" };

const variant = { DIAJUKAN: "warning", DISETUJUI: "success", DITOLAK: "danger" } as const;

export default async function RestrukturisasiAdminPage() {
  const user = await requireRole(...AKSES.restrukturisasi);
  const bolehPutus = AKSES.restrukturisasiKeputusan.includes(user.role);
  const rows = await prisma.restrukturisasi.findMany({ include: { pinjaman: { include: { anggota: { include: { user: true } } } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 50 });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Restrukturisasi pinjaman</h1><p className="mt-2 text-sm text-slate-500">Perpanjangan tenor untuk tunggakan lebih dari 30 hari. Keputusan hanya oleh Manajer.</p></div>
    <Card><CardHeader><CardTitle>{rows.filter((r) => r.status === "DIAJUKAN").length} menunggu keputusan</CardTitle></CardHeader><CardContent className="p-0">
      {rows.length ? <div className="divide-y divide-slate-100">{rows.map((r) => <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between" key={r.id}>
        <div><p className="font-bold text-slate-800">{r.pinjaman.anggota.user.nama} · <Link className="text-navy hover:underline" href={`/admin/pinjaman/${r.pinjamanId}`}>{formatRupiah(r.pinjaman.jumlah)}</Link></p><p className="mt-1 text-sm text-slate-500">Tenor {r.tenorLama} → {r.tenorBaru} bulan · diajukan {formatTanggal(r.createdAt)}</p><p className="mt-1 text-sm text-slate-600">Alasan: {r.alasan}</p></div>
        <div className="flex flex-wrap items-center gap-3"><Badge variant={variant[r.status]}>{r.status}</Badge>
          {r.status === "DIAJUKAN" && (bolehPutus ? <><AksiForm aksi={setujuiRestrukturisasi.bind(null, r.id)}><TombolKirim size="sm" variant="secondary">Setujui</TombolKirim></AksiForm><AksiForm aksi={tolakRestrukturisasi.bind(null, r.id)}><TombolKirim size="sm" variant="danger">Tolak</TombolKirim></AksiForm></> : <span className="text-xs text-slate-400">Hanya Manajer yang dapat memutuskan</span>)}
        </div>
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada pengajuan restrukturisasi.</p>}
    </CardContent></Card>
  </div>;
}
