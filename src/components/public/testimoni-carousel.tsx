"use client";

import { useEffect, useRef, useState } from "react";
import { PreviewImage } from "@/components/ui/preview-image";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

export type TestimoniItem = { id: string; nama: string; pekerjaan: string | null; fotoUrl: string | null; isi: string; rating: number };

export function TestimoniCarousel({ items }: { items: TestimoniItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const geser = (arah: 1 | -1) => {
    const el = track.current; if (!el) return;
    const card = el.firstElementChild as HTMLElement | null; const langkah = (card?.offsetWidth ?? 320) + 20;
    const akhir = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (arah === 1 && akhir) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: arah * langkah, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => geser(1), 5000);
    return () => clearInterval(timer);
  }, [paused]);

  if (!items.length) return null;
  return (
    <div onBlur={() => setPaused(false)} onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex justify-end gap-2">
        <button aria-label="Testimoni sebelumnya" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-secondary hover:text-secondary" onClick={() => geser(-1)} type="button"><ChevronLeft className="h-5 w-5" /></button>
        <button aria-label="Testimoni berikutnya" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-secondary hover:text-secondary" onClick={() => geser(1)} type="button"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={track}>
        {items.map((item) => (
          <figure className="w-[85%] shrink-0 snap-start rounded-2xl border bg-white p-6 shadow-sm sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]" key={item.id}>
            <Quote aria-hidden className="h-7 w-7 text-accent" />
            <div aria-label={`Rating ${item.rating} dari 5`} className="mt-3 flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star className={`h-4 w-4 ${n <= item.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} key={n} />)}</div>
            <blockquote className="mt-3 text-sm leading-7 text-slate-600">&ldquo;{item.isi}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
              {item.fotoUrl ? <PreviewImage alt={item.nama} className="h-11 w-11 rounded-full object-cover" src={item.fotoUrl} /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-secondary">{item.nama.slice(0, 1)}</span>}
              <span><strong className="block text-sm text-slate-900">{item.nama}</strong><span className="text-xs text-slate-500">{item.pekerjaan}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
