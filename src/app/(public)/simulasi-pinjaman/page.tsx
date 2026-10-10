import { LoanCalculator } from "@/components/public/loan-calculator";
import { getBatas } from "@/lib/pengaturan";

export const metadata = { title: "Simulasi Pinjaman" };
export const dynamic = "force-dynamic";

export default async function SimulasiPage() {
  const batas = await getBatas();
  return <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-secondary">Simulasi untuk calon anggota</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Hitung cicilan dan total biaya sebelum mengajukan.</h1><p className="mt-5 leading-7 text-slate-500">Atur jumlah dan tenor untuk melihat cicilan per bulan beserta seluruh biaya: bunga per tahun, bunga efektif, biaya administrasi, dan total yang harus dibayar.</p></div><div className="mt-12"><LoanCalculator maks={Math.min(25_000_000, batas.maksPinjaman.toNumber())} min={batas.minPinjaman.toNumber()} /></div></div>;
}
