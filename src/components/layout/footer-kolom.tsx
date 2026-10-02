"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/** Kolom menu footer: judul statis di desktop, accordion buka-tutup di HP. */
export function FooterKolom({ judul, children }: { judul: string; children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="border-b border-white/10 py-3 lg:border-0 lg:py-0">
      <button aria-expanded={buka} className="flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-wider text-accent lg:pointer-events-none lg:cursor-default" onClick={() => setBuka((v) => !v)} type="button">
        <h2>{judul}</h2><ChevronDown aria-hidden className={`h-4 w-4 transition lg:hidden ${buka ? "rotate-180" : ""}`} />
      </button>
      <div className={`${buka ? "block" : "hidden"} pt-4 lg:block`}>{children}</div>
    </div>
  );
}
