import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berita" };

export default async function BeritaPage() {
  const items = await prisma.artikel.findMany({ orderBy: { createdAt: "desc" } });
  return <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-sm font-semibold text-secondary">Kabar koperasi</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Berita dan wawasan BuyaLater.</h1><p className="mt-5 leading-7 text-slate-500">Ikuti cerita, program, dan informasi terbaru dari koperasi.</p></div>{items.length ? <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article className="overflow-hidden rounded-xl border bg-white shadow-sm" key={item.id}>{item.gambarUrl ? <div className="relative h-40"><Image alt={item.judul} className="object-cover" fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" src={item.gambarUrl} /></div> : <div className="h-40 bg-gradient-to-br from-blue-100 via-white to-sky-100" />}<div className="p-6"><p className="text-xs text-slate-400">{formatTanggal(item.createdAt)}</p><h2 className="mt-3 text-lg font-bold leading-7 text-slate-900">{item.judul}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.isi}</p><Link className="mt-5 inline-block text-sm font-bold text-navy hover:underline" href={`/berita/${item.slug}`}>Baca selengkapnya →</Link></div></article>)}</div> : <p className="mt-12 rounded-xl border bg-white px-5 py-16 text-center text-sm text-slate-500">Belum ada artikel berita.</p>}</div>;
}