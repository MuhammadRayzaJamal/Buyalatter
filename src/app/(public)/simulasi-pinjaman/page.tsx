import { LoanCalculator } from "@/components/public/loan-calculator";

export const metadata = { title: "Simulasi Pinjaman" };

export default function SimulasiPage() {
  return <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-secondary">Kalkulator pinjaman</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Hitung angsuran sebelum mengajukan.</h1><p className="mt-5 leading-7 text-slate-500">Sesuaikan jumlah, tenor, dan bunga untuk mendapatkan gambaran cicilan per bulan.</p></div><div className="mt-12"><LoanCalculator /></div></div>;
}