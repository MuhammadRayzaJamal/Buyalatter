import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WithdrawalForm } from "@/components/member/member-forms";
import { getBatas } from "@/lib/pengaturan";
import { Decimal, dec, NOL, tambah } from "@/lib/uang";

export const dynamic = "force-dynamic";

export default async function PenarikanPage() {
  const anggota = await requireAnggota();
  const [savings, withdrawals] = await Promise.all([prisma.simpanan.aggregate({ where: { anggotaId: anggota.id, jenis: "SUKARELA" }, _sum: { jumlah: true } }), prisma.penarikan.findMany({ where: { anggotaId: anggota.id }, orderBy: { tanggal: "desc" } })]);
  const batas = await getBatas(); const balance = dec(savings._sum.jumlah).minus(withdrawals.filter((item) => item.status !== "DITOLAK").reduce(tambah("jumlah"), NOL));
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Simpanan sukarela</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Penarikan simpanan</h1><p className="mt-2 text-sm text-slate-500">Ajukan penarikan dari saldo sukarela yang tersedia.</p></div><div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"><Card><CardHeader><CardTitle>Ajukan penarikan</CardTitle></CardHeader><CardContent><WithdrawalForm balance={balance.toString()} maksInput={Decimal.min(balance, batas.maksTransaksi).toString()} min={batas.minTransaksi.toString()} /></CardContent></Card><Card><CardHeader><CardTitle>Riwayat penarikan</CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-100">{withdrawals.length ? withdrawals.map((item) => <div className="flex items-center justify-between px-5 py-4" key={item.id}><div><p className="font-semibold text-slate-800">{formatRupiah(item.jumlah)}</p><p className="mt-1 text-xs text-slate-500">{formatTanggal(item.tanggal)}</p></div><Badge variant={item.status === "DISETUJUI" ? "success" : item.status === "DITOLAK" ? "danger" : "warning"}>{item.status}</Badge></div>) : <p className="px-5 py-10 text-center text-sm text-slate-500">Belum ada pengajuan penarikan.</p>}</div></CardContent></Card></div></div>;
}