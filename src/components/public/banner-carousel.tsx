"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PreviewImage } from "@/components/ui/preview-image";

export type BannerSlide = { id: string; judul: string; subjudul: string | null; gambarUrl: string; linkTujuan: string | null; teksTombol: string | null };

const GRADIEN = "bg-gradient-to-r from-[#1A2A6C] via-[#1E5FC7] to-[#4FB8EC]";

/** Carousel banner otomatis (5 detik) dengan titik navigasi. `compact` = versi kecil untuk dashboard anggota. */
export function BannerCarousel({ slides, compact = false }: { slides: BannerSlide[]; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const aktif = total ? index % total : 0;

  useEffect(() => {
    if (paused || total < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((value) => value + 1), 5000);
    return () => clearInterval(timer);
  }, [paused, total]);

  if (!total) return null;
  return (
    <section aria-label="Promo BuyaLater" aria-roledescription="carousel" className={compact ? "" : `${GRADIEN} border-t border-white/10`} onBlur={() => setPaused(false)} onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={compact ? `overflow-hidden rounded-xl ${GRADIEN}` : "mx-auto max-w-7xl px-5 lg:px-8"}>
        <div className="overflow-hidden"><div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${aktif * 100}%)` }}>
          {slides.map((slide, i) => (
            <div aria-hidden={i !== aktif} aria-label={`${i + 1} dari ${total}`} aria-roledescription="slide" className={`grid w-full shrink-0 items-center ${compact ? "grid-cols-[5.5rem_1fr] gap-4 p-4" : "gap-6 py-8 sm:grid-cols-[minmax(0,16rem)_1fr] lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10 lg:py-10"}`} key={slide.id}>
              <PreviewImage alt={slide.judul} className={`w-full object-cover shadow-lg ${compact ? "aspect-square rounded-lg" : "aspect-[16/10] rounded-2xl"}`} src={slide.gambarUrl} />
              <div className="min-w-0 text-white">
                <h3 className={compact ? "text-sm font-bold leading-snug" : "text-2xl font-bold tracking-tight lg:text-3xl"}>{slide.judul}</h3>
                {slide.subjudul && <p className={compact ? "mt-1 line-clamp-2 text-xs text-blue-50/90" : "mt-2 max-w-xl text-sm leading-6 text-blue-50/90 lg:text-base"}>{slide.subjudul}</p>}
                {slide.linkTujuan && slide.teksTombol && <Link className={`inline-flex items-center rounded-lg bg-white font-bold text-primary shadow-md transition hover:bg-blue-50 ${compact ? "mt-2 px-3 py-1.5 text-xs" : "mt-5 px-5 py-2.5 text-sm"}`} href={slide.linkTujuan} tabIndex={i === aktif ? 0 : -1}>{slide.teksTombol}</Link>}
              </div>
            </div>
          ))}
        </div></div>
        {total > 1 && <div className={`flex justify-center gap-2 ${compact ? "pb-3" : "pb-5"}`} role="tablist">{slides.map((slide, i) => <button aria-label={`Tampilkan promo ${i + 1}: ${slide.judul}`} aria-selected={i === aktif} className={`h-2 rounded-full transition-all ${i === aktif ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`} key={slide.id} onClick={() => setIndex(i)} role="tab" type="button" />)}</div>}
      </div>
    </section>
  );
}
