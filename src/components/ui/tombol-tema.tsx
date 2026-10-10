"use client";

import { useSyncExternalStore } from "react";

const KUNCI = "bl-tema";
const PERISTIWA = "bl-tema-berubah";

function bacaTema(): "gelap" | "terang" {
  if (typeof document === "undefined") return "gelap";
  return document.cookie.split("; ").find((c) => c.startsWith(`${KUNCI}=`))?.split("=")[1] === "terang" ? "terang" : "gelap";
}

function langganan(panggil: () => void) {
  window.addEventListener(PERISTIWA, panggil);
  return () => window.removeEventListener(PERISTIWA, panggil);
}

/** Mengganti mode gelap/terang pada dashboard; pilihan disimpan di cookie supaya server ikut merender tema yang sama. */
export function TombolTema({ className = "", label = false }: { className?: string; label?: boolean }) {
  // Server selalu merender "gelap" sebagai awal; setelah hidrasi nilai cookie dibaca tanpa memicu galat hidrasi.
  const tema = useSyncExternalStore(langganan, bacaTema, () => "gelap" as const);
  function ganti() {
    const baru = tema === "gelap" ? "terang" : "gelap";
    document.cookie = `${KUNCI}=${baru}; path=/; max-age=31536000; samesite=lax`;
    document.querySelectorAll("[data-tema-root]").forEach((el) => el.classList.toggle("dark", baru === "gelap"));
    window.dispatchEvent(new Event(PERISTIWA));
  }
  const gelap = tema === "gelap";
  return (
    <button
      aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      aria-pressed={gelap}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 ${className}`}
      onClick={ganti}
      title={gelap ? "Mode terang" : "Mode gelap"}
      type="button"
    >
      {gelap ? (
        <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
      {label && <span>{gelap ? "Mode terang" : "Mode gelap"}</span>}
    </button>
  );
}
