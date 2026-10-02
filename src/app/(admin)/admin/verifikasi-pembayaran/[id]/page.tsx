import Link from "next/link";
import { notFound } from "next/navigation";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { terimaPembayaran, tolakPembayaran } from "../../actions";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { mimeBerkas } from "@/lib/berkas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

const statusVariant = { MENUNGGU: "warning", DITERIMA: "success", DITOLAK: "danger", SEBAGIAN: "warning" } as const;

export default async function AdminVerifikasiPembayaranDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...AKSES.verifikasiPembayaran);
  const { id } = await params;
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id },
    include: { anggota: { include: { user: true } }, angsuran: { include: { pinjaman: true } }, rekeningKoperasi: true },
  });
  if (!pembayaran) notFound();

  const buktiIsPdf = (await mimeBerkas(pembayaran.buktiBayarUrl)) === "application/pdf";
  const total = pembayaran.jumlahBayar.plus(pembayaran.dendaDibayar);

  return <div className="mx-auto max-w-2xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href="/admin/verifikasi-pembayaran">← Kembali ke verifikasi pembayaran</Link>
    <div><p className="text-sm font-semibold text-green">Tinjau pembayaran</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-slate-900">{formatRupiah(total)}</h1><Badge variant={statusVariant[pembayaran.status]}>{pembayaran.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{pembayaran.anggota.user.nama} · angsuran ke-{pembayaran.angsuran.angsuranKe} · diajukan {formatTanggal(pembayaran.tanggalBayar)}</p></div>

    <Card>
      <CardHeader><CardTitle>Rincian</CardTitle></CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="text-xs text-slate-400">Angsuran pokok</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pembayaran.jumlahBayar)}</p></div>
        <div><p className="text-xs text-slate-400">Denda</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pembayaran.dendaDibayar)}</p></div>
        <div><p className="text-xs text-slate-400">Ditransfer ke</p><p className="mt-1 font-bold text-slate-800">{pembayaran.rekeningKoperasi.namaBank} · {pembayaran.rekeningKoperasi.noRekening}</p></div>
        <div><p className="text-xs text-slate-400">Tagihan transfer (termasuk kode unik {pembayaran.kodeUnik})</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pembayaran.jumlahTagihan)}</p></div>
        <div><p className="text-xs text-slate-400">Diklaim anggota ditransfer</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pembayaran.jumlahTransfer)}{pembayaran.jumlahTransfer.lt(pembayaran.jumlahTagihan) && <span className="ml-2 text-xs font-normal text-amber-700">kurang {formatRupiah(pembayaran.jumlahTagihan.minus(pembayaran.jumlahTransfer))}</span>}</p></div>
        {pembayaran.isPelunasan && <div className="sm:col-span-2"><Badge variant="info">Pelunasan dipercepat</Badge></div>}
        {pembayaran.status !== "MENUNGGU" && pembayaran.kelebihan.gt(0) && <div><p className="text-xs text-slate-400">Kelebihan → simpanan sukarela</p><p className="mt-1 font-bold text-emerald-700">{formatRupiah(pembayaran.kelebihan)}</p></div>}
        <div><p className="text-xs text-slate-400">Pinjaman</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pembayaran.angsuran.pinjaman.jumlah)}</p></div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Bukti transfer</CardTitle></CardHeader>
      <CardContent>
        {buktiIsPdf ? (
          <a className="inline-block text-sm font-bold text-navy hover:underline" href={pembayaran.buktiBayarUrl} rel="noopener noreferrer" target="_blank">Lihat berkas PDF →</a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Bukti transfer" className="max-h-96 rounded-lg border object-contain" src={pembayaran.buktiBayarUrl} />
        )}
      </CardContent>
    </Card>

    {pembayaran.status === "MENUNGGU" && (
      <Card>
        <CardHeader><CardTitle>Keputusan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AksiForm aksi={terimaPembayaran.bind(null, id)} className="space-y-3"><Input defaultValue={pembayaran.jumlahTransfer.toString()} id="jumlahDiterima" label="Jumlah diterima di rekening koperasi (Rp)" min="0.01" name="jumlahDiterima" required step="0.01" type="number" /><p className="text-xs text-slate-500">Cocokkan dengan mutasi bank. Kurang dari tagihan → tercatat SEBAGIAN; lebih → kelebihan masuk simpanan sukarela anggota.</p>
            <TombolKirim  variant="secondary">Terima pembayaran</TombolKirim>
          </AksiForm>
          <AksiForm aksi={tolakPembayaran.bind(null, id)} className="space-y-3">
            <label className="block space-y-1.5" htmlFor="alasan"><span className="block text-sm font-semibold text-slate-700">Alasan penolakan</span><textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" id="alasan" name="alasan" placeholder="Contoh: bukti transfer tidak jelas / nominal tidak sesuai" required /></label>
            <TombolKirim  variant="danger">Tolak pembayaran</TombolKirim>
          </AksiForm>
        </CardContent>
      </Card>
    )}

    {pembayaran.status === "DITOLAK" && pembayaran.alasanTolak && (
      <Card><CardContent className="p-5 text-sm text-red-700">Alasan penolakan: {pembayaran.alasanTolak}</CardContent></Card>
    )}
  </div>;
}
