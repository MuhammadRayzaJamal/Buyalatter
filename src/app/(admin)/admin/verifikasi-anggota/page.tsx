import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { terimaKyc, tolakKyc } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { PreviewImage } from "@/components/ui/preview-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Identitas (KYC)" };

const variant = { MENUNGGU: "warning", DITERIMA: "success", DITOLAK: "danger" } as const;

export default async function VerifikasiKycPage() {
  await requireRole(...AKSES.verifikasiAnggota);
  const [menunggu, riwayat] = await Promise.all([
    prisma.verifikasiAnggota.findMany({ where: { status: "MENUNGGU" }, include: { anggota: { include: { user: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.verifikasiAnggota.findMany({ where: { status: { in: ["DITERIMA", "DITOLAK"] } }, include: { anggota: { include: { user: true } } }, orderBy: { tanggalVerifikasi: "desc" }, take: 10 }),
  ]);
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Kepatuhan data</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Verifikasi identitas (KYC)</h1><p className="mt-2 text-sm text-slate-500">Cocokkan foto KTP, swafoto, nama, dan NIK. NIK ditampilkan utuh hanya di halaman ini.</p></div>
    <Card><CardHeader><CardTitle>{menunggu.length} menunggu peninjauan</CardTitle></CardHeader><CardContent className="p-0">
      {menunggu.length ? <div className="divide-y divide-slate-100">{menunggu.map((k) => <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_1.2fr]" key={k.id}>
        <div><p className="mb-2 text-xs font-semibold text-slate-400">Foto KTP</p><PreviewImage alt={`Foto KTP ${k.anggota.user.nama}`} className="h-44 w-full rounded-lg border object-cover" src={k.fotoKtpPath} /></div>
        <div><p className="mb-2 text-xs font-semibold text-slate-400">Swafoto memegang KTP</p><PreviewImage alt={`Swafoto ${k.anggota.user.nama}`} className="h-44 w-full rounded-lg border object-cover" src={k.swafotoKtpPath} /></div>
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{k.anggota.user.nama}</h2><Badge variant="warning">Menunggu</Badge></div>
          <p className="mt-1 text-xs text-slate-500">{k.anggota.noAnggota} · diajukan {formatTanggal(k.createdAt)}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">NIK</dt><dd className="font-mono font-semibold text-slate-800">{k.anggota.nik}</dd></div><div><dt className="text-xs text-slate-400">Pekerjaan</dt><dd className="font-semibold text-slate-800">{k.pekerjaan}</dd></div><div><dt className="text-xs text-slate-400">Penghasilan/bulan</dt><dd className="font-semibold text-slate-800">{formatRupiah(k.penghasilanBulanan)}</dd></div><div><dt className="text-xs text-slate-400">Alamat</dt><dd className="font-semibold text-slate-800">{k.anggota.alamat}</dd></div></dl>
          <AksiForm aksi={terimaKyc.bind(null, k.id)} className="mt-4"><TombolKirim size="sm" variant="secondary">Terima verifikasi</TombolKirim></AksiForm>
          <AksiForm aksi={tolakKyc.bind(null, k.id)} className="mt-3 flex flex-wrap items-start gap-2"><input aria-label="Alasan penolakan" className="h-9 w-56 rounded-[10px] border border-slate-200 px-3 text-xs" maxLength={190} minLength={3} name="alasan" placeholder="Alasan penolakan (wajib)" required /><TombolKirim size="sm" variant="danger">Tolak</TombolKirim></AksiForm>
        </div>
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada pengajuan yang menunggu.</p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Riwayat terbaru</CardTitle></CardHeader><CardContent className="p-0">{riwayat.length ? <div className="divide-y divide-slate-100">{riwayat.map((k) => <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={k.id}><div><p className="font-semibold text-slate-800">{k.anggota.user.nama}</p><p className="text-xs text-slate-500">{k.tanggalVerifikasi ? formatTanggal(k.tanggalVerifikasi) : "-"}{k.alasanTolak ? ` · ${k.alasanTolak}` : ""}</p></div><Badge variant={variant[k.status]}>{k.status}</Badge></div>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">Belum ada riwayat.</p>}</CardContent></Card>
  </div>;
}
