import Link from "next/link";
import { notFound } from "next/navigation";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { prosesPencairan } from "../../actions";
import { getBatas } from "@/lib/pengaturan";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

export default async function AdminPencairanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(...AKSES.pencairan);
  const { id } = await params;
  const batas = await getBatas();
  const pinjaman = await prisma.pinjaman.findUnique({ where: { id }, include: { anggota: { include: { user: true, rekening: true } }, akad: true } });
  if (!pinjaman) notFound();

  const rekeningUtama = pinjaman.anggota.rekening.find((item) => item.isUtama) ?? pinjaman.anggota.rekening[0];

  return <div className="mx-auto max-w-2xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href="/admin/pencairan">← Kembali ke pencairan</Link>
    <div><p className="text-sm font-semibold text-green">Proses pencairan</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{formatRupiah(pinjaman.jumlah)}</h1><p className="mt-2 text-sm text-slate-500">{pinjaman.anggota.user.nama} · tenor {pinjaman.tenorBulan} bulan · disetujui {pinjaman.tanggalDisetujui ? formatTanggal(pinjaman.tanggalDisetujui) : "-"}</p></div>

    {pinjaman.status !== "DISETUJUI" ? (
      <Card><CardContent className="p-8 text-center text-sm text-slate-500">Pinjaman ini berstatus <strong>{pinjaman.status}</strong> dan tidak dalam antrean pencairan.</CardContent></Card>
    ) : !rekeningUtama ? (
      <Card><CardContent className="p-8 text-center text-sm text-slate-500">Anggota ini belum memiliki rekening bank. Pencairan tidak dapat diproses.</CardContent></Card>
    ) : (
      <Card>
        <CardHeader><CardTitle>Rekening tujuan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-slate-400">Bank</p><p className="mt-1 font-bold text-slate-800">{rekeningUtama.namaBank}</p></div>
          <div><p className="text-xs text-slate-400">Nomor rekening</p><p className="mt-1 font-bold text-slate-800">{rekeningUtama.noRekening}</p></div>
          <div><p className="text-xs text-slate-400">Atas nama</p><p className="mt-1 font-bold text-slate-800">{rekeningUtama.atasNama}</p></div>
        </CardContent>
      </Card>
    )}

    {pinjaman.status === "DISETUJUI" && !pinjaman.akad && (
      <Card className="border-amber-200 bg-amber-50"><CardContent className="p-6 text-sm leading-6 text-amber-800"><strong>Menunggu akad digital.</strong> Anggota belum membaca dan menyetujui akad, sehingga pencairan belum dapat diproses. Anggota sudah diberi notifikasi.</CardContent></Card>
    )}

    {pinjaman.status === "DISETUJUI" && pinjaman.akad && rekeningUtama && (
      <Card>
        <CardHeader><CardTitle>Form pencairan</CardTitle></CardHeader>
        <CardContent>
          <AksiForm aksi={prosesPencairan.bind(null, pinjaman.id)} className="space-y-4">
            <input name="rekeningAnggotaId" type="hidden" value={rekeningUtama.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input defaultValue={pinjaman.jumlah.toString()} id="jumlahDicairkan" label="Jumlah dicairkan (Rp)" min="0.01" name="jumlahDicairkan" required step="0.01" type="number" />
              <Input defaultValue="0" id="biayaAdmin" label="Biaya admin (Rp)" min="0" name="biayaAdmin" step="0.01" type="number" />
            </div>
            <p className="rounded-lg bg-blue-50 px-4 py-3 text-xs leading-5 text-slate-600">Pencairan di atas <strong>{formatRupiah(batas.batasPencairanManajer)}</strong> wajib diproses oleh <strong>Manajer</strong>{user.role !== "MANAJER" && pinjaman.jumlah.gt(batas.batasPencairanManajer) ? " — akun Anda bukan Manajer, sistem akan menolak." : "."}</p>
            <Input accept="image/*,application/pdf" id="buktiTransfer" label="Bukti transfer (JPG/PNG/PDF, maks 2MB)" name="buktiTransfer" type="file" />
            <label className="block space-y-1.5" htmlFor="catatan"><span className="block text-sm font-semibold text-slate-700">Catatan (opsional)</span><textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" id="catatan" name="catatan" /></label>
            <TombolKirim teksProses="Memproses pencairan..." variant="secondary">Proses Pencairan</TombolKirim>
          </AksiForm>
        </CardContent>
      </Card>
    )}
  </div>;
}
