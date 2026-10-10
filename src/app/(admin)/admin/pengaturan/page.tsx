import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { BATAS_BIAYA_ADMIN_PERSEN, BATAS_BUNGA_PINJAMAN_TAHUN, BATAS_BUNGA_SIMPANAN_TAHUN, BATAS_DENDA_PERSEN_POKOK, LABEL_METODE } from "@/lib/bunga";
import { DAFTAR_PLACEHOLDER, KATA_TERLARANG, TEMPLATE_BAWAAN } from "@/lib/penagihan-aturan";
import { updatePengaturan } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan" };

const Bagian = ({ judul, keterangan }: { judul: string; keterangan?: string }) => <div className="border-t pt-5"><p className="text-sm font-bold text-slate-800">{judul}</p>{keterangan && <p className="mt-1 text-xs leading-5 text-slate-500">{keterangan}</p>}</div>;

export default async function AdminPengaturanPage() {
  await requireRole(...AKSES.pengaturan);
  const settings = await prisma.pengaturan.findFirst();
  const d = (kunci: keyof NonNullable<typeof settings>, bawaan: string) => (settings?.[kunci] as { toString(): string } | undefined)?.toString() ?? bawaan;
  return <div className="mx-auto max-w-3xl space-y-8">
    <div><p className="text-sm font-semibold text-green">Konfigurasi sistem</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pengaturan koperasi</h1><p className="mt-2 text-sm text-slate-500">Nilai yang dipakai pada simpanan, pengajuan pinjaman, denda, dan penagihan. Batas regulasi divalidasi di server dan tidak dapat dilampaui.</p></div>
    <Card><CardHeader><CardTitle>Nilai default</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={updatePengaturan} className="space-y-5">
        <Bagian judul="Jasa pinjaman & simpanan (Permenkop UKM 8/2023)" keterangan={`Bunga pinjaman efektif per tahun (termasuk biaya administrasi) maksimal ${BATAS_BUNGA_PINJAMAN_TAHUN}%, bunga simpanan maksimal ${BATAS_BUNGA_SIMPANAN_TAHUN}%. Metode flat menghasilkan bunga efektif hampir dua kali bunga nominalnya, sehingga angkanya dicek terhadap batas efektif. Perubahan hanya berlaku untuk pengajuan baru.`} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input defaultValue={d("bungaPinjamanPerTahun", "12")} id="bungaPinjamanPerTahun" label={`Bunga pinjaman (% per tahun, maks ${BATAS_BUNGA_PINJAMAN_TAHUN})`} min="0" name="bungaPinjamanPerTahun" required step="0.01" type="number" />
          <Input defaultValue={d("bungaSimpananPerTahun", "4")} id="bungaSimpananPerTahun" label={`Bunga simpanan (% per tahun, maks ${BATAS_BUNGA_SIMPANAN_TAHUN})`} min="0" name="bungaSimpananPerTahun" required step="0.01" type="number" />
          <label className="block space-y-1.5" htmlFor="metodeBunga"><span className="block text-sm font-semibold text-slate-700">Metode bunga</span><select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue={settings?.metodeBunga ?? "ANUITAS"} id="metodeBunga" name="metodeBunga">{Object.entries(LABEL_METODE).map(([kode, label]) => <option key={kode} value={kode}>{label}</option>)}</select></label>
          <Input defaultValue={d("biayaAdminPersen", "1")} id="biayaAdminPersen" label={`Biaya administrasi (% pokok, maks ${BATAS_BIAYA_ADMIN_PERSEN})`} min="0" name="biayaAdminPersen" required step="0.01" type="number" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input defaultValue={d("simpananPokok", "100000")} id="simpananPokok" label="Simpanan pokok (Rp)" min="0" name="simpananPokok" required step="0.01" type="number" />
          <Input defaultValue={d("simpananWajib", "50000")} id="simpananWajib" label="Simpanan wajib per bulan (Rp)" min="0" name="simpananWajib" required step="0.01" type="number" />
        </div>

        <Bagian judul="Denda & pengingat angsuran" keterangan={`Denda dihitung dari angsuran yang terlambat (bukan total pinjaman), baru berlaku setelah masa tenggang, dan total denda sebuah pinjaman dibatasi maksimal ${BATAS_DENDA_PERSEN_POKOK}% dari pokok.`} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input defaultValue={d("dendaPersenPerHari", "0.05")} id="dendaPersenPerHari" label="Denda keterlambatan (% per hari dari angsuran)" min="0" name="dendaPersenPerHari" required step="0.01" type="number" />
          <Input defaultValue={settings?.masaTenggangHari ?? 3} id="masaTenggangHari" label="Masa tenggang tanpa denda (hari)" max="30" min="0" name="masaTenggangHari" required step="1" type="number" />
          <Input defaultValue={d("batasDendaPersen", "10")} id="batasDendaPersen" label={`Batas total denda per pinjaman (% pokok, maks ${BATAS_DENDA_PERSEN_POKOK})`} max={BATAS_DENDA_PERSEN_POKOK} min="0" name="batasDendaPersen" required step="0.01" type="number" />
          <Input defaultValue={settings?.hariPengingatSebelumJatuhTempo ?? 3} id="hariPengingatSebelumJatuhTempo" label="Kirim pengingat N hari sebelum jatuh tempo" min="0" name="hariPengingatSebelumJatuhTempo" required step="1" type="number" />
          <Input defaultValue={settings?.batasHariTerlambatKritis ?? 30} id="batasHariTerlambatKritis" label="Batas hari terlambat kritis" min="1" name="batasHariTerlambatKritis" required step="1" type="number" />
        </div>

        <Bagian judul="Template pesan pengingat (WhatsApp)" keterangan={`Pesan penagihan wajib sopan dan informatif. Penyimpanan ditolak bila memuat kata terlarang (${KATA_TERLARANG.slice(0, 8).join(", ")}, dll.). Placeholder: ${DAFTAR_PLACEHOLDER.join(" ")}. Kosongkan untuk memakai template bawaan. Penagihan hanya Senin–Sabtu 08.00–20.00 WIB di luar hari libur — kelola hari libur di `} />
        <p className="-mt-3 text-xs"><Link className="font-semibold text-primary underline" href="/admin/hari-libur">halaman Hari Libur</Link></p>
        <label className="block space-y-1.5" htmlFor="templatePengingat"><span className="block text-sm font-semibold text-slate-700">Template pesan</span><textarea className="min-h-32 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" defaultValue={settings?.templatePengingat ?? ""} id="templatePengingat" maxLength={1000} name="templatePengingat" placeholder={TEMPLATE_BAWAAN} /></label>

        <Bagian judul="Batas nominal transaksi & persetujuan" keterangan="Dipakai untuk memvalidasi simpanan, penarikan, pengajuan pinjaman, dan pencairan." />
        <Input defaultValue={d("batasPencairanManajer", "10000000")} id="batasPencairanManajer" label="Pencairan di atas nominal ini wajib Manajer (Rp)" min="1" name="batasPencairanManajer" required step="0.01" type="number" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input defaultValue={d("minPinjaman", "1000000")} id="minPinjaman" label="Pinjaman minimal (Rp)" min="1" name="minPinjaman" required step="0.01" type="number" />
          <Input defaultValue={d("maksPinjaman", "50000000")} id="maksPinjaman" label="Pinjaman maksimal (Rp)" min="1" name="maksPinjaman" required step="0.01" type="number" />
          <Input defaultValue={d("minTransaksi", "10000")} id="minTransaksi" label="Simpanan/penarikan minimal (Rp)" min="1" name="minTransaksi" required step="0.01" type="number" />
          <Input defaultValue={d("maksTransaksi", "100000000")} id="maksTransaksi" label="Simpanan/penarikan maksimal (Rp)" min="1" name="maksTransaksi" required step="0.01" type="number" />
        </div>

        <Bagian judul="Kelayakan pinjaman" keterangan="Dipakai oleh pengecekan kelayakan saat anggota mengajukan pinjaman. Anggota juga wajib terverifikasi, sudah membayar simpanan pokok, dan tidak menunggak simpanan wajib lebih dari 2 bulan." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input defaultValue={settings?.minLamaAnggotaBulan ?? 3} id="minLamaAnggotaBulan" label="Lama keanggotaan minimal (bulan)" min="0" name="minLamaAnggotaBulan" required step="1" type="number" />
          <Input defaultValue={d("plafonKaliSimpanan", "3")} id="plafonKaliSimpanan" label="Plafon maksimal (× saldo simpanan)" min="0.01" name="plafonKaliSimpanan" required step="0.01" type="number" />
          <Input defaultValue={d("maksRasioAngsuranPersen", "30")} id="maksRasioAngsuranPersen" label="Angsuran maksimal (% penghasilan bulanan)" max="100" min="0" name="maksRasioAngsuranPersen" required step="0.01" type="number" />
          <Input defaultValue={settings?.maksHariTunggakan ?? 30} id="maksHariTunggakan" label="Batas tunggakan (hari) — juga syarat restrukturisasi" min="0" name="maksHariTunggakan" required step="1" type="number" />
          <Input defaultValue={settings?.periodeTunggakanBulan ?? 12} id="periodeTunggakanBulan" label="Periode pemeriksaan tunggakan (bulan)" min="1" name="periodeTunggakanBulan" required step="1" type="number" />
        </div>
        <TombolKirim>Simpan pengaturan</TombolKirim>
      </AksiForm>
    </CardContent></Card>
  </div>;
}
