"use client";

import { useEffect, useState } from "react";
import { hitungSimulasi } from "@/app/(public)/simulasi-pinjaman/actions";
import { RingkasanBiayaPinjaman } from "@/components/pinjaman/ringkasan-biaya";
import { formatRupiah } from "@/lib/format";
import type { TampilanRingkasan } from "@/lib/ringkasan";
import { Button } from "../ui/button";

export function LoanCalculator({ min, maks }: { min: number; maks: number }) {
  const [amount, setAmount] = useState(Math.min(Math.max(5_000_000, min), maks));
  const [term, setTerm] = useState(12);
  const [hasil, setHasil] = useState<TampilanRingkasan | null>(null);
  const [galat, setGalat] = useState("");

  // Dihitung di server dengan rumus yang sama dengan pengajuan dan akad, sehingga angka simulasi = angka akad.
  useEffect(() => {
    let batal = false;
    const timer = setTimeout(async () => {
      const respons = await hitungSimulasi(String(amount), String(term));
      if (batal) return;
      if (respons.ok) { setHasil(respons.data); setGalat(""); } else setGalat(respons.pesan);
    }, 150);
    return () => { batal = true; clearTimeout(timer); };
  }, [amount, term]);

  return <div className="grid gap-8 rounded-2xl border bg-white p-6 shadow-sm lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
    <div className="space-y-6">
      <div><label className="flex justify-between text-sm font-semibold text-slate-700" htmlFor="amount"><span>Jumlah pinjaman</span><strong className="text-navy">{formatRupiah(amount)}</strong></label><input className="mt-4 w-full accent-navy" id="amount" max={maks} min={min} onChange={(event) => setAmount(Number(event.target.value))} step="500000" type="range" value={amount} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>{formatRupiah(min)}</span><span>{formatRupiah(maks)}</span></div></div>
      <div><label className="flex justify-between text-sm font-semibold text-slate-700" htmlFor="term"><span>Tenor pinjaman</span><strong className="text-navy">{term} bulan</strong></label><input className="mt-4 w-full accent-navy" id="term" max="24" min="3" onChange={(event) => setTerm(Number(event.target.value))} step="1" type="range" value={term} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>3 bulan</span><span>24 bulan</span></div></div>
      <p className="text-xs leading-5 text-slate-500">Bunga, metode, dan biaya administrasi mengikuti ketentuan koperasi yang berlaku. Simulasi bersifat perkiraan; nilai final tertera pada Ringkasan Biaya sebelum akad. Pinjaman hanya untuk anggota terverifikasi.</p>
      <Button className="w-full" href="/register">Jadi anggota</Button>
    </div>
    <div>{hasil ? <RingkasanBiayaPinjaman data={hasil} judul="Estimasi Biaya Pinjaman" sembunyikanHak /> : <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">{galat || "Menghitung..."}</p>}</div>
  </div>;
}
