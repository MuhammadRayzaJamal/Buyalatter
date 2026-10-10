import { ajukanPenutupanAkun } from "@/app/(anggota)/anggota/actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatTanggal } from "@/lib/format";
import { PERSETUJUAN } from "@/lib/kebijakan";

type Persetujuan = { jenis: string; disetujui: boolean; versiKebijakan: string; waktu: Date };

/** Hak anggota atas data pribadi (UU PDP): lihat persetujuan, unduh salinan data, dan ajukan penutupan akun. */
export function PrivasiAkun({ persetujuan, pinjamanBelumSelesai }: { persetujuan: Persetujuan[]; pinjamanBelumSelesai: number }) {
  return <Card id="privasi">
    <CardHeader><CardTitle>Data pribadi &amp; privasi</CardTitle></CardHeader>
    <CardContent className="space-y-6 text-sm text-slate-600">
      <div>
        <p className="font-bold text-slate-800">Persetujuan penggunaan data</p>
        <ul className="mt-2 space-y-2">{PERSETUJUAN.map((p) => { const catatan = persetujuan.find((x) => x.jenis === p.jenis); return <li className="flex flex-col gap-0.5 sm:flex-row sm:justify-between" key={p.jenis}><span>{p.judul}</span><span className={catatan?.disetujui ? "font-semibold text-emerald-700" : "text-slate-400"}>{catatan ? `${catatan.disetujui ? "Disetujui" : "Tidak disetujui"} · ${formatTanggal(catatan.waktu)} · kebijakan v${catatan.versiKebijakan}` : "Belum tercatat"}</span></li>; })}</ul>
      </div>
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-bold text-slate-800">Unduh salinan data pribadi</p><p className="mt-1 text-xs leading-5">Berisi profil, simpanan, pinjaman, mutasi, persetujuan data, dan pengaduan Anda dalam format JSON.</p></div>
        <Button href="/api/anggota/data-saya" variant="outline">Unduh data saya</Button>
      </div>
      <div className="border-t pt-5">
        <p className="font-bold text-slate-800">Penutupan akun</p>
        {pinjamanBelumSelesai > 0
          ? <p className="mt-1 rounded-lg bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">Akun hanya dapat ditutup setelah semua pinjaman lunas. Anda masih memiliki {pinjamanBelumSelesai} pinjaman yang belum selesai.</p>
          : <AksiForm aksi={ajukanPenutupanAkun} className="mt-2 space-y-3">
            <p className="text-xs leading-5">Setelah akun ditutup Anda tidak dapat masuk lagi. Saldo simpanan, bila ada, diajukan sebagai penarikan untuk disetujui pengurus. Tindakan ini tidak dapat dibatalkan.</p>
            <Input autoComplete="current-password" id="passwordTutup" label="Password Anda (konfirmasi)" name="password" required type="password" />
            <TombolKirim size="sm" variant="outline">Tutup akun saya</TombolKirim>
          </AksiForm>}
      </div>
    </CardContent>
  </Card>;
}
