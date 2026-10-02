"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center rounded-xl border bg-white px-5 text-center">
      <div className="max-w-md">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">Terjadi kendala</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Halaman admin belum dapat dimuat</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Silakan coba lagi. Jika masalah berlanjut, hubungi tim teknis.</p>
        <Button className="mt-6" onClick={() => reset()}>Coba lagi</Button>
      </div>
    </div>
  );
}
