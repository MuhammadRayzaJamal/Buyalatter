"use client";

import { useEffect, useRef, useState } from "react";

/** Angka yang menghitung naik saat masuk layar. Menghormati prefers-reduced-motion. */
export function CountUp({ value, prefix = "", suffix = "", duration = 1400 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (reduce) { setCurrent(value); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setCurrent(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, duration]);

  return <span ref={ref}>{prefix}{new Intl.NumberFormat("id-ID").format(current)}{suffix}</span>;
}
