"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">Terjadi kendala</p><h1 className="mt-4 text-3xl font-bold text-slate-900">Halaman belum dapat dimuat</h1><p className="mt-3 text-sm leading-6 text-slate-500">Silakan coba lagi. Jika masalah berlanjut, hubungi pengurus BuyaLater.</p><Button className="mt-7" onClick={() => reset()}>Coba lagi</Button></div></main>;
}