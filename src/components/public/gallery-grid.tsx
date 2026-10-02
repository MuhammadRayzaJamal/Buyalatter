"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type GalleryItem = { id: string; judul: string; gambarUrl: string; kategori: string; deskripsi: string | null };

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState("Semua");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const categories = ["Semua", "Kegiatan", "Rapat", "Sosial"];
  const filtered = filter === "Semua" ? items : items.filter((item) => item.kategori === filter);

  return <><div className="mb-8 flex flex-wrap gap-2">{categories.map((category) => <button className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === category ? "bg-navy text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy"}`} key={category} onClick={() => setFilter(category)} type="button">{category}</button>)}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <article className="group overflow-hidden rounded-xl border bg-white shadow-sm" key={item.id}><button className="block w-full text-left" onClick={() => setSelected(item)} type="button"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image alt={item.judul} className="object-cover transition duration-500 group-hover:scale-105" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={item.gambarUrl} /></div><div className="p-5"><p className="text-xs font-semibold text-green">{item.kategori}</p><h2 className="mt-2 font-bold text-slate-900">{item.judul}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.deskripsi}</p></div></button><Link className="mx-5 mb-5 inline-block text-xs font-bold text-navy hover:underline" href={`/galeri/${item.id}`}>Lihat detail</Link></article>)}</div>{filtered.length === 0 && <p className="rounded-xl border bg-white px-5 py-12 text-center text-sm text-slate-500">Belum ada foto pada kategori ini.</p>}{selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-5" onClick={() => setSelected(null)} role="presentation"><div className="relative max-w-4xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><Image alt={selected.judul} className="max-h-[78vh] w-auto rounded-xl object-contain" height={800} src={selected.gambarUrl} width={1200} /><button aria-label="Tutup lightbox" className="absolute -right-2 -top-12 text-3xl text-white" onClick={() => setSelected(null)} type="button">×</button><p className="mt-3 text-center text-sm font-semibold text-white">{selected.judul}</p></div></div>}</>;
}