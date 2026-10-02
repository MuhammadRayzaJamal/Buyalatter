import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { bagikanShu, hitungShu } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "SHU" };

export default async function ShuAdminPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await requireRole(...AKSES.shu);
  const params = await searchParams;
  const periode = await prisma.periodeShu.findMany({ orderBy: { tahun: "desc" }, include: { _count: { select: { anggota: true } } } });
  const terpilih = periode.find((p) => p.id === params.periode) ?? periode[0];
  const baris = terpilih ? await prisma.shuAnggota.findMany({ where: { periodeId: terpilih.id }, include: { anggota: { include: { user: true } } }, orderBy: { total: "desc" }, take: 100 }) : [];
  const tahunIni = new Date().getFullYear();
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keuangan koperasi</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Sisa Hasil Usaha (SHU)</h1><p className="mt-2 text-sm text-slate-500">Hitung SHU tahunan (draft), tinjau pembagiannya, lalu bagikan ke simpanan sukarela anggota. Jasa modal sebanding saldo simpanan akhir tahun; jasa pinjaman sebanding bunga yang dibayar sepanjang tahun.</p></div>
    <Card><CardHeader><CardTitle>Hitung SHU</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={hitungShu} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input defaultValue={tahunIni - 1} id="tahun" label="Tahun buku" max={tahunIni} min="2000" name="tahun" required type="number" />
        <Input id="totalShu" label="Total SHU (Rp)" min="1" name="totalShu" required step="0.01" type="number" />
        <Input defaultValue="70" id="persenJasaModal" label="Jasa modal (%)" max="100" min="0" name="persenJasaModal" required step="0.01" type="number" />
        <Input defaultValue="30" id="persenJasaPinjaman" label="Jasa pinjaman (%)" max="100" min="0" name="persenJasaPinjaman" required step="0.01" type="number" />
        <div className="flex items-end"><TombolKirim teksProses="Menghitung...">Hitung (draft)</TombolKirim></div>
      </AksiForm>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Periode SHU</CardTitle></CardHeader><CardContent className="p-0">{periode.length ? <div className="divide-y divide-slate-100">{periode.map((p) => <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
      <div><a className="font-bold text-navy hover:underline" href={`/admin/shu?periode=${p.id}`}>SHU {p.tahun} · {formatRupiah(p.totalShu)}</a><p className="text-xs text-slate-500">Modal {p.persenJasaModal.toString()}% · Pinjaman {p.persenJasaPinjaman.toString()}% · {p._count.anggota} penerima{p.dibagikanPada ? ` · dibagikan ${formatTanggal(p.dibagikanPada)}` : ""}</p></div>
      <div className="flex items-center gap-3"><Badge variant={p.status === "DIBAGIKAN" ? "success" : "warning"}>{p.status}</Badge>{p.status === "DRAFT" && <AksiForm aksi={bagikanShu.bind(null, p.id)}><TombolKirim size="sm" teksProses="Membagikan..." variant="secondary">Bagikan ke simpanan sukarela</TombolKirim></AksiForm>}</div>
    </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada periode SHU.</p>}</CardContent></Card>
    {terpilih && <Card><CardHeader><CardTitle>Pembagian SHU {terpilih.tahun} ({terpilih.status})</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Anggota</th><th className="px-5 py-3">Jasa modal</th><th className="px-5 py-3">Jasa pinjaman</th><th className="px-5 py-3">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{baris.map((b) => <tr key={b.id}><td className="px-5 py-3 font-semibold text-slate-800">{b.anggota.user.nama}</td><td className="px-5 py-3">{formatRupiah(b.jasaModal, true)}</td><td className="px-5 py-3">{formatRupiah(b.jasaPinjaman, true)}</td><td className="px-5 py-3 font-bold">{formatRupiah(b.total, true)}</td></tr>)}</tbody></table>{baris.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Tidak ada penerima.</p>}</div></CardContent></Card>}
  </div>;
}
