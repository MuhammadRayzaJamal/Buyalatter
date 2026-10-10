import Link from "next/link";
import { getBannerAktif } from "@/lib/banner";
import { BannerCarousel } from "@/components/public/banner-carousel";
import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { getPengaturanTagihan } from "@/lib/pengaturan";
import { hariTerlambat } from "@/lib/denda";
import { formatRupiah, formatTanggal, initials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { IconBanknote, IconCalendarCheck, IconPiggyBank } from "@/components/ui/icons";
import { NOL, tambah } from "@/lib/uang";
import { GrafikBatang, GrafikDonat, GrafikTren } from "@/components/admin/grafik";

export const dynamic = "force-dynamic";

export default async function MemberDashboard() {
  const anggota = await requireAnggota();
  await syncStatusTerlambat();
  const [{ hariPengingat }, bannerSamping, savings, loans] = await Promise.all([
    getPengaturanTagihan(),
    getBannerAktif("SIDEBAR"),
    prisma.simpanan.findMany({ where: { anggotaId: anggota.id }, orderBy: { tanggal: "desc" } }),
    prisma.pinjaman.findMany({ where: { anggotaId: anggota.id }, include: { angsuran: { where: { status: { in: ["BELUM", "TERLAMBAT"] } }, orderBy: { tanggalJatuhTempo: "asc" } } }, orderBy: { tanggalPengajuan: "desc" } }),
  ]);
  const activeLoan = loans.find((item) => item.status === "DICAIRKAN");
  const nextInstallment = activeLoan?.angsuran[0];
  const tagihan = loans.filter((item) => item.status === "DICAIRKAN").flatMap((item) => item.angsuran.map((a) => ({ ...a, pinjamanId: item.id })));
  const terlambat = tagihan.filter((item) => item.status === "TERLAMBAT");
  const batasPengingat = new Date(); batasPengingat.setHours(0, 0, 0, 0); batasPengingat.setDate(batasPengingat.getDate() + hariPengingat + 1);
  const segera = tagihan.filter((item) => item.status === "BELUM" && item.tanggalJatuhTempo >= new Date() && item.tanggalJatuhTempo < batasPengingat);
  const totalDendaTelat = terlambat.reduce(tambah("denda"), NOL);
  const totalSegera = segera.reduce(tambah("jumlah"), NOL);
  const totalSimpanan = savings.reduce(tambah("jumlah"), NOL);
  const sekarang = new Date();
  const jenisTotal = (j: "POKOK" | "WAJIB" | "SUKARELA") => savings.filter((x) => x.jenis === j).reduce((a, x) => a + x.jumlah.toNumber(), 0);
  const donatSimpanan = [{ nama: "Pokok", nilai: jenisTotal("POKOK"), warna: "biru" as const }, { nama: "Wajib", nilai: jenisTotal("WAJIB"), warna: "langit" as const }, { nama: "Sukarela", nilai: jenisTotal("SUKARELA"), warna: "emas" as const }];
  const trenSaldo = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - (5 - i) + 1, 0, 23, 59, 59);
    return { bulan: d.toLocaleDateString("id-ID", { month: "short" }), saldo: savings.filter((x) => x.tanggal <= d).reduce((a, x) => a + x.jumlah.toNumber(), 0) };
  });
  const riwayatPinjaman = loans.filter((l) => l.status === "DICAIRKAN" || l.status === "LUNAS");
  const progres = riwayatPinjaman.map((l) => ({ nama: `Rp ${(l.jumlah.toNumber() / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`, nilai: l.status === "LUNAS" ? 100 : Math.round((1 - l.angsuran.length / Math.max(1, l.tenorBulan)) * 100), warna: (l.status === "LUNAS" ? "hijau" : "biru") as "hijau" | "biru" }));
  return <div className="space-y-8">{terlambat.length > 0 && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"><strong>{terlambat.length} angsuran terlambat</strong> (terlama {Math.max(...terlambat.map((item) => hariTerlambat(item.tanggalJatuhTempo)))} hari) dengan denda berjalan {formatRupiah(totalDendaTelat)}. <Link className="font-bold underline" href={`/anggota/bayar/${terlambat[0].id}`}>Bayar sekarang</Link></div>}{segera.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"><strong>{segera.length} angsuran akan jatuh tempo</strong> dalam {hariPengingat} hari ke depan ({formatRupiah(totalSegera)}, terdekat {formatTanggal(segera[0].tanggalJatuhTempo)}). <Link className="font-bold underline" href={`/anggota/bayar/${segera[0].id}`}>Bayar sekarang</Link></div>}{anggota.statusVerifikasi === "PENDING" && <div className="rounded-xl bg-amber-50 px-5 py-4 text-sm text-amber-800"><strong>Akun sedang diverifikasi.</strong> Data dan foto KTP kamu sedang ditinjau admin. <Link className="font-bold underline" href="/anggota/profil">Lihat status</Link></div>}{anggota.statusVerifikasi === "DITOLAK" && <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"><strong>Verifikasi KTP ditolak.</strong>{anggota.catatanVerifikasi ? ` Alasan: ${anggota.catatanVerifikasi}` : ""} <Link className="font-bold underline" href="/anggota/profil">Unggah ulang KTP</Link></div>}<div className="flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-secondary">{initials(anggota.user.nama)}</span><div><p className="text-sm font-semibold text-green">Portal Anggota</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Halo, {anggota.user.nama}.</h1><p className="mt-2 text-sm text-slate-500">Pantau perkembangan simpanan dan pinjamanmu di sini.</p></div></div><div className="grid gap-5 md:grid-cols-3"><StatCard label="Total Simpanan" value={formatRupiah(totalSimpanan)} detail="Seluruh jenis simpanan" accent="green" icon={IconPiggyBank} /><StatCard label="Pinjaman Aktif" value={activeLoan ? formatRupiah(activeLoan.jumlah) : "Rp 0"} detail={activeLoan ? `${activeLoan.tenorBulan} bulan tenor` : "Belum ada pinjaman aktif"} accent="navy" icon={IconBanknote} /><StatCard label="Angsuran Berikutnya" value={nextInstallment ? formatRupiah(nextInstallment.jumlah) : "-"} detail={nextInstallment ? `Jatuh tempo ${formatTanggal(nextInstallment.tanggalJatuhTempo)}` : "Tidak ada tagihan"} accent="amber" icon={IconCalendarCheck} /></div><div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><Card><CardHeader><CardTitle>Pertumbuhan saldo simpanan</CardTitle></CardHeader><CardContent><GrafikTren data={trenSaldo} seri={[{ kunci: "saldo", nama: "Saldo simpanan", warna: "biru" }]} tinggi={230} /></CardContent></Card><Card><CardHeader><CardTitle>Komposisi simpanan</CardTitle></CardHeader><CardContent><GrafikDonat data={donatSimpanan} format="rupiah" tengahJudul="Total" tengahNilai={`Rp ${(totalSimpanan.toNumber() / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`} /></CardContent></Card></div>{progres.length > 0 && <Card><CardHeader><CardTitle>Progres pelunasan pinjaman</CardTitle></CardHeader><CardContent><GrafikBatang data={progres} format="persen" horizontal tinggi={Math.max(120, progres.length * 56)} /></CardContent></Card>}<div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Saldo simpanan</CardTitle><Link className="text-xs font-bold text-navy hover:underline" href="/anggota/simpanan">Lihat detail</Link></div></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-3">{["POKOK", "WAJIB", "SUKARELA"].map((jenis) => <div className="rounded-lg bg-slate-50 p-4" key={jenis}><p className="text-xs text-slate-500">{jenis}</p><p className="mt-2 text-lg font-bold text-slate-900">{formatRupiah(savings.filter((item) => item.jenis === jenis).reduce(tambah("jumlah"), NOL))}</p></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Pinjaman aktif</CardTitle></CardHeader><CardContent>{activeLoan ? <><div className="flex items-center justify-between"><p className="text-sm text-slate-500">Total pengembalian</p><Badge variant="success">Dicairkan</Badge></div><p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(activeLoan.totalBayar)}</p><Link className="mt-5 inline-block text-sm font-bold text-navy hover:underline" href={`/anggota/pinjaman/${activeLoan.id}`}>Lihat jadwal angsuran →</Link></> : <p className="text-sm leading-6 text-slate-500">Belum ada pinjaman aktif. <Link className="font-bold text-navy" href="/anggota/pinjaman/ajukan">Ajukan sekarang</Link>.</p>}</CardContent></Card></div><BannerCarousel compact slides={bannerSamping.map((b) => ({ id: b.id, judul: b.judul, subjudul: b.subjudul, gambarUrl: b.gambarUrl, linkTujuan: b.linkTujuan, teksTombol: b.teksTombol }))} /><Button href="/anggota/riwayat" variant="outline">Lihat seluruh riwayat transaksi</Button></div>;
}