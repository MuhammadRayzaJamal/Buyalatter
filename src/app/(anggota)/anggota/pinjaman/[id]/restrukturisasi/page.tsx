import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { hariTerlambat } from "@/lib/denda";
import { formatTanggal } from "@/lib/format";
import { getBatas } from "@/lib/pengaturan";
import { ajukanRestrukturisasi } from "../../../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restrukturisasi Pinjaman" };

const variant = { DIAJUKAN: "warning", DISETUJUI: "success", DITOLAK: "danger" } as const;

export default async function RestrukturisasiPage({ params }: { params: Promise<{ id: string }> }) {
  const anggota = await requireAnggota(); const { id } = await params;
  const pinjaman = await prisma.pinjaman.findFirst({ where: { id, anggotaId: anggota.id }, include: { angsuran: true, restrukturisasi: { orderBy: { createdAt: "desc" } } } });
  if (!pinjaman) notFound();
  const batas = await getBatas();
  const tunggakan = pinjaman.angsuran.filter((a) => a.status !== "LUNAS").reduce((maks, a) => Math.max(maks, hariTerlambat(a.tanggalJatuhTempo)), 0);
  const menunggu = pinjaman.restrukturisasi.some((r) => r.status === "DIAJUKAN");
  const boleh = pinjaman.status === "DICAIRKAN" && tunggakan > batas.maksHariTunggakan && !menunggu;
  return <div className="mx-auto max-w-2xl space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${id}`}>← Kembali ke detail pinjaman</Link>
    <div><p className="text-sm font-semibold text-green">Restrukturisasi</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Perpanjangan tenor</h1><p className="mt-2 text-sm text-slate-500">Untuk tunggakan lebih dari {batas.maksHariTunggakan} hari. Pengajuan diputuskan oleh Manajer; sisa tagihan dibagi ulang sesuai tenor baru.</p></div>
    <Card><CardContent className="grid gap-4 p-5 text-sm sm:grid-cols-3"><div><p className="text-xs text-slate-400">Tenor saat ini</p><p className="mt-1 font-bold">{pinjaman.tenorBulan} bulan</p></div><div><p className="text-xs text-slate-400">Tunggakan terlama</p><p className="mt-1 font-bold">{tunggakan} hari</p></div><div><p className="text-xs text-slate-400">Status pinjaman</p><p className="mt-1 font-bold">{pinjaman.status}</p></div></CardContent></Card>
    {boleh ? <Card><CardHeader><CardTitle>Ajukan restrukturisasi</CardTitle></CardHeader><CardContent><AksiForm aksi={ajukanRestrukturisasi.bind(null, id)} className="space-y-4"><Input id="tenorBaru" label={`Tenor baru (bulan, lebih dari ${pinjaman.tenorBulan}, maks ${Math.min(60, pinjaman.tenorBulan + 24)})`} max={Math.min(60, pinjaman.tenorBulan + 24)} min={pinjaman.tenorBulan + 1} name="tenorBaru" required type="number" /><label className="block space-y-1.5" htmlFor="alasan"><span className="block text-sm font-semibold text-slate-700">Alasan</span><textarea className="min-h-24 w-full rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" id="alasan" maxLength={191} minLength={10} name="alasan" placeholder="Jelaskan kondisi yang menyebabkan keterlambatan" required /></label><TombolKirim teksProses="Mengirim...">Kirim pengajuan</TombolKirim></AksiForm></CardContent></Card>
    : <Card><CardContent className="p-6 text-sm text-slate-600">{menunggu ? "Sudah ada pengajuan yang menunggu keputusan manajer." : pinjaman.status !== "DICAIRKAN" ? "Pinjaman ini tidak sedang berjalan." : `Restrukturisasi hanya tersedia untuk tunggakan lebih dari ${batas.maksHariTunggakan} hari.`}</CardContent></Card>}
    {pinjaman.restrukturisasi.length > 0 && <Card><CardHeader><CardTitle>Riwayat pengajuan</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{pinjaman.restrukturisasi.map((r) => <div className="flex items-center justify-between" key={r.id}><span>{formatTanggal(r.createdAt)} · {r.tenorLama} → {r.tenorBaru} bulan</span><Badge variant={variant[r.status]}>{r.status}</Badge></div>)}</CardContent></Card>}
  </div>;
}
