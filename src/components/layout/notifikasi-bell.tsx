"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconBell } from "@/components/ui/icons";
import { tandaiSemuaDibaca } from "@/app/(anggota)/anggota/actions";

export type NotifikasiItem = { id: string; judul: string; pesan: string; tipe: string; sudahDibaca: boolean; waktu: string };

const titik: Record<string, string> = { TERLAMBAT: "bg-red-500", PENGINGAT: "bg-amber-500", PENCAIRAN: "bg-green-500", PEMBAYARAN: "bg-blue-500", INFO: "bg-slate-400" };

export function NotifikasiBell({ items, unread }: { items: NotifikasiItem[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button aria-expanded={open} aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-secondary hover:text-secondary" onClick={() => setOpen((value) => !value)} type="button">
        <IconBell />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-bold text-slate-800">Notifikasi</p>
            {unread > 0 && <button className="text-xs font-bold text-secondary hover:underline disabled:opacity-50" disabled={pending} onClick={() => startTransition(() => tandaiSemuaDibaca())} type="button">Tandai semua dibaca</button>}
          </div>
          {items.length ? <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">{items.map((item) => (
            <li key={item.id}><a className={`flex gap-3 px-4 py-3 hover:bg-slate-50 ${item.sudahDibaca ? "" : "bg-blue-50/60"}`} href={`/anggota/notifikasi/${item.id}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.sudahDibaca ? "bg-slate-200" : titik[item.tipe] ?? "bg-slate-400"}`} />
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{item.judul}</span><span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{item.pesan}</span><span className="mt-1 block text-[10px] text-slate-400">{item.waktu}</span></span>
            </a></li>
          ))}</ul> : <p className="px-4 py-8 text-center text-sm text-slate-500">Belum ada notifikasi.</p>}
          <Link className="block border-t px-4 py-3 text-center text-xs font-bold text-primary hover:bg-slate-50" href="/anggota/notifikasi" onClick={() => setOpen(false)}>Lihat semua notifikasi</Link>
        </div>
      )}
    </div>
  );
}
