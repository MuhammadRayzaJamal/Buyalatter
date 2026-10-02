"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Logo } from "../ui/logo";
import { IconMenu, IconX } from "../ui/icons";

const links = [
  { label: "Beranda", href: "/" },
  { label: "Tentang", href: "/tentang" },
  { label: "Layanan", href: "/layanan/simpanan" },
  { label: "Galeri", href: "/galeri" },
  { label: "Berita", href: "/berita" },
  { label: "Kontak", href: "/kontak" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300 ${scrolled ? "border-transparent bg-white/70 shadow-[0_4px_20px_-8px_rgba(26,42,108,0.18)] backdrop-blur-xl" : "bg-white"}`}>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo height={40} priority />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              className={`py-1 underline-offset-[10px] transition-colors hover:text-secondary ${isActive(link.href) ? "text-primary underline decoration-accent decoration-2" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button className="hidden sm:inline-flex" href="/login" size="sm"><Lock aria-hidden className="h-3.5 w-3.5" />Masuk Anggota</Button>
          <button
            aria-expanded={open}
            aria-label="Buka menu navigasi"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600 md:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive(link.href) ? "bg-blue-50 text-navy" : "text-slate-600 hover:bg-slate-50 hover:text-navy"}`}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button className="mt-2 sm:hidden" href="/login" size="sm" onClick={() => setOpen(false)}><Lock aria-hidden className="h-3.5 w-3.5" />Masuk Anggota</Button>
          </div>
        </nav>
      )}
    </header>
  );
}
