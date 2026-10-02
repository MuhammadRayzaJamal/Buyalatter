"use client";

import Link from "next/link";
import { PreviewImage } from "@/components/ui/preview-image";

export type MitraItem = { id: string; nama: string; logoUrl: string; kategori: string | null };

const FADE = "linear-gradient(to right, transparent, black 10%, black 90%, transparent)";

function Kartu({ item, kecil, dekoratif = false }: { item: MitraItem; kecil: boolean; dekoratif?: boolean }) {
  return (
    // padding kanan di tiap item (bukan gap di container) supaya jarak di titik sambungan loop tetap rata
    <li className={`shrink-0 pr-4 ${kecil ? "w-48" : "w-60"}`}>
      <Link
        aria-label={`${item.nama}${item.kategori ? ` — ${item.kategori}` : ""}`}
        className={`group relative flex items-center justify-center outline-none ${kecil ? "h-16" : "h-24"}`}
        href={`/mitra#mitra-${item.id}`}
        tabIndex={dekoratif ? -1 : undefined}
      >
        {/* lingkaran putih muncul saat hover/fokus; logo kembali ke warna aslinya */}
        <span aria-hidden className="absolute inset-y-1 inset-x-2 rounded-full bg-white opacity-0 shadow-lg shadow-black/20 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        <PreviewImage alt={dekoratif ? "" : item.nama} className={`relative w-auto max-w-[80%] object-contain opacity-60 transition duration-300 [filter:brightness(0)_invert(1)] group-hover:opacity-100 group-hover:[filter:none] group-focus-visible:opacity-100 group-focus-visible:[filter:none] ${kecil ? "h-8" : "h-12"}`} src={item.logoUrl} />
        <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-primary opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" role="tooltip">{item.kategori ?? item.nama}</span>
      </Link>
    </li>
  );
}

/**
 * Logo mitra versi putih bergerak tanpa putus. Daftar dirender dua kali; translateX 0 → -50% (atau sebaliknya)
 * membuat loop mulus. arah="kiri" untuk baris strategis, "kanan" untuk baris pendukung.
 */
export function MitraMarquee({ mitra, arah = "kiri", kecil = false }: { mitra: MitraItem[]; arah?: "kiri" | "kanan"; kecil?: boolean }) {
  if (!mitra.length) return null;
  // Setiap separuh harus lebih lebar dari layar; ulangi daftar bila mitra sedikit.
  const ulang = Math.max(1, Math.ceil(10 / mitra.length));
  const separuh = Array.from({ length: ulang }, () => mitra).flat();
  const animasi = arah === "kiri" ? "animate-marquee-fast sm:animate-marquee" : "animate-marquee-reverse-fast sm:animate-marquee-reverse";

  return (
    <>
      <div className="overflow-hidden pt-6 motion-reduce:hidden" style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
        <div className={`flex w-max ${animasi} hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]`}>
          <ul className="flex shrink-0">{separuh.map((item, i) => <Kartu item={item} key={`a-${i}`} kecil={kecil} />)}</ul>
          <ul aria-hidden="true" className="flex shrink-0">{separuh.map((item, i) => <Kartu dekoratif item={item} key={`b-${i}`} kecil={kecil} />)}</ul>
        </div>
      </div>
      {/* prefers-reduced-motion: tanpa animasi, tampil sebagai baris statis */}
      <ul className="mx-auto hidden max-w-7xl flex-wrap justify-center gap-y-2 px-5 pt-6 motion-reduce:flex lg:px-8">{mitra.map((item) => <Kartu item={item} key={item.id} kecil={kecil} />)}</ul>
    </>
  );
}
