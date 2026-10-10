import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { PESAN_JADWAL } from "@/lib/penagihan-aturan";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log Penagihan" };

const SALURAN = ["NOTIFIKASI", "EMAIL", "WHATSAPP", "TELEPON"] as const;
const varian = { NOTIFIKASI: "info", EMAIL: "success", WHATSAPP: "warning", TELEPON: "neutral" } as const;

export default async function LogPenagihanPage({ searchParams }: { searchParams: Promise<{ page?: string; saluran?: string }> }) {
  await requireRole(...AKSES.logPenagihan);
  const { page: pageParam, saluran: saluranParam } = await searchParams;
  const saluran = SALURAN.find((s) => s === saluranParam);
  const page = Math.max(1, Number(pageParam ?? 1) || 1); const pageSize = 20;
  const where = saluran ? { saluran } : {};
  const [log, total] = await Promise.all([
    prisma.logPenagihan.findMany({ where, include: { anggota: { include: { user: true } }, dikirimOleh: true }, orderBy: { waktuKirim: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.logPenagihan.count({ where }),
  ]);
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Penagihan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Log penagihan</h1><p className="mt-2 text-sm text-slate-500">Bukti setiap pengingat dan penagihan yang dikirim. {PESAN_JADWAL}; hanya kepada anggota yang bersangkutan, maksimal 1 pengingat per hari. Waktu ditampilkan dalam WIB.</p></div>
    <div className="flex flex-wrap gap-2 text-sm font-semibold"><a className={`rounded-full px-4 py-1.5 ${!saluran ? "bg-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`} href="/admin/log-penagihan">Semua</a>{SALURAN.map((s) => <a className={`rounded-full px-4 py-1.5 ${saluran === s ? "bg-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`} href={`/admin/log-penagihan?saluran=${s}`} key={s}>{s}</a>)}</div>
    <Card><CardHeader><CardTitle>{total} catatan</CardTitle></CardHeader><CardContent className="p-0">
      {log.length ? <div className="divide-y divide-slate-100">{log.map((l) => <div className="space-y-1.5 px-5 py-4" key={l.id}>
        <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{l.anggota.user.nama}</strong><span className="text-xs text-slate-400">{l.anggota.noAnggota}</span><Badge variant={varian[l.saluran]}>{l.saluran}</Badge><span className="text-xs text-slate-400">{waktu.format(l.waktuKirim)} WIB · oleh {l.dikirimOleh?.nama ?? "Sistem (otomatis)"}</span></div>
        <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{l.isiPesan}</p>
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada penagihan tercatat.</p>}
      <Pagination basePath="/admin/log-penagihan" currentPage={page} params={{ saluran }} totalPages={Math.max(1, Math.ceil(total / pageSize))} />
    </CardContent></Card>
  </div>;
}
