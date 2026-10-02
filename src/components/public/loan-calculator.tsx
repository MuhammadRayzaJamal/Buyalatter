"use client";

import { useMemo, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { Button } from "../ui/button";

export function LoanCalculator() {
  const [amount, setAmount] = useState(5000000);
  const [term, setTerm] = useState(12);
  const [interest, setInterest] = useState(1.5);
  const result = useMemo(() => {
    const total = amount + amount * (interest / 100) * term;
    return { total, monthly: total / term };
  }, [amount, interest, term]);

  return <div className="grid gap-8 rounded-2xl border bg-white p-6 shadow-sm lg:grid-cols-[1fr_0.8fr] lg:p-8"><div className="space-y-6"><div><label className="flex justify-between text-sm font-semibold text-slate-700" htmlFor="amount"><span>Jumlah pinjaman</span><strong className="text-navy">{formatRupiah(amount)}</strong></label><input className="mt-4 w-full accent-navy" id="amount" max="25000000" min="1000000" onChange={(event) => setAmount(Number(event.target.value))} step="500000" type="range" value={amount} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>Rp 1 juta</span><span>Rp 25 juta</span></div></div><div><label className="flex justify-between text-sm font-semibold text-slate-700" htmlFor="term"><span>Tenor pinjaman</span><strong className="text-navy">{term} bulan</strong></label><input className="mt-4 w-full accent-navy" id="term" max="24" min="3" onChange={(event) => setTerm(Number(event.target.value))} step="1" type="range" value={term} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>3 bulan</span><span>24 bulan</span></div></div><div><label className="flex justify-between text-sm font-semibold text-slate-700" htmlFor="interest"><span>Bunga per bulan</span><strong className="text-navy">{interest.toFixed(1)}%</strong></label><input className="mt-4 w-full accent-navy" id="interest" max="3" min="0.5" onChange={(event) => setInterest(Number(event.target.value))} step="0.1" type="range" value={interest} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>0,5%</span><span>3%</span></div></div></div><div className="rounded-xl bg-navy-deep p-6 text-white"><p className="text-xs font-semibold text-emerald-300">Estimasi angsuran</p><p className="mt-8 text-sm text-blue-100/70">Angsuran per bulan</p><p className="mt-2 text-3xl font-bold">{formatRupiah(result.monthly)}</p><div className="my-6 border-t border-white/10" /><div className="flex justify-between text-sm"><span className="text-blue-100/70">Total pengembalian</span><strong>{formatRupiah(result.total)}</strong></div><p className="mt-6 text-xs leading-5 text-blue-100/60">Perhitungan ini bersifat simulasi. Nilai final mengikuti hasil persetujuan koperasi.</p><Button href="/register" variant="secondary" className="mt-6 w-full">Ajukan sebagai anggota</Button></div></div>;
}