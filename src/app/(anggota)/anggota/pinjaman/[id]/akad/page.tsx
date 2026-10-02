import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { susunIsiAkad } from "@/lib/akad";
import { formatTanggal } from "@/lib/format";
import { getBatas } from "@/lib/pengaturan";
import { setujuiAkad } from "../../../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akad Pinjaman" };

export default async function AkadPage({ params }: { params: Promise<{ id: string }> }) {
  const anggota = await requireAnggota(); const { id } = await params;
  const pinjaman = await prisma.pinjaman.findFirst({ where: { id, anggotaId: anggota.id }, include: { akad: true } });
  if (!pinjaman) notFound();
  const [batas, pengaturan] = await Promise.all([getBatas(), prisma.pengaturan.findFirst()]);
  // Bila sudah disetujui, tampilkan salinan yang tersimpan (tidak berubah walau pengaturan berubah); bila belum, tampilkan pratinjau.
  const isi = pinjaman.akad?.isiAkad ?? susunIsiAkad({ pinjamanId: id, anggota: { nama: anggota.user.nama, noAnggota: anggota.noAnggota, nik: anggota.nik, alamat: anggota.alamat }, jumlah: pinjaman.jumlah, bungaPersen: pinjaman.bungaPersen, tenorBulan: pinjaman.tenorBulan, totalBayar: pinjaman.totalBayar, tanggalPersetujuan: pinjaman.tanggalDisetujui ?? new Date(), dendaPersenPerHari: pengaturan?.dendaPersenPerHari ?? "0.1", batasDendaPersen: batas.batasDendaPersen });
  const bolehSetuju = pinjaman.status === "DISETUJUI" && !pinjaman.akad;

  return <div className="mx-auto max-w-3xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${id}`}>← Kembali ke detail pinjaman</Link>
    <div><p className="text-sm font-semibold text-green">Akad digital</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Akad pinjaman</h1><p className="mt-2 text-sm text-slate-500">Baca seluruh isi akad sebelum menyetujui. Dana baru dapat dicairkan setelah akad disetujui.</p></div>
    <Card><CardHeader><CardTitle>Isi akad</CardTitle></CardHeader><CardContent><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-mono text-xs leading-6 text-slate-700">{isi}</pre></CardContent></Card>

    {pinjaman.akad ? <Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-emerald-800">Akad disetujui pada <strong>{formatTanggal(pinjaman.akad.disetujuiPada)}</strong>{pinjaman.akad.ipAddress ? ` dari IP ${pinjaman.akad.ipAddress}` : ""}.</p><Button href={`/api/akad/${id}`} variant="outline">Unduh PDF</Button></CardContent></Card>
    : bolehSetuju ? <Card><CardHeader><CardTitle>Persetujuan</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={setujuiAkad.bind(null, id)} className="space-y-4">
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input className="mt-1.5 h-4 w-4" name="setuju" required type="checkbox" />Saya telah membaca dan memahami seluruh isi akad (nominal, bunga, tenor, jadwal angsuran, dan ketentuan denda), dan menyetujuinya.</label>
        <Input autoComplete="current-password" id="password" label="Masukkan password Anda untuk menandatangani" name="password" required type="password" />
        <TombolKirim teksProses="Menyimpan persetujuan...">Setujui akad</TombolKirim>
      </AksiForm>
    </CardContent></Card> : <Card><CardContent className="p-6 text-sm text-slate-600">Akad hanya dapat disetujui setelah pinjaman disetujui manajer dan sebelum dicairkan. Status pinjaman saat ini: <strong>{pinjaman.status}</strong>.</CardContent></Card>}
  </div>;
}
