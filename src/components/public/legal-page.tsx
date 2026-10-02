import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { judul: string; paragraf?: string[]; daftar?: string[] };

/** Kerangka halaman teks panjang (keamanan, syarat & ketentuan, kebijakan privasi). */
export function LegalPage({ label, judul, ringkasan, diperbarui, sections, children }: { label: string; judul: string; ringkasan: string; diperbarui?: string; sections: LegalSection[]; children?: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
    <div className="grid gap-12 lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:block"><nav aria-label="Daftar isi" className="sticky top-28 space-y-1 border-l pl-4 text-sm"><p className="mb-2 text-xs font-semibold text-slate-400">Daftar isi</p>{sections.map((s, i) => <a className="block py-1 text-slate-500 hover:text-secondary" href={`#bagian-${i + 1}`} key={s.judul}>{i + 1}. {s.judul}</a>)}</nav></aside>
      <article className="max-w-3xl">
        <p className="text-sm font-semibold text-secondary">{label}</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">{judul}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-500">{ringkasan}</p>
        {diperbarui && <p className="mt-3 text-xs text-slate-400">Terakhir diperbarui: {diperbarui}</p>}
        {children}
        <div className="mt-12 space-y-10">{sections.map((s, i) => <section className="scroll-mt-28" id={`bagian-${i + 1}`} key={s.judul}><h2 className="text-xl font-bold text-slate-900">{i + 1}. {s.judul}</h2>{s.paragraf?.map((p) => <p className="mt-3 leading-7 text-slate-600" key={p}>{p}</p>)}{s.daftar && <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-slate-600 marker:text-accent">{s.daftar.map((d) => <li key={d}>{d}</li>)}</ul>}</section>)}</div>
        <p className="mt-14 rounded-xl bg-blue-50 px-5 py-4 text-sm text-slate-600">Ada pertanyaan? Hubungi pengurus melalui halaman <Link className="font-bold text-secondary hover:underline" href="/kontak">Kontak</Link>.</p>
      </article>
    </div>
  </div>;
}
