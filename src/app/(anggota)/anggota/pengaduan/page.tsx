import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { kirimPengaduan } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { LABEL_KATEGORI, LABEL_STATUS_PENGADUAN, VARIAN_STATUS_PENGADUAN } from "@/lib/pengaduan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan" };

export default async function PengaduanAnggotaPage() {
  const anggota = await requireAnggota();
  const daftar = await prisma.pengaduan.findMany({ where: { anggotaId: anggota.id }, orderBy: { createdAt: "desc" } });
  const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Layanan anggota</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pengaduan</h1><p className="mt-2 text-sm text-slate-500">Sampaikan keluhan tentang pinjaman, penagihan, simpanan, layanan, atau data pribadi Anda. Pengurus menanggapi paling lambat 10 hari kerja.</p></div>
    <Card><CardHeader><CardTitle>Buat pengaduan</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={kirimPengaduan} className="space-y-4" resetSetelahSukses>
        <label className="block space-y-1.5" htmlFor="kategori"><span className="block text-sm font-semibold text-slate-700">Kategori</span><select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue="" id="kategori" name="kategori" required><option disabled value="">Pilih kategori</option>{Object.entries(LABEL_KATEGORI).map(([kode, label]) => <option key={kode} value={kode}>{label}</option>)}</select></label>
        <label className="block space-y-1.5" htmlFor="isi"><span className="block text-sm font-semibold text-slate-700">Isi pengaduan</span><textarea className="min-h-32 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" id="isi" maxLength={2000} minLength={10} name="isi" placeholder="Ceritakan masalah Anda sejelas mungkin" required /></label>
        <label className="block space-y-1.5" htmlFor="lampiran"><span className="block text-sm font-semibold text-slate-700">Lampiran (opsional · JPG/PNG/PDF maks 2MB)</span><input accept="image/jpeg,image/png,application/pdf" className="block text-sm" id="lampiran" name="lampiran" type="file" /></label>
        <TombolKirim>Kirim pengaduan</TombolKirim>
      </AksiForm>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Tiket saya ({daftar.length})</CardTitle></CardHeader><CardContent className="p-0">
      {daftar.length ? <div className="divide-y divide-slate-100">{daftar.map((p) => <div className="space-y-2 px-5 py-4" key={p.id}>
        <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-slate-900">{p.nomorTiket}</strong><Badge variant="neutral">{LABEL_KATEGORI[p.kategori]}</Badge><Badge variant={VARIAN_STATUS_PENGADUAN[p.status]}>{LABEL_STATUS_PENGADUAN[p.status]}</Badge><span className="text-xs text-slate-400">{waktu.format(p.createdAt)}</span></div>
        <p className="text-sm leading-6 text-slate-700">{p.isi}</p>
        {p.lampiranPath && <a className="text-xs font-semibold text-primary underline" href={p.lampiranPath} rel="noopener" target="_blank">Lihat lampiran</a>}
        {p.tanggapan && <div className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><strong>Tanggapan pengurus{p.selesaiAt ? ` · selesai ${waktu.format(p.selesaiAt)}` : ""}:</strong> {p.tanggapan}</div>}
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada pengaduan.</p>}
    </CardContent></Card>
  </div>;
}
