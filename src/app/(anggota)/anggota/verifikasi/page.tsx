import { requireAnggota } from "@/lib/otorisasi";
import { kycTerbaru } from "@/lib/kyc";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { samarkanNik } from "@/lib/nik";
import { kirimKyc } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Identitas" };

const variant = { MENUNGGU: "warning", DITERIMA: "success", DITOLAK: "danger" } as const;
const label = { MENUNGGU: "Menunggu peninjauan", DITERIMA: "Terverifikasi", DITOLAK: "Ditolak" } as const;

export default async function VerifikasiAnggotaPage() {
  const anggota = await requireAnggota();
  // Query difilter anggotaId milik user yang login.
  const kyc = await kycTerbaru(anggota.id);
  const boleh = !kyc || kyc.status === "DITOLAK";
  return <div className="mx-auto max-w-3xl space-y-8">
    <div><p className="text-sm font-semibold text-green">Keamanan akun</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Verifikasi identitas (KYC)</h1><p className="mt-2 text-sm text-slate-500">Anggota harus terverifikasi sebelum dapat mengajukan pinjaman.</p></div>

    <Card><CardHeader><CardTitle>Data Anda</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-3">
      <div><p className="text-xs text-slate-400">Nama</p><p className="mt-1 font-bold text-slate-800">{anggota.user.nama}</p></div>
      <div><p className="text-xs text-slate-400">NIK (disamarkan)</p><p className="mt-1 font-mono font-bold text-slate-800">{samarkanNik(anggota.nik)}</p></div>
      <div><p className="text-xs text-slate-400">Status</p><div className="mt-1">{kyc ? <Badge variant={variant[kyc.status]}>{label[kyc.status]}</Badge> : <Badge variant="neutral">Belum diajukan</Badge>}</div></div>
      {kyc && <><div><p className="text-xs text-slate-400">Pekerjaan</p><p className="mt-1 font-bold text-slate-800">{kyc.pekerjaan}</p></div><div><p className="text-xs text-slate-400">Penghasilan bulanan</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(kyc.penghasilanBulanan)}</p></div><div><p className="text-xs text-slate-400">Diajukan</p><p className="mt-1 font-bold text-slate-800">{formatTanggal(kyc.createdAt)}</p></div></>}
      {kyc?.status === "DITOLAK" && kyc.alasanTolak && <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 sm:col-span-3">Alasan penolakan: {kyc.alasanTolak}</p>}
    </CardContent></Card>

    {boleh ? <Card><CardHeader><CardTitle>{kyc ? "Kirim ulang dokumen" : "Unggah dokumen"}</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={kirimKyc} className="space-y-4" resetSetelahSukses>
        <div className="grid gap-4 sm:grid-cols-2"><Input id="penghasilanBulanan" label="Penghasilan bulanan (Rp)" min="1" name="penghasilanBulanan" required step="0.01" type="number" /><Input id="pekerjaan" label="Pekerjaan" maxLength={100} name="pekerjaan" required /></div>
        <Input accept="image/jpeg,image/png,image/webp" id="fotoKtp" label="Foto KTP (JPG/PNG/WEBP, maks 5MB)" name="fotoKtp" required type="file" />
        <Input accept="image/jpeg,image/png,image/webp" id="swafoto" label="Swafoto sambil memegang KTP (maks 5MB)" name="swafoto" required type="file" />
        <p className="text-xs text-slate-500">Berkas disimpan privat dan hanya dapat dilihat Anda serta pengurus yang berwenang.</p>
        <TombolKirim teksProses="Mengunggah...">Kirim untuk diverifikasi</TombolKirim>
      </AksiForm>
    </CardContent></Card> : <Card><CardContent className="p-6 text-sm text-slate-600">{kyc?.status === "MENUNGGU" ? "Dokumen Anda sedang ditinjau pengurus. Anda akan menerima notifikasi setelah selesai." : "Identitas Anda sudah terverifikasi."}</CardContent></Card>}
  </div>;
}
