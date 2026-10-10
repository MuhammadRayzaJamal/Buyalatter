"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TAMPIL_MS = 2200;
const PUDAR_MS = 500;

/** Layar sambutan "Welcome to BuyaLater" setiap kali aplikasi/halaman dimuat penuh (perpindahan halaman di dalam aplikasi tidak memunculkannya lagi). */
export function SplashAwal() {
  const [fase, setFase] = useState<"tampil" | "pudar" | "selesai">("tampil");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const a = setTimeout(() => setFase("pudar"), TAMPIL_MS);
    const b = setTimeout(() => {
      setFase("selesai");
      document.body.style.overflow = "";
    }, TAMPIL_MS + PUDAR_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      document.body.style.overflow = "";
    };
  }, []);

  if (fase === "selesai") return null;
  return (
    <div
      aria-label="Memuat BuyaLater"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-navy-deep via-navy to-[#1E5FC7] px-6 text-center transition-opacity ease-out"
      role="status"
      style={{ opacity: fase === "pudar" ? 0 : 1, transitionDuration: `${PUDAR_MS}ms` }}
    >
      <span aria-hidden className="splash-aksen absolute -left-24 top-[12%] h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      <span aria-hidden className="splash-aksen absolute -right-20 bottom-[10%] h-80 w-80 rounded-full bg-blue-300/15 blur-3xl [animation-delay:600ms]" />
      <div className="relative">
        <span aria-hidden className="splash-cincin absolute inset-0 rounded-[28px] border-2 border-white/40" />
        <span aria-hidden className="splash-cincin absolute inset-0 rounded-[28px] border-2 border-white/30 [animation-delay:700ms]" />
        <div className="splash-logo relative flex h-28 w-28 items-center justify-center rounded-[28px] bg-white shadow-2xl shadow-black/30">
          <Image alt="BuyaLater" className="h-20 w-20" height={80} priority src="/images/logo-icon.png" width={80} />
        </div>
      </div>
      <p className="splash-teks mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">Welcome to</p>
      <h1 className="splash-teks mt-2 text-4xl font-extrabold text-white [animation-delay:150ms]">Buya<span className="text-sky-300">Later</span></h1>
      <p className="splash-teks mt-3 text-sm text-blue-100/80 [animation-delay:300ms]">Koperasi Simpan Pinjam Digital untuk Anggota</p>
      <div className="mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/20">
        <div className="splash-bar h-full rounded-full bg-gradient-to-r from-sky-300 to-white" style={{ animationDuration: `${TAMPIL_MS}ms` }} />
      </div>
    </div>
  );
}
