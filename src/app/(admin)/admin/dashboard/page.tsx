import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { IconArrowDownCircle, IconBanknote, IconPiggyBank, IconUsers } from "@/components/ui/icons";
import { hitungKesehatan } from "@/lib/kesehatan";
import { KesehatanKoperasi } from "@/components/admin/kesehatan-koperasi";
import { GrafikBatang, GrafikDonat, GrafikTren, Meteran, Sparkline } from "@/components/admin/grafik";

export const dynamic = "force-dynamic";

const HARI_MS = 24 * 60 * 60 * 1000;
const LABEL_JENIS = { POKOK: "Pokok", WAJIB: "Wajib", SUKARELA: "Sukarela" } as const;
const LABEL_PINJAMAN = { LUNAS: "Lunas", DICAIRKAN: "Berjalan", DISETUJUI: "Disetujui", DIAJUKAN: "Diajukan", DITOLAK: "Ditolak" } as const;
const WARNA_PINJAMAN = { LUNAS: "hijau", DICAIRKAN: "biru", DISETUJUI: "langit", DIAJUKAN: "emas", DITOLAK: "merah" } as const;
const LABEL_ANGSURAN = { LUNAS: "Lunas", BELUM: "Belum jatuh tempo", MENUNGGU_VERIFIKASI: "Menunggu verifikasi", TERLAMBAT: "Terlambat" } as const;
const WARNA_ANGSURAN = { LUNAS: "hijau", BELUM: "biru", MENUNGGU_VERIFIKASI: "emas", TERLAMBAT: "merah" } as const;

const kunciBulan = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const angka = (v: { toNumber(): number } | null | undefined) => v?.toNumber() ?? 0;

export default async function AdminDashboard() {
  const user = await requireRole(...AKSES.dashboard);
  const sekarang = new Date();
  const awalEnamBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() - 5, 1);

  const [
    anggotaAktif, semuaTanggalMasuk, simpananTotal, simpananJenis, simpananEnam, pencairanEnam,
    pinjamanStatus, pinjamanBerjalan, angsuranStatus, angsuranTerlambat, topSimpanan, kesehatan,
    pendingPembayaran, pendingKyc, pengaduanTerbuka, pendingPengajuan, aktivitasSimpanan, aktivitasPinjaman,
  ] = await Promise.all([
    prisma.anggota.count({ where: { status: "AKTIF", deletedAt: null } }),
    prisma.anggota.findMany({ where: { deletedAt: null }, select: { tanggalMasuk: true } }),
    prisma.simpanan.aggregate({ _sum: { jumlah: true } }),
    prisma.simpanan.groupBy({ by: ["jenis"], _sum: { jumlah: true } }),
    prisma.simpanan.findMany({ where: { tanggal: { gte: awalEnamBulan } }, select: { tanggal: true, jumlah: true } }),
    prisma.pencairan.findMany({ where: { tanggalPencairan: { gte: awalEnamBulan } }, select: { tanggalPencairan: true, pinjaman: { select: { jumlah: true } } } }),
    prisma.pinjaman.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.pinjaman.aggregate({ where: { status: "DICAIRKAN" }, _count: { _all: true }, _sum: { jumlah: true } }),
    prisma.angsuran.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.angsuran.findMany({ where: { status: "TERLAMBAT" }, select: { tanggalJatuhTempo: true, jumlah: true, denda: true } }),
    prisma.simpanan.groupBy({ by: ["anggotaId"], _sum: { jumlah: true }, orderBy: { _sum: { jumlah: "desc" } }, take: 5 }),
    hitungKesehatan(),
    prisma.pembayaran.count({ where: { status: "MENUNGGU" } }),
    prisma.verifikasiAnggota.count({ where: { status: "MENUNGGU" } }),
    prisma.pengaduan.count({ where: { status: { not: "SELESAI" } } }),
    prisma.pinjaman.count({ where: { status: "DIAJUKAN" } }),
    prisma.simpanan.findMany({ orderBy: { tanggal: "desc" }, take: 3 }),
    prisma.pinjaman.findMany({ orderBy: { tanggalPengajuan: "desc" }, take: 3 }),
  ]);

  const namaTop = await prisma.anggota.findMany({ where: { id: { in: topSimpanan.map((t) => t.anggotaId) } }, select: { id: true, user: { select: { nama: true } } } });
  const peta = new Map(namaTop.map((a) => [a.id, a.user.nama]));

  const bulan = Array.from({ length: 6 }, (_, i) => { const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - (5 - i), 1); return { kunci: kunciBulan(d), label: d.toLocaleDateString("id-ID", { month: "short" }), akhir: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) }; });
  const tren = bulan.map((b) => ({
    bulan: b.label,
    simpanan: simpananEnam.filter((s) => kunciBulan(s.tanggal) === b.kunci).reduce((a, s) => a + angka(s.jumlah), 0),
    pinjaman: pencairanEnam.filter((p) => kunciBulan(p.tanggalPencairan) === b.kunci).reduce((a, p) => a + angka(p.pinjaman.jumlah), 0),
  }));
  const pertumbuhan = bulan.map((b) => ({ bulan: b.label, anggota: semuaTanggalMasuk.filter((a) => a.tanggalMasuk <= b.akhir).length }));

  const totalSimpanan = angka(simpananTotal._sum.jumlah);
  const donatSimpanan = simpananJenis.map((j) => ({ nama: LABEL_JENIS[j.jenis], nilai: angka(j._sum.jumlah), warna: j.jenis === "POKOK" ? ("biru" as const) : j.jenis === "WAJIB" ? ("langit" as const) : ("emas" as const) }));
  const urutanPinjaman = ["DICAIRKAN", "LUNAS", "DISETUJUI", "DIAJUKAN", "DITOLAK"] as const;
  const donatPinjaman = urutanPinjaman.map((s) => ({ nama: LABEL_PINJAMAN[s], nilai: pinjamanStatus.find((p) => p.status === s)?._count._all ?? 0, warna: WARNA_PINJAMAN[s] }));
  const totalPinjaman = donatPinjaman.reduce((a, d) => a + d.nilai, 0);
  const donatAngsuran = (["LUNAS", "BELUM", "MENUNGGU_VERIFIKASI", "TERLAMBAT"] as const).map((s) => ({ nama: LABEL_ANGSURAN[s], nilai: angsuranStatus.find((a) => a.status === s)?._count._all ?? 0, warna: WARNA_ANGSURAN[s] }));
  const totalAngsuran = donatAngsuran.reduce((a, d) => a + d.nilai, 0);
  const lunasPersen = totalAngsuran ? Math.round((donatAngsuran[0].nilai / totalAngsuran) * 1000) / 10 : 0;

  const kelompok = [
    { nama: "1–7 hari", min: 1, maks: 7, warna: "emas" as const },
    { nama: "8–30 hari", min: 8, maks: 30, warna: "langit" as const },
    { nama: "31–90 hari", min: 31, maks: 90, warna: "biru" as const },
    { nama: "> 90 hari", min: 91, maks: Infinity, warna: "merah" as const },
  ];
  const umur = kelompok.map((k) => ({
    nama: k.nama, warna: k.warna,
    nilai: angsuranTerlambat.filter((a) => { const h = Math.floor((sekarang.getTime() - a.tanggalJatuhTempo.getTime()) / HARI_MS); return h >= k.min && h <= k.maks; }).reduce((s, a) => s + angka(a.jumlah) + angka(a.denda), 0),
  }));
  const totalTunggakan = angsuranTerlambat.reduce((s, a) => s + angka(a.jumlah) + angka(a.denda), 0);

  const penabung = topSimpanan.map((t) => ({ nama: (peta.get(t.anggotaId) ?? "Anggota").split(" ").slice(0, 2).join(" "), nilai: angka(t._sum.jumlah) }));
  const aktivitas = [
    ...aktivitasSimpanan.map((item) => ({ id: item.id, label: `Setoran ${item.jenis}`, date: item.tanggal, amount: angka(item.jumlah), status: "Selesai" })),
    ...aktivitasPinjaman.map((item) => ({ id: item.id, label: "Pengajuan pinjaman", date: item.tanggalPengajuan, amount: angka(item.jumlah), status: item.status })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  const antrean = [
    { label: "Pengajuan pinjaman", nilai: pendingPengajuan, href: "/admin/pinjaman" },
    { label: "Bukti bayar menunggu", nilai: pendingPembayaran, href: "/admin/verifikasi-pembayaran" },
    { label: "KYC menunggu", nilai: pendingKyc, href: "/admin/verifikasi-anggota" },
    { label: "Pengaduan terbuka", nilai: pengaduanTerbuka, href: "/admin/pengaduan" },
  ];
  const warnaKesehatan = kesehatan.level === "aman" ? ("hijau" as const) : kesehatan.level === "kuning" ? ("emas" as const) : ("merah" as const);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">Panel pengelola</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Selamat datang, {user.nama.split(" ")[0]}</h1>
          <p className="mt-1.5 text-sm text-slate-500">Ringkasan aktivitas dan kesehatan keuangan koperasi · {sekarang.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Link className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-slate-50" href="/admin/laporan">Buka laporan</Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Anggota Aktif" value={String(anggotaAktif)} detail="Terdaftar di koperasi" icon={IconUsers} grafik={<Sparkline data={pertumbuhan.map((p) => p.anggota)} warna="langit" />} />
        <StatCard label="Total Simpanan" value={formatRupiah(totalSimpanan)} detail="Seluruh jenis simpanan" accent="green" icon={IconPiggyBank} grafik={<Sparkline data={tren.map((t) => t.simpanan)} warna="biru" />} />
        <StatCard label="Pinjaman Berjalan" value={String(pinjamanBerjalan._count._all)} detail={formatRupiah(angka(pinjamanBerjalan._sum.jumlah))} accent="amber" icon={IconBanknote} grafik={<Sparkline data={tren.map((t) => t.pinjaman)} warna="emas" />} />
        <StatCard label="Menunggu Persetujuan" value={String(pendingPengajuan)} detail="Pengajuan perlu ditinjau" icon={IconArrowDownCircle} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {antrean.map((a) => (
          <Link className="group flex items-center justify-between rounded-2xl border bg-white px-5 py-4 shadow-kartu transition hover:border-slate-300" href={a.href} key={a.label}>
            <span className="text-sm font-medium text-slate-500">{a.label}</span>
            <span className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold ${a.nilai > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{a.nilai}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2"><KesehatanKoperasi data={kesehatan} /></div>
        <Card>
          <CardHeader><CardTitle>Indikator kehati-hatian</CardTitle></CardHeader>
          <CardContent><Meteran judul="Pinjaman / simpanan" keterangan={kesehatan.level === "aman" ? "Batas peringatan 80%" : kesehatan.level === "kuning" ? "Melewati 80%" : "Melewati 90%"} persen={kesehatan.rasio ?? 0} warna={warnaKesehatan} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Simpanan masuk dan pinjaman cair, 6 bulan terakhir</CardTitle></CardHeader>
          <CardContent><GrafikTren data={tren} seri={[{ kunci: "simpanan", nama: "Simpanan masuk", warna: "biru" }, { kunci: "pinjaman", nama: "Pinjaman cair", warna: "emas" }]} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Komposisi simpanan</CardTitle></CardHeader>
          <CardContent><GrafikDonat data={donatSimpanan} format="rupiah" tengahJudul="Total" tengahNilai={`Rp ${(totalSimpanan / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Status pinjaman</CardTitle></CardHeader>
          <CardContent><GrafikDonat data={donatPinjaman} tengahJudul="Pinjaman" tengahNilai={String(totalPinjaman)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status angsuran</CardTitle></CardHeader>
          <CardContent><GrafikDonat data={donatAngsuran} tengahJudul="Lunas" tengahNilai={`${lunasPersen}%`} /></CardContent>
        </Card>
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Umur tunggakan</CardTitle><span className="text-xs font-semibold text-red-600">{formatRupiah(totalTunggakan)}</span></div></CardHeader>
          <CardContent><GrafikBatang data={umur} format="rupiah" tinggi={300} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Pertumbuhan anggota</CardTitle></CardHeader>
          <CardContent><GrafikTren data={pertumbuhan} format="angka" seri={[{ kunci: "anggota", nama: "Total anggota", warna: "langit" }]} tinggi={330} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>5 penabung terbesar</CardTitle></CardHeader>
          <CardContent><GrafikBatang data={penabung} format="rupiah" horizontal tinggi={350} warna="emas" /></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Aktivitas terbaru</CardTitle><Link className="text-xs font-bold text-navy hover:underline" href="/admin/laporan">Lihat laporan</Link></div></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {aktivitas.map((a) => (
                <div className="flex items-center justify-between gap-3 px-5 py-3.5" key={a.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatTanggal(a.date)} · {formatRupiah(a.amount)}</p>
                  </div>
                  <Badge variant={a.status === "DISETUJUI" ? "info" : a.status === "DIAJUKAN" ? "warning" : a.status === "DITOLAK" ? "danger" : "success"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
