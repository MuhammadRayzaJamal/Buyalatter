import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPesanPage() {
  await requireRole(...AKSES.konten); const messages = await prisma.pesan.findMany({ orderBy: { createdAt: "desc" } });
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Komunikasi</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pesan masuk</h1><p className="mt-2 text-sm text-slate-500">Pesan yang dikirim melalui form kontak publik.</p></div><div className="space-y-4">{messages.length ? messages.map((message) => <Card key={message.id}><CardHeader><div className="flex flex-col justify-between gap-2 sm:flex-row"><CardTitle>{message.subjek}</CardTitle><span className="text-xs text-slate-400">{formatTanggal(message.createdAt)}</span></div></CardHeader><CardContent><p className="text-sm font-semibold text-slate-800">{message.nama} · {message.email}</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{message.isi}</p></CardContent></Card>) : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada pesan masuk.</CardContent></Card>}</div></div>;
}