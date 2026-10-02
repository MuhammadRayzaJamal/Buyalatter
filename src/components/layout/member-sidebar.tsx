"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { initials } from "@/lib/format";
import { Logo } from "@/components/ui/logo";
import { useSidebarCollapse } from "@/components/layout/use-sidebar-collapse";
import { NotifikasiBell, type NotifikasiItem } from "@/components/layout/notifikasi-bell";
import {
  IconArrowDownCircle,
  IconBank,
  IconShieldCheck,
  IconBarChart,
  IconBanknote,
  IconGrid,
  IconBell,
  IconChevronsLeft,
  IconChevronsRight,
  IconHistory,
  IconLogOut,
  IconMenu,
  IconPiggyBank,
  IconReceipt,
  IconUserCircle,
  IconX,
} from "@/components/ui/icons";

const items = [
  { label: "Ringkasan", href: "/anggota/dashboard", icon: IconGrid },
  { label: "Profil Saya", href: "/anggota/profil", icon: IconUserCircle },
  { label: "Verifikasi Identitas", href: "/anggota/verifikasi", icon: IconShieldCheck },
  { label: "Simpanan Saya", href: "/anggota/simpanan", icon: IconPiggyBank },
  { label: "Penarikan", href: "/anggota/penarikan", icon: IconArrowDownCircle },
  { label: "Pinjaman", href: "/anggota/pinjaman", icon: IconBanknote },
  { label: "Rekening Bank", href: "/anggota/rekening", icon: IconBank },
  { label: "Pembayaran", href: "/anggota/pembayaran", icon: IconReceipt },
  { label: "Notifikasi", href: "/anggota/notifikasi", icon: IconBell },
  { label: "Riwayat Transaksi", href: "/anggota/riwayat", icon: IconHistory },
  { label: "Buku Mutasi", href: "/anggota/mutasi", icon: IconBarChart },
  { label: "SHU", href: "/anggota/shu", icon: IconPiggyBank },
];

export function MemberSidebar({ memberName = "Anggota", memberFoto = null, notif = { items: [], unread: 0 } }: { memberName?: string; memberFoto?: string | null; notif?: { items: NotifikasiItem[]; unread: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse("buyalater-sidebar-anggota");

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${active ? "bg-blue-50 text-secondary" : "text-slate-500 hover:bg-slate-50 hover:text-secondary"}`}
            onClick={() => setOpen(false)}
            title={item.label}
          >
            <Icon className={active ? "text-secondary" : "text-slate-400"} />
            <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link aria-label="BuyaLater - Portal Anggota" href="/anggota/dashboard" className="flex items-center gap-2">
      <span className={collapsed ? "lg:hidden" : ""}><Logo height={40} href={null} /></span>
      {collapsed && <span className="hidden lg:inline"><Logo height={36} href={null} variant="ikon" /></span>}
      <small className={`text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? "lg:hidden" : ""}`}>Portal Anggota</small>
    </Link>
  );

  const session = (
    <div className={`m-4 rounded-xl bg-blue-50 p-4 ${collapsed ? "lg:m-2 lg:px-0" : ""}`}>
      <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
        {memberFoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- berkas privat harus dimuat langsung agar cookie sesi ikut terkirim
          <img alt="Foto profil" className="h-9 w-9 shrink-0 rounded-full object-cover" height={36} src={memberFoto} width={36} />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">{initials(memberName)}</span>
        )}
        <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="truncate text-xs font-semibold text-primary">Halo, {memberName.split(" ")[0]}</p>
          <p className="text-xs text-secondary/70">Semoga harimu produktif.</p>
        </div>
      </div>
      <button
        className={`mt-3 flex w-full items-center gap-2 text-xs font-bold text-secondary hover:underline ${collapsed ? "lg:justify-center" : ""}`}
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
        <div className="flex items-center gap-2">
        <NotifikasiBell items={notif.items} unread={notif.unread} />
        <button
          aria-expanded={open}
          aria-label="Buka menu anggota"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          onClick={() => setOpen(true)}
          type="button"
        >
          <IconMenu />
        </button>
        </div>
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
            aria-label="Tutup menu anggota"
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
