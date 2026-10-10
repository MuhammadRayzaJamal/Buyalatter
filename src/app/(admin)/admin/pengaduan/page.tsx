import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { ambilLibur } from "@/lib/penagihan";
import { tambahHariKerja } from "@/lib/penagihan-aturan";
import { LABEL_KATEGORI, LABEL_STATUS_PENGADUAN, TARGET_HARI_KERJA, VARIAN_STATUS_PENGADUAN } from "@/lib/pengaduan";
import { tanggapiPengaduan } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan Anggota" };

const SARING = { semua: undefined, terbuka: { not: "SELESAI" as const }, selesai: "SELESAI" as const };

export default async function AdminPengaduanPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  await requireRole(...AKSES.pengaduan);
  const { page: pageParam, filter: filterParam } = await searchParams;
  const filter = filterParam === "semua" || filterParam === "selesai" ? filterParam : "terbuka";
  const page = Math.max(1, Number(pageParam ?? 1) || 1); const pageSize = 15;
  const where = SARING[filter] ? { status: SARING[filter] } : {};
  const [daftar, total, libur] = await Promise.all([
    prisma.pengaduan.findMany({ where, include: { anggota: { include: { user: true } }, ditanganiOleh: true, pinjaman: { select: { id: true } } }, orderBy: [{ createdAt: "asc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.pengaduan.count({ where }),
    ambilLibur(),
  ]);
  const sekarang = new Date();
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Layanan anggota</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pengaduan anggota</h1><p className="mt-2 text-sm text-slate-500">Target penyelesaian maksimal {TARGET_HARI_KERJA} hari kerja (Senin–Jumat, di luar hari libur). Tiket yang melewati batas ditandai merah.</p></div>
    <div className="flex gap-2 text-sm font-semibold">{(["terbuka", "semua", "selesai"] as const).map((f) => <a className={`rounded-full px-4 py-1.5 ${filter === f ? "bg-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`} href={`/admin/pengaduan?filter=${f}`} key={f}>{f === "terbuka" ? "Belum selesai" : f === "semua" ? "Semua" : "Selesai"}</a>)}</div>
    <Card><CardHeader><CardTitle>{total} pengaduan</CardTitle></CardHeader><CardContent className="p-0">
      {daftar.length ? <div className="divide-y divide-slate-100">{daftar.map((p) => {
        const tenggat = tambahHariKerja(p.createdAt, TARGET_HARI_KERJA, libur);
        const lewat = p.status !== "SELESAI" && tenggat.getTime() < sekarang.getTime();
        return <div className={`space-y-3 border-l-4 px-5 py-5 ${lewat ? "border-l-red-600 bg-red-50/60" : "border-l-transparent"}`} key={p.id}>
          <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-slate-900">{p.nomorTiket}</strong><Badge variant="neutral">{LABEL_KATEGORI[p.kategori]}</Badge><Badge variant={VARIAN_STATUS_PENGADUAN[p.status]}>{LABEL_STATUS_PENGADUAN[p.status]}</Badge>{lewat && <Badge variant="danger">Lewat batas {TARGET_HARI_KERJA} hari kerja</Badge>}<span className="text-xs text-slate-400">{p.anggota.user.nama} · {p.anggota.noAnggota} · {waktu.format(p.createdAt)}</span></div>
          <p className="text-sm leading-6 text-slate-700">{p.isi}</p>
          <p className={`text-xs ${lewat ? "font-semibold text-red-700" : "text-slate-500"}`}>{p.status === "SELESAI" ? `Selesai ${p.selesaiAt ? waktu.format(p.selesaiAt) : ""}${p.ditanganiOleh ? ` oleh ${p.ditanganiOleh.nama}` : ""}` : `Target selesai ${tanggal.format(tenggat)}`}{p.lampiranPath && <> · <a className="font-semibold text-primary underline" href={p.lampiranPath} rel="noopener" target="_blank">Lampiran</a></>}</p>
          {p.tanggapan && <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><strong>Tanggapan:</strong> {p.tanggapan}</div>}
          {p.status !== "SELESAI" && <AksiForm aksi={tanggapiPengaduan.bind(null, p.id)} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
            <label className="block space-y-1.5" htmlFor={`tanggapan-${p.id}`}><span className="block text-xs font-semibold text-slate-600">Tanggapan kepada anggota</span><textarea className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy" defaultValue={p.tanggapan ?? ""} id={`tanggapan-${p.id}`} maxLength={2000} name="tanggapan" required /></label>
            <label className="block space-y-1.5" htmlFor={`status-${p.id}`}><span className="block text-xs font-semibold text-slate-600">Status</span><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue="DIPROSES" id={`status-${p.id}`} name="status"><option value="DIPROSES">Diproses</option><option value="SELESAI">Selesai</option></select></label>
            <TombolKirim size="sm">Kirim tanggapan</TombolKirim>
          </AksiForm>}
        </div>;
      })}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada pengaduan.</p>}
      <Pagination basePath="/admin/pengaduan" currentPage={page} params={{ filter }} totalPages={totalPages} />
    </CardContent></Card>
  </div>;
}
