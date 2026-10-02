import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { verifikasiAnggota } from "../actions";
import { formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

const verifikasiVariant = { PENDING: "warning", TERVERIFIKASI: "success", DITOLAK: "danger" } as const;
const verifikasiLabel = { PENDING: "Menunggu", TERVERIFIKASI: "Terverifikasi", DITOLAK: "Ditolak" } as const;

export default async function AdminVerifikasiPage() {
  await requireRole(...AKSES.verifikasi);
  const [pending, riwayat] = await Promise.all([
    prisma.anggota.findMany({ where: { statusVerifikasi: "PENDING" }, include: { user: true }, orderBy: { tanggalMasuk: "desc" } }),
    prisma.anggota.findMany({ where: { statusVerifikasi: { in: ["TERVERIFIKASI", "DITOLAK"] } }, include: { user: true }, orderBy: { diverifikasiPada: "desc" }, take: 10 }),
  ]);

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Kepatuhan data</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Verifikasi anggota</h1><p className="mt-2 text-sm text-slate-500">Tinjau foto KTP dan setujui atau tolak pendaftaran anggota baru.</p></div>

    <Card>
      <CardHeader><CardTitle>{pending.length} menunggu verifikasi</CardTitle></CardHeader>
      <CardContent className="p-0">
        {pending.length ? <div className="divide-y divide-slate-100">{pending.map((item) => (
          <div className="grid gap-5 p-5 md:grid-cols-[160px_1fr]" key={item.id}>
            {item.fotoKtp ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Foto KTP ${item.user.nama}`} className="h-36 w-full rounded-lg border object-cover md:h-full" src={item.fotoKtp} />
            ) : (
              <div className="flex h-36 items-center justify-center rounded-lg border bg-slate-50 text-xs text-slate-400 md:h-full">Tidak ada foto KTP</div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3"><h2 className="font-bold text-slate-900">{item.user.nama}</h2><Badge variant="warning">Menunggu</Badge></div>
              <p className="mt-1 text-sm text-slate-500">{item.user.email} · {item.noAnggota}</p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div><p className="text-xs text-slate-400">NIK</p><p className="font-semibold text-slate-700">{item.nik}</p></div>
                <div><p className="text-xs text-slate-400">No. HP</p><p className="font-semibold text-slate-700">{item.noHp}</p></div>
                <div><p className="text-xs text-slate-400">Daftar</p><p className="font-semibold text-slate-700">{formatTanggal(item.tanggalMasuk)}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <AksiForm aksi={verifikasiAnggota.bind(null, item.id, "TERVERIFIKASI")}>
                  <TombolKirim size="sm"  variant="secondary">Setujui</TombolKirim>
                </AksiForm>
                <AksiForm aksi={verifikasiAnggota.bind(null, item.id, "DITOLAK")} className="flex flex-wrap items-start gap-2">
                  <textarea className="h-9 w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" name="catatan" placeholder="Alasan penolakan (wajib)" required rows={1} />
                  <TombolKirim size="sm"  variant="danger">Tolak</TombolKirim>
                </AksiForm>
              </div>
            </div>
          </div>
        ))}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada pendaftaran yang menunggu verifikasi.</p>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Riwayat verifikasi terbaru</CardTitle></CardHeader>
      <CardContent className="p-0">
        {riwayat.length ? <div className="divide-y divide-slate-100">{riwayat.map((item) => (
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
            <div>
              <p className="font-semibold text-slate-800">{item.user.nama}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.diverifikasiPada ? formatTanggal(item.diverifikasiPada) : "-"}{item.catatanVerifikasi ? ` · ${item.catatanVerifikasi}` : ""}</p>
            </div>
            <Badge variant={verifikasiVariant[item.statusVerifikasi]}>{verifikasiLabel[item.statusVerifikasi]}</Badge>
          </div>
        ))}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">Belum ada riwayat verifikasi.</p>}
      </CardContent>
    </Card>
  </div>;
}
