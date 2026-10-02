import Link from "next/link";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PinjamanAnggotaPage() {
  const anggota = await requireAnggota();
  const pinjaman = await prisma.pinjaman.findMany({ where: { anggotaId: anggota.id }, orderBy: { tanggalPengajuan: "desc" } });
  return <div className="space-y-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-green">Pembiayaan saya</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Daftar pinjaman</h1><p className="mt-2 text-sm text-slate-500">Lihat status dan jadwal pembayaran pinjamanmu.</p></div><Button href="/anggota/pinjaman/ajukan">Ajukan pinjaman</Button></div><div className="space-y-4">{pinjaman.length ? pinjaman.map((item) => <Card key={item.id}><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><h2 className="font-bold text-slate-900">{formatRupiah(item.jumlah)}</h2><Badge variant={item.status === "LUNAS" ? "success" : item.status === "DITOLAK" ? "danger" : item.status === "DIAJUKAN" ? "warning" : "info"}>{item.status}</Badge></div><p className="mt-2 text-sm text-slate-500">Pengajuan {formatTanggal(item.tanggalPengajuan)} · tenor {item.tenorBulan} bulan</p></div><Link className="text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${item.id}`}>Lihat detail →</Link></CardContent></Card>) : <Card><CardContent className="p-10 text-center text-sm text-slate-500">Belum ada pinjaman. <Link className="font-bold text-navy" href="/anggota/pinjaman/ajukan">Ajukan sekarang</Link>.</CardContent></Card>}</div></div>;
}