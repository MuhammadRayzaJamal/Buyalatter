import { requireRole, STAF } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(...STAF);
  const [pendingVerifikasi, pendingPencairan, pendingPembayaran, tunggakan, pendingKyc, pengaduanTerbuka] = await Promise.all([
    prisma.anggota.count({ where: { statusVerifikasi: "PENDING" } }),
    prisma.pinjaman.count({ where: { status: "DISETUJUI" } }),
    prisma.pembayaran.count({ where: { status: "MENUNGGU" } }),
    prisma.angsuran.count({ where: { status: "TERLAMBAT" } }),
    prisma.verifikasiAnggota.count({ where: { status: "MENUNGGU" } }),
    prisma.pengaduan.count({ where: { status: { not: "SELESAI" } } }),
  ]);
  const badges = { "/admin/verifikasi": pendingVerifikasi, "/admin/verifikasi-anggota": pendingKyc, "/admin/pencairan": pendingPencairan, "/admin/verifikasi-pembayaran": pendingPembayaran, "/admin/tunggakan": tunggakan, "/admin/pengaduan": pengaduanTerbuka };
  return <div className="min-h-screen bg-slate-50"><AdminSidebar adminName={user.nama} role={user.role} badges={badges} /><main className="min-h-screen transition-[padding] duration-200 lg:pl-(--sidebar-w) print:pl-0"><div className="mx-auto max-w-7xl p-5 lg:p-8">{children}</div></main></div>;
}