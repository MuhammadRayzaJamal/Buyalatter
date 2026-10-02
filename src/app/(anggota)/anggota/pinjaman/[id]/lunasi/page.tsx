import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { formatRupiah } from "@/lib/format";
import { hitungPelunasan } from "@/lib/pelunasan";
import { ajukanPelunasan } from "../../../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pelunasan Dipercepat" };

export default async function LunasiPage({ params }: { params: Promise<{ id: string }> }) {
  const anggota = await requireAnggota(); const { id } = await params;
  await syncStatusTerlambat();
  const pinjaman = await prisma.pinjaman.findFirst({ where: { id, anggotaId: anggota.id }, include: { angsuran: { orderBy: { angsuranKe: "asc" } } } });
  if (!pinjaman) notFound();
  const pelunasan = pinjaman.status === "DICAIRKAN" ? hitungPelunasan(pinjaman, pinjaman.angsuran) : null;
  const menunggu = pinjaman.angsuran.some((a) => a.status === "MENUNGGU_VERIFIKASI");
  const rekening = await prisma.rekeningKoperasi.findMany({ where: { isAktif: true } });
  return <div className="mx-auto max-w-2xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${id}`}>← Kembali ke detail pinjaman</Link>
    <div><p className="text-sm font-semibold text-green">Pelunasan dipercepat</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Lunasi sekarang</h1><p className="mt-2 text-sm text-slate-500">Anda hanya membayar sisa pokok dan bunga bulan berjalan. Bunga bulan-bulan berikutnya tidak ditagih.</p></div>
    {!pelunasan ? <Card><CardContent className="p-8 text-center text-sm text-slate-500">Pinjaman ini tidak dapat dilunasi saat ini.<div className="mt-4"><Button href={`/anggota/pinjaman/${id}`} variant="outline">Kembali</Button></div></CardContent></Card> : <>
      <Card><CardHeader><CardTitle>Rincian pelunasan</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Sisa pokok ({pelunasan.jumlahAngsuranSisa} angsuran)</span><strong>{formatRupiah(pelunasan.sisaPokok)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Bunga bulan berjalan</span><strong>{formatRupiah(pelunasan.bungaBulanBerjalan)}</strong></div>
        {pelunasan.denda.gt(0) && <div className="flex justify-between"><span className="text-slate-500">Denda berjalan</span><strong className="text-red-600">{formatRupiah(pelunasan.denda)}</strong></div>}
        {pelunasan.terbayar.gt(0) && <div className="flex justify-between"><span className="text-slate-500">Sudah dibayar</span><strong className="text-emerald-700">− {formatRupiah(pelunasan.terbayar)}</strong></div>}
        <div className="mt-2 flex justify-between border-t pt-2 text-base"><span className="font-semibold text-slate-700">Total pelunasan</span><strong className="text-navy">{formatRupiah(pelunasan.total)}</strong></div>
        <p className="pt-1 text-xs text-emerald-700">Anda menghemat bunga {formatRupiah(pelunasan.bungaDihemat)} dibanding membayar sesuai jadwal.</p>
      </CardContent></Card>
      {menunggu ? <Card><CardContent className="p-6 text-sm text-slate-600">Ada pembayaran yang sedang menunggu verifikasi. Pelunasan dapat diajukan setelah selesai diproses.</CardContent></Card> : <>
        <Card><CardHeader><CardTitle>Transfer ke rekening koperasi</CardTitle></CardHeader><CardContent className="space-y-3">{rekening.map((r) => <div className="flex items-center justify-between rounded-lg border px-4 py-3" key={r.id}><div><p className="text-xs text-slate-400">{r.namaBank}</p><p className="font-bold text-slate-800">{r.noRekening}</p><p className="text-xs text-slate-500">a.n. {r.atasNama}</p></div><CopyButton value={r.noRekening} /></div>)}<p className="text-xs text-slate-500">Nominal transfer akan mendapat kode unik 3 digit setelah bukti dikirim. Kelebihan transfer masuk ke simpanan sukarela Anda.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Unggah bukti pelunasan</CardTitle></CardHeader><CardContent>
          <AksiForm aksi={ajukanPelunasan.bind(null, id)} className="space-y-4">
            <label className="block space-y-1.5"><span className="block text-sm font-semibold text-slate-700">Transfer ke rekening</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm" name="rekeningKoperasiId" required><option value="">Pilih rekening tujuan</option>{rekening.map((r) => <option key={r.id} value={r.id}>{r.namaBank} · {r.noRekening}</option>)}</select></label>
            <Input defaultValue={pelunasan.total.toString()} id="jumlahTransfer" label="Jumlah yang Anda transfer (Rp)" min="0.01" name="jumlahTransfer" required step="0.01" type="number" />
            <Input accept="image/*,application/pdf" id="buktiBayar" label="Bukti transfer (JPG/PNG/PDF, maks 2MB)" name="buktiBayar" required type="file" />
            <TombolKirim teksProses="Mengirim bukti...">Kirim bukti pelunasan</TombolKirim>
          </AksiForm>
        </CardContent></Card>
      </>}
    </>}
  </div>;
}
