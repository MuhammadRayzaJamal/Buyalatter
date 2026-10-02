import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { mimeBerkas } from "@/lib/berkas";
import { hariTerlambat } from "@/lib/denda";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getBatas } from "@/lib/pengaturan";
import { hitungPelunasan } from "@/lib/pelunasan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const statusVariant = { DIAJUKAN: "warning", DISETUJUI: "info", DICAIRKAN: "info", DITOLAK: "danger", LUNAS: "success" } as const;
const angsuranStatusVariant = { BELUM: "warning", MENUNGGU_VERIFIKASI: "info", LUNAS: "success", TERLAMBAT: "danger" } as const;
const angsuranStatusLabel = { BELUM: "Belum bayar", MENUNGGU_VERIFIKASI: "Menunggu verifikasi", LUNAS: "Lunas", TERLAMBAT: "Terlambat" } as const;
const restrukturVariant = { DIAJUKAN: "warning", DISETUJUI: "success", DITOLAK: "danger" } as const;

export default async function DetailPinjamanPage({ params }: { params: Promise<{ id: string }> }) {
  const anggota = await requireAnggota(); const { id } = await params;
  await syncStatusTerlambat();
  // Filter anggotaId di query: pinjaman milik anggota lain tidak pernah terbaca (cegah IDOR).
  const pinjaman = await prisma.pinjaman.findFirst({ where: { id, anggotaId: anggota.id }, include: { angsuran: { orderBy: { angsuranKe: "asc" } }, pencairan: { include: { rekeningAnggota: true } }, akad: true, restrukturisasi: { orderBy: { createdAt: "desc" }, take: 3 } } });
  if (!pinjaman) notFound();
  const batas = await getBatas();
  const buktiIsPdf = (await mimeBerkas(pinjaman.pencairan?.buktiTransferUrl)) === "application/pdf";
  const firstPayableKe = pinjaman.angsuran.find((item) => item.status === "BELUM" || item.status === "TERLAMBAT")?.angsuranKe;
  const berjalan = pinjaman.status === "DICAIRKAN";
  const pelunasan = berjalan ? hitungPelunasan(pinjaman, pinjaman.angsuran) : null;
  const adaMenunggu = pinjaman.angsuran.some((a) => a.status === "MENUNGGU_VERIFIKASI");
  const tunggakan = pinjaman.angsuran.filter((a) => a.status !== "LUNAS").reduce((maks, a) => Math.max(maks, hariTerlambat(a.tanggalJatuhTempo)), 0);
  const bolehRestruktur = berjalan && tunggakan > batas.maksHariTunggakan && !pinjaman.restrukturisasi.some((r) => r.status === "DIAJUKAN");
  const perluAkad = pinjaman.status === "DISETUJUI" && !pinjaman.akad;

  return <div className="space-y-8">
    <Link className="text-sm font-bold text-navy hover:underline" href="/anggota/pinjaman">← Kembali ke pinjaman</Link>
    <div><p className="text-sm font-semibold text-green">Detail pinjaman</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-slate-900">{formatRupiah(pinjaman.jumlah)}</h1><Badge variant={statusVariant[pinjaman.status]}>{pinjaman.status}</Badge></div><p className="mt-2 text-sm text-slate-500">Diajukan {formatTanggal(pinjaman.tanggalPengajuan)}</p></div>

    {perluAkad && <Card className="border-sky-200 bg-sky-50"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">Pinjaman disetujui — setujui akad digital</p><p className="mt-1 text-sm text-slate-600">Dana baru dapat dicairkan setelah Anda membaca dan menyetujui akad.</p></div><Button href={`/anggota/pinjaman/${id}/akad`}>Baca &amp; setujui akad</Button></CardContent></Card>}

    <div className="grid gap-5 sm:grid-cols-3"><Card className="p-5"><p className="text-xs text-slate-500">Total bayar</p><p className="mt-2 text-xl font-bold text-slate-900">{formatRupiah(pinjaman.totalBayar)}</p></Card><Card className="p-5"><p className="text-xs text-slate-500">Tenor</p><p className="mt-2 text-xl font-bold text-slate-900">{pinjaman.tenorBulan} bulan</p></Card><Card className="p-5"><p className="text-xs text-slate-500">Bunga</p><p className="mt-2 text-xl font-bold text-slate-900">{pinjaman.bungaPersen.toString()}% / bulan</p></Card></div>

    {(pinjaman.akad || pelunasan || bolehRestruktur) && <div className="flex flex-wrap gap-3">
      {pinjaman.akad && <Button href={`/api/akad/${id}`} variant="outline">Unduh akad (PDF)</Button>}
      {pelunasan && <Button disabled={adaMenunggu} href={adaMenunggu ? undefined : `/anggota/pinjaman/${id}/lunasi`} variant="secondary">Lunasi Sekarang · {formatRupiah(pelunasan.total)}</Button>}
      {bolehRestruktur && <Button href={`/anggota/pinjaman/${id}/restrukturisasi`} variant="outline">Ajukan restrukturisasi</Button>}
    </div>}
    {pinjaman.restrukturisasi.length > 0 && <Card><CardHeader><CardTitle>Restrukturisasi</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{pinjaman.restrukturisasi.map((r) => <div className="flex items-center justify-between" key={r.id}><span>Tenor {r.tenorLama} → {r.tenorBaru} bulan · {formatTanggal(r.createdAt)}</span><Badge variant={restrukturVariant[r.status]}>{r.status}</Badge></div>)}</CardContent></Card>}

    {pinjaman.pencairan && <Card><CardHeader><CardTitle>Informasi pencairan</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-400">Dicairkan ke</p><p className="mt-1 font-bold text-slate-800">{pinjaman.pencairan.rekeningAnggota.namaBank} · {pinjaman.pencairan.rekeningAnggota.noRekening}</p></div><div><p className="text-xs text-slate-400">Tanggal pencairan</p><p className="mt-1 font-bold text-slate-800">{formatTanggal(pinjaman.pencairan.tanggalPencairan)}</p></div><div><p className="text-xs text-slate-400">Jumlah dicairkan</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pinjaman.pencairan.jumlahDicairkan)}</p></div><div><p className="text-xs text-slate-400">Biaya admin</p><p className="mt-1 font-bold text-slate-800">{formatRupiah(pinjaman.pencairan.biayaAdmin)}</p></div>{pinjaman.pencairan.buktiTransferUrl && <div className="sm:col-span-2"><p className="text-xs text-slate-400">Bukti transfer</p>{buktiIsPdf ? <a className="mt-1 inline-block text-sm font-bold text-navy hover:underline" href={pinjaman.pencairan.buktiTransferUrl} rel="noopener noreferrer" target="_blank">Lihat berkas PDF →</a> : (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="Bukti transfer" className="mt-2 max-h-64 rounded-lg border object-contain" src={pinjaman.pencairan.buktiTransferUrl} />
    )}</div>}</CardContent></Card>}

    <Card><CardHeader><CardTitle>Jadwal angsuran</CardTitle></CardHeader><CardContent className="p-0">{pinjaman.angsuran.length ? <div className="divide-y divide-slate-100">{pinjaman.angsuran.map((item) => <div className="flex items-center justify-between px-5 py-4" key={item.id}><div><p className="font-semibold text-slate-800">Angsuran ke-{item.angsuranKe}</p><p className="mt-1 text-xs text-slate-500">Jatuh tempo {formatTanggal(item.tanggalJatuhTempo)}{item.denda.gt(0) && <span className="text-red-600"> · denda {formatRupiah(item.denda)}</span>}{item.terbayar.gt(0) && item.status !== "LUNAS" && <span className="text-emerald-700"> · terbayar {formatRupiah(item.terbayar)}</span>}</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="font-bold text-slate-800">{formatRupiah(item.jumlah.plus(item.denda).minus(item.status === "LUNAS" ? 0 : item.terbayar))}</p><Badge variant={angsuranStatusVariant[item.status]}>{angsuranStatusLabel[item.status]}</Badge></div>{item.angsuranKe === firstPayableKe && <Button href={`/anggota/bayar/${item.id}`} size="sm">Bayar</Button>}</div></div>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">Jadwal angsuran akan dibuat setelah pinjaman dicairkan.</p>}</CardContent></Card>
  </div>;
}
