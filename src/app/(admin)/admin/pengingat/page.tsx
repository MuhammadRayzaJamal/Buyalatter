import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { HasilPengecekan, TombolPengecekan } from "@/components/admin/cek-pengecekan";

export const dynamic = "force-dynamic";

const emailLabel = (status: string | null) => {
  if (status === "TERKIRIM") return { variant: "success", text: "Email terkirim" } as const;
  if (status === "TIDAK_DIKONFIGURASI") return { variant: "neutral", text: "Email nonaktif" } as const;
  if (status?.startsWith("GAGAL")) return { variant: "danger", text: "Email gagal" } as const;
  return { variant: "neutral", text: "-" } as const;
};

export default async function AdminPengingatPage({ searchParams }: { searchParams: Promise<{ page?: string; dicek?: string }> }) {
  await requireRole(...AKSES.pengingat);
  const { page: pageParam, dicek } = await searchParams; const page = Math.max(1, Number(pageParam ?? 1) || 1); const pageSize = 15;
  const where = { tipe: { in: ["PENGINGAT", "TERLAMBAT"] as ("PENGINGAT" | "TERLAMBAT")[] } };
  const [logs, total] = await Promise.all([
    prisma.notifikasi.findMany({ where, include: { user: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notifikasi.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-green">Penagihan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Log pengingat</h1><p className="mt-2 text-sm text-slate-500">Riwayat pengingat jatuh tempo dan pemberitahuan keterlambatan yang sudah dikirim.</p></div><TombolPengecekan returnTo="/admin/pengingat" /></div>
    <HasilPengecekan dicek={dicek} />
    <Card>
      <CardHeader><CardTitle>{total} pengingat terkirim</CardTitle></CardHeader>
      <CardContent className="p-0">
        {logs.length ? <div className="divide-y divide-slate-100">{logs.map((log) => { const email = emailLabel(log.emailStatus); return <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={log.id}>
          <div className="min-w-0"><p className="font-bold text-slate-800">{log.user.nama} <span className="font-normal text-slate-400">· {log.judul}</span></p><p className="mt-1 text-sm text-slate-500">{log.pesan}</p></div>
          <div className="flex shrink-0 items-center gap-2"><Badge variant={log.tipe === "TERLAMBAT" ? "danger" : "warning"}>{log.tipe === "TERLAMBAT" ? "Terlambat" : "Pengingat"}</Badge><span title={log.emailStatus ?? undefined}><Badge variant={email.variant}>{email.text}</Badge></span><span className="text-xs text-slate-400">{waktu.format(log.createdAt)}</span></div>
        </div>; })}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada pengingat yang dikirim. Klik &ldquo;Jalankan Pengecekan Sekarang&rdquo; untuk mencoba.</p>}
        <Pagination basePath="/admin/pengingat" currentPage={page} totalPages={totalPages} />
      </CardContent>
    </Card>
  </div>;
}
