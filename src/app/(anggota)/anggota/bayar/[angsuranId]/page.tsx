import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat, isAngsuranPayable } from "@/lib/angsuran";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ajukanPembayaran } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

export default async function BayarAngsuranPage({ params }: { params: Promise<{ angsuranId: string }> }) {
  const anggota = await requireAnggota();
  const { angsuranId } = await params;
  await syncStatusTerlambat();

  // Filter anggotaId langsung di query: angsuran milik anggota lain tidak pernah terbaca (cegah IDOR).
  const angsuran = await prisma.angsuran.findFirst({ where: { id: angsuranId, pinjaman: { anggotaId: anggota.id } }, include: { pinjaman: true } });
  if (!angsuran) notFound();

  const sisa = angsuran.jumlah.plus(angsuran.denda).minus(angsuran.terbayar);
  const totalTransfer = sisa.plus(angsuran.kodeUnik);
  const rekening = await prisma.rekeningKoperasi.findMany({ where: { isAktif: true } });

  return <div className="mx-auto max-w-2xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${angsuran.pinjamanId}`}>← Kembali ke detail pinjaman</Link>
    <div><p className="text-sm font-semibold text-green">Pembayaran angsuran</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Angsuran ke-{angsuran.angsuranKe}</h1><p className="mt-2 text-sm text-slate-500">Jatuh tempo {formatTanggal(angsuran.tanggalJatuhTempo)}</p></div>

    {angsuran.status === "LUNAS" ? (
      <Card><CardContent className="p-8 text-center"><Badge variant="success">LUNAS</Badge><p className="mt-4 text-sm text-slate-500">Angsuran ini sudah dibayar lunas.</p></CardContent></Card>
    ) : angsuran.status === "MENUNGGU_VERIFIKASI" ? (
      <Card><CardContent className="p-8 text-center"><Badge variant="info">Menunggu verifikasi</Badge><p className="mt-4 text-sm leading-6 text-slate-500">Bukti pembayaran kamu sudah dikirim dan sedang ditinjau admin. Lihat statusnya di <Link className="font-bold text-navy hover:underline" href="/anggota/pembayaran">Riwayat pembayaran</Link>.</p></CardContent></Card>
    ) : !(await isAngsuranPayable(angsuran.pinjamanId, angsuran.angsuranKe)) ? (
      <Card><CardContent className="p-8 text-center"><p className="text-sm leading-6 text-slate-500">Selesaikan pembayaran angsuran ke-{angsuran.angsuranKe - 1} terlebih dahulu sebelum membayar angsuran ini.</p><Button className="mt-4" href={`/anggota/pinjaman/${angsuran.pinjamanId}`} variant="outline">Lihat jadwal angsuran</Button></CardContent></Card>
    ) : (
      <>
        <Card>
          <CardHeader><CardTitle>Rincian tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Angsuran pokok</span><strong>{formatRupiah(angsuran.jumlah)}</strong></div>{angsuran.terbayar.gt(0) && <div className="flex justify-between"><span className="text-slate-500">Sudah dibayar sebelumnya</span><strong className="text-emerald-700">− {formatRupiah(angsuran.terbayar)}</strong></div>}
            {angsuran.denda.gt(0) && <div className="flex justify-between"><span className="text-slate-500">Denda keterlambatan</span><strong className="text-red-600">{formatRupiah(angsuran.denda)}</strong></div>}
            <div className="flex justify-between"><span className="text-slate-500">Kode unik (3 digit)</span><strong>+ {angsuran.kodeUnik}</strong></div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base"><span className="font-semibold text-slate-700">Nominal transfer</span><strong className="text-navy">{formatRupiah(totalTransfer)}</strong></div>
            <p className="pt-1 text-xs leading-5 text-slate-500">Transfer <strong>tepat {formatRupiah(totalTransfer)}</strong> (termasuk kode unik) agar mudah dicocokkan. Jika kurang, pembayaran dicatat sebagai pembayaran sebagian; jika lebih (termasuk kode unik), kelebihannya masuk ke simpanan sukarela Anda.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transfer ke rekening koperasi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rekening.length ? rekening.map((item) => (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3" key={item.id}>
                <div><p className="text-xs text-slate-400">{item.namaBank}</p><p className="font-bold text-slate-800">{item.noRekening}</p><p className="text-xs text-slate-500">a.n. {item.atasNama}</p></div>
                <CopyButton value={item.noRekening} />
              </div>
            )) : <p className="text-sm text-slate-500">Belum ada rekening koperasi aktif. Hubungi pengurus.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Unggah bukti pembayaran</CardTitle></CardHeader>
          <CardContent>
            <AksiForm aksi={ajukanPembayaran.bind(null, angsuranId)} className="space-y-4">
              <label className="block space-y-1.5"><span className="block text-sm font-semibold text-slate-700">Transfer ke rekening</span><select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" name="rekeningKoperasiId" required><option value="">Pilih rekening tujuan</option>{rekening.map((item) => <option key={item.id} value={item.id}>{item.namaBank} · {item.noRekening}</option>)}</select></label>
              <Input defaultValue={totalTransfer.toString()} id="jumlahTransfer" label="Jumlah yang Anda transfer (Rp)" min="0.01" name="jumlahTransfer" required step="0.01" type="number" />
              <Input accept="image/*,application/pdf" id="buktiBayar" label="Bukti transfer (JPG/PNG/PDF, maks 2MB)" name="buktiBayar" required type="file" />
              <TombolKirim >Kirim bukti pembayaran</TombolKirim>
            </AksiForm>
          </CardContent>
        </Card>
      </>
    )}
  </div>;
}
