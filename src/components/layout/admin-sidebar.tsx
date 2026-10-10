"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Award, MapPin, PanelBottom } from "lucide-react";
import { initials } from "@/lib/format";
import { bolehAkses, LABEL_PERAN, type Peran } from "@/lib/akses";
import { Logo } from "@/components/ui/logo";
import { TombolTema } from "@/components/ui/tombol-tema";
import { useSidebarCollapse } from "@/components/layout/use-sidebar-collapse";
import {
  IconArrowDownCircle,
  IconBank,
  IconBanknote,
  IconBarChart,
  IconBell,
  IconCalendarCheck,
  IconChevronsLeft,
  IconChevronsRight,
  IconClock,
  IconGrid,
  IconImage,
  IconLogOut,
  IconMail,
  IconMenu,
  IconNewspaper,
  IconPiggyBank,
  IconReceipt,
  IconSend,
  IconSettings,
  IconShieldCheck,
  IconStar,
  IconTrendingUp,
  IconUsers,
  IconX,
} from "@/components/ui/icons";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: IconGrid },
  { label: "Data Anggota", href: "/admin/anggota", icon: IconUsers },
  { label: "Verifikasi", href: "/admin/verifikasi", icon: IconShieldCheck },
  { label: "Verifikasi KYC", href: "/admin/verifikasi-anggota", icon: IconShieldCheck },
  { label: "Simpanan", href: "/admin/simpanan", icon: IconPiggyBank },
  { label: "Penarikan", href: "/admin/penarikan", icon: IconArrowDownCircle },
  { label: "Pinjaman", href: "/admin/pinjaman", icon: IconBanknote },
  { label: "Pencairan", href: "/admin/pencairan", icon: IconSend },
  { label: "Angsuran", href: "/admin/angsuran", icon: IconCalendarCheck },
  { label: "Tunggakan", href: "/admin/tunggakan", icon: IconClock },
  { label: "Restrukturisasi", href: "/admin/restrukturisasi", icon: IconCalendarCheck },
  { label: "SHU", href: "/admin/shu", icon: IconTrendingUp },
  { label: "Pengingat", href: "/admin/pengingat", icon: IconBell },
  { label: "Log Penagihan", href: "/admin/log-penagihan", icon: IconReceipt },
  { label: "Pengaduan", href: "/admin/pengaduan", icon: IconMail },
  { label: "Hari Libur", href: "/admin/hari-libur", icon: IconCalendarCheck },
  { label: "Verifikasi Pembayaran", href: "/admin/verifikasi-pembayaran", icon: IconReceipt },
  { label: "Rekening Koperasi", href: "/admin/rekening-koperasi", icon: IconBank },
  { label: "Galeri", href: "/admin/galeri", icon: IconImage },
  { label: "Berita", href: "/admin/berita", icon: IconNewspaper },
  { label: "Banner", href: "/admin/banner", icon: IconImage },
  { label: "Testimoni", href: "/admin/testimoni", icon: IconStar },
  { label: "Mitra", href: "/admin/mitra", icon: IconBank },
  { label: "Pencapaian", href: "/admin/pencapaian", icon: IconTrendingUp },
  { label: "Penghargaan", href: "/admin/penghargaan", icon: Award },
  { label: "Kantor Cabang", href: "/admin/kantor-cabang", icon: MapPin },
  { label: "Tampilan Footer", href: "/admin/tampilan-footer", icon: PanelBottom },
  { label: "Pesan", href: "/admin/pesan", icon: IconMail },
  { label: "Laporan", href: "/admin/laporan", icon: IconBarChart },
  { label: "Buku Mutasi", href: "/admin/mutasi", icon: IconReceipt },
  { label: "Audit Log", href: "/admin/audit-log", icon: IconShieldCheck },
  { label: "Pengguna", href: "/admin/pengguna", icon: IconUsers },
  { label: "Pengaturan", href: "/admin/pengaturan", icon: IconSettings },
];

export function AdminSidebar({ adminName = "Administrator", badges = {}, role = "ADMIN" }: { adminName?: string; badges?: Record<string, number>; role?: Peran }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse("buyalater-sidebar-admin");

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {items.filter((item) => bolehAkses(role, item.href)).map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const badgeCount = badges[item.href] ?? 0;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${active ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-secondary"}`}
            onClick={() => setOpen(false)}
            title={item.label}
          >
            <Icon className={active ? "text-secondary" : "text-slate-400"} />
            <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
            {badgeCount > 0 && (
              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white ${collapsed ? "lg:absolute lg:right-1 lg:top-0.5 lg:h-4 lg:min-w-4 lg:px-1" : ""}`}>{badgeCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link aria-label="BuyaLater - Panel Admin" href="/admin/dashboard" className="flex items-center gap-2">
      <span className={collapsed ? "lg:hidden" : ""}><Logo adaptif height={40} href={null} /></span>
      {collapsed && <span className="hidden lg:inline"><Logo height={36} href={null} variant="ikon" /></span>}
      <small className={`text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? "lg:hidden" : ""}`}>Panel Admin</small>
    </Link>
  );

  const session = (
    <div className={`m-4 rounded-xl bg-slate-50 p-4 ${collapsed ? "lg:m-2 lg:px-0" : ""}`}>
      <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initials(adminName)}</span>
        <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="truncate text-xs font-semibold text-slate-700">{adminName}</p>
          <p className="text-xs text-slate-400">{LABEL_PERAN[role]}</p>
        </div>
      </div>
      <TombolTema className={`mt-3 w-full ${collapsed ? "lg:px-0" : ""}`} label={!collapsed} />
      <button
        className={`mt-3 flex w-full items-center gap-2 text-xs font-bold text-primary hover:underline ${collapsed ? "lg:justify-center" : ""}`}
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Keluar"
        type="button"
      >
        <IconLogOut className="h-3.5 w-3.5" />
        <span className={collapsed ? "lg:hidden" : ""}>Keluar</span>
      </button>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-5 lg:hidden print:hidden">
        {brand}
        <div className="flex items-center gap-2"><TombolTema />
        <button
          aria-expanded={open}
          aria-label="Buka menu admin"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          onClick={() => setOpen(true)}
          type="button"
        >
          <IconMenu />
        </button></div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} role="presentation" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-white transition-all duration-200 lg:max-w-none lg:translate-x-0 print:hidden ${collapsed ? "lg:w-20" : "lg:w-64"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex h-16 items-center justify-between border-b px-6 lg:h-18 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          {brand}
          <button
            aria-label="Tutup menu admin"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <IconX />
          </button>
        </div>
        {nav}
        <button
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          className="mx-4 mb-1 hidden items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-secondary lg:flex"
          onClick={toggle}
          type="button"
        >
          {collapsed ? <IconChevronsRight className="h-4 w-4" /> : <><IconChevronsLeft className="h-4 w-4" />Ciutkan</>}
        </button>
        {session}
      </aside>
    </>
  );
}
