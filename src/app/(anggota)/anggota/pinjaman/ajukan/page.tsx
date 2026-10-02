import { Check, X } from "lucide-react";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { cekKelayakan } from "@/lib/kelayakan";
import { formatRupiah } from "@/lib/format";
import { getBatas } from "@/lib/pengaturan";
import { LoanApplicationForm } from "@/components/member/member-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajukan Pinjaman" };

export default async function AjukanPinjamanPage() {
  const anggota = await requireAnggota();
  const [batas, kelayakan, rekeningUtama] = await Promise.all([
    getBatas(),
    cekKelayakan(anggota.id),
    prisma.rekeningAnggota.findFirst({ where: { anggotaId: anggota.id, isUtama: true } }),
  ]);
  return <div className="mx-auto max-w-3xl space-y-8">
    <div><p className="text-sm font-semibold text-green">Pembiayaan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Ajukan pinjaman</h1><p className="mt-2 text-sm text-slate-500">Isi kebutuhan pinjaman dengan lengkap agar proses verifikasi berjalan lancar.</p></div>

    <Card>
      <CardHeader><CardTitle>Syarat kelayakan</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">{kelayakan.syarat.map((s) => <li className="flex items-start gap-3" key={s.kode}>
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.terpenuhi ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.terpenuhi ? <Check aria-label="Terpenuhi" className="h-4 w-4" /> : <X aria-label="Belum terpenuhi" className="h-4 w-4" />}</span>
          <div><p className="text-sm font-semibold text-slate-800">{s.label}</p><p className="text-xs text-slate-500">{s.detail}</p></div>
        </li>)}</ul>
        <div className="rounded-xl bg-blue-50 p-4 text-sm"><p className="text-xs text-slate-500">Plafon pinjaman maksimal Anda</p><p className="mt-1 font-heading text-2xl font-extrabold text-navy">{formatRupiah(kelayakan.plafon)}</p>{kelayakan.maksAngsuranPerBulan && <p className="mt-1 text-xs text-slate-500">Angsuran per bulan maksimal {formatRupiah(kelayakan.maksAngsuranPerBulan)}.</p>}</div>
        {!kelayakan.syarat.find((s) => s.kode === "kyc")?.terpenuhi && <Button href="/anggota/verifikasi" size="sm" variant="outline">Lengkapi verifikasi identitas</Button>}
      </CardContent>
    </Card>

    {!kelayakan.layak ? <Card><CardContent className="p-8 text-center text-sm leading-6 text-slate-600">Anda belum memenuhi seluruh syarat sehingga belum dapat mengajukan pinjaman. Lengkapi syarat yang bertanda silang merah.</CardContent></Card>
    : rekeningUtama ? <Card><CardHeader><CardTitle>Form pengajuan</CardTitle></CardHeader><CardContent><LoanApplicationForm maks={kelayakan.plafon.toString()} min={batas.minPinjaman.toString()} /></CardContent></Card>
    : <Card><CardContent className="space-y-4 p-8 text-center"><p className="text-sm leading-6 text-slate-600">Kamu belum memiliki rekening bank utama. Tambahkan rekening terlebih dahulu sebelum mengajukan pinjaman.</p><Button href="/anggota/rekening">Tambah rekening</Button></CardContent></Card>}
  </div>;
}
