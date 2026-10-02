import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { setujuiPenarikan, tolakPenarikan } from "../actions";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

export default async function AdminPenarikanPage() {
  await requireRole(...AKSES.penarikan); const withdrawals = await prisma.penarikan.findMany({ include: { anggota: { include: { user: true } } }, orderBy: { tanggal: "desc" } });
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Penarikan</h1><p className="mt-2 text-sm text-slate-500">Tinjau dan proses pengajuan penarikan simpanan sukarela.</p></div><Card><CardHeader><CardTitle>{withdrawals.filter((item) => item.status === "PENDING").length} pengajuan menunggu</CardTitle></CardHeader><CardContent className="p-0">{withdrawals.length ? <div className="divide-y divide-slate-100">{withdrawals.map((item) => <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between" key={item.id}><div><p className="font-bold text-slate-800">{item.anggota.user.nama}</p><p className="mt-1 text-sm text-slate-500">{formatRupiah(item.jumlah)} · {formatTanggal(item.tanggal)}</p></div><div className="flex items-center gap-3"><Badge variant={item.status === "DISETUJUI" ? "success" : item.status === "DITOLAK" ? "danger" : "warning"}>{item.status}</Badge>{item.status === "PENDING" && <><AksiForm aksi={setujuiPenarikan.bind(null, item.id)}><TombolKirim size="sm" variant="secondary" >Setujui</TombolKirim></AksiForm><AksiForm aksi={tolakPenarikan.bind(null, item.id)}><TombolKirim size="sm" variant="danger" >Tolak</TombolKirim></AksiForm></>}</div></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada pengajuan penarikan.</p>}</CardContent></Card></div>;
}