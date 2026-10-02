import Link from "next/link";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { tandaiSemuaDibaca } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const titik: Record<string, string> = { TERLAMBAT: "bg-red-500", PENGINGAT: "bg-amber-500", PENCAIRAN: "bg-green-500", PEMBAYARAN: "bg-blue-500", INFO: "bg-slate-400" };
const label: Record<string, string> = { TERLAMBAT: "Terlambat", PENGINGAT: "Pengingat", PENCAIRAN: "Pencairan", PEMBAYARAN: "Pembayaran", INFO: "Info" };

export default async function MemberNotifikasiPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const anggota = await requireAnggota();
  const { page: pageParam } = await searchParams; const page = Math.max(1, Number(pageParam ?? 1) || 1); const pageSize = 15;
  const where = { userId: anggota.userId };
  const [items, total, unread] = await Promise.all([
    prisma.notifikasi.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notifikasi.count({ where }),
    prisma.notifikasi.count({ where: { ...where, sudahDibaca: false } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-green">Portal Anggota</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Notifikasi</h1><p className="mt-2 text-sm text-slate-500">{unread ? `${unread} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}</p></div>{unread > 0 && <form action={tandaiSemuaDibaca}><Button type="submit" variant="outline">Tandai semua sudah dibaca</Button></form>}</div>
    <Card>
      <CardHeader><CardTitle>{total} notifikasi</CardTitle></CardHeader>
      <CardContent className="p-0">
        {items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <Link className={`flex gap-4 px-5 py-4 hover:bg-slate-50 ${item.sudahDibaca ? "" : "bg-blue-50/60"}`} href={`/anggota/notifikasi/${item.id}`} key={item.id}>
          <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.sudahDibaca ? "bg-slate-200" : titik[item.tipe]}`} />
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`text-sm ${item.sudahDibaca ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>{item.judul}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{label[item.tipe]}</span></div><p className="mt-1 text-sm text-slate-500">{item.pesan}</p><p className="mt-1 text-xs text-slate-400">{waktu.format(item.createdAt)}</p></div>
        </Link>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada notifikasi.</p>}
        <Pagination basePath="/anggota/notifikasi" currentPage={page} totalPages={totalPages} />
      </CardContent>
    </Card>
  </div>;
}
