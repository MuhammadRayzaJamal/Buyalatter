import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { MonthlyChart } from "@/components/admin/monthly-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { IconArrowDownCircle, IconBanknote, IconPiggyBank, IconUsers } from "@/components/ui/icons";
import { NOL, tambah } from "@/lib/uang";
import { hitungKesehatan } from "@/lib/kesehatan";
import { KesehatanKoperasi } from "@/components/admin/kesehatan-koperasi";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRole(...AKSES.dashboard);
  const [members, savings, activeLoans, pending, recentSavings, recentLoans, kesehatan] = await Promise.all([
    prisma.anggota.count({ where: { status: "AKTIF" } }),
    prisma.simpanan.aggregate({ _sum: { jumlah: true } }),
    prisma.pinjaman.findMany({ where: { status: "DISETUJUI" } }),
    prisma.pinjaman.count({ where: { status: "DIAJUKAN" } }),
    prisma.simpanan.findMany({ orderBy: { tanggal: "desc" }, take: 100 }),
    prisma.pinjaman.findMany({ orderBy: { tanggalPengajuan: "desc" }, take: 100 }),
    hitungKesehatan(),
  ]);
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setMonth(date.getMonth() - (5 - index)); return { date, label: date.toLocaleDateString("id-ID", { month: "short" }) }; });
  const chartData = months.map(({ date, label }) => ({ bulan: label, simpanan: recentSavings.filter((item) => item.tanggal.getMonth() === date.getMonth() && item.tanggal.getFullYear() === date.getFullYear()).reduce(tambah("jumlah"), NOL).toNumber(), pinjaman: recentLoans.filter((item) => item.tanggalPengajuan.getMonth() === date.getMonth() && item.tanggalPengajuan.getFullYear() === date.getFullYear()).reduce(tambah("jumlah"), NOL).toNumber() }));
  const activities = [...recentSavings.slice(0, 3).map((item) => ({ id: item.id, label: `Setoran ${item.jenis}`, date: item.tanggal, amount: item.jumlah.toNumber(), status: "Selesai" })), ...recentLoans.slice(0, 3).map((item) => ({ id: item.id, label: "Pengajuan pinjaman", date: item.tanggalPengajuan, amount: item.jumlah.toNumber(), status: item.status }))].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  return <div className="space-y-8"><div><p className="text-sm font-semibold text-green">Panel pengelola</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Dashboard admin</h1><p className="mt-2 text-sm text-slate-500">Ringkasan aktivitas dan kesehatan keuangan koperasi.</p></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Anggota Aktif" value={String(members)} detail="Terdaftar di koperasi" icon={IconUsers} /><StatCard label="Total Simpanan" value={formatRupiah(savings._sum.jumlah ?? 0)} detail="Seluruh jenis simpanan" accent="green" icon={IconPiggyBank} /><StatCard label="Pinjaman Berjalan" value={String(activeLoans.length)} detail={formatRupiah(activeLoans.reduce(tambah("jumlah"), NOL))} accent="amber" icon={IconBanknote} /><StatCard label="Menunggu Persetujuan" value={String(pending)} detail="Pengajuan perlu ditinjau" icon={IconArrowDownCircle} /></div><KesehatanKoperasi data={kesehatan} /><Card><CardHeader><CardTitle>Simpanan dan pinjaman per bulan</CardTitle></CardHeader><CardContent><MonthlyChart data={chartData} /></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Aktivitas terbaru</CardTitle><Link className="text-xs font-bold text-navy hover:underline" href="/admin/laporan">Lihat laporan</Link></div></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-100">{activities.map((activity) => <div className="flex items-center justify-between px-5 py-4" key={activity.id}><div><p className="text-sm font-semibold text-slate-800">{activity.label}</p><p className="mt-1 text-xs text-slate-500">{formatTanggal(activity.date)} · {formatRupiah(activity.amount)}</p></div><Badge variant={activity.status === "DISETUJUI" ? "info" : activity.status === "DIAJUKAN" ? "warning" : "success"}>{activity.status}</Badge></div>)}</div></CardContent></Card></div>;
}