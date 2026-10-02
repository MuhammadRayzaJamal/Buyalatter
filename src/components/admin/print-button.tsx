"use client";

export function PrintButton() {
  return <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-navy hover:text-navy print:hidden" onClick={() => window.print()} type="button">Cetak laporan</button>;
}