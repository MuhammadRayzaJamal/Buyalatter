import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.artikel.findUnique({ where: { slug } });
  if (!item) notFound();
  return <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24"><Link className="text-sm font-bold text-navy hover:underline" href="/berita">← Kembali ke berita</Link><p className="mt-10 text-xs font-semibold text-green">{formatTanggal(item.createdAt)}</p><h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{item.judul}</h1>{item.gambarUrl ? <div className="relative mt-8 h-64 overflow-hidden rounded-2xl"><Image alt={item.judul} className="object-cover" fill sizes="(max-width: 768px) 100vw, 768px" src={item.gambarUrl} /></div> : <div className="mt-8 h-64 rounded-2xl bg-gradient-to-br from-blue-100 via-white to-sky-100" />}<p className="mt-10 whitespace-pre-line text-base leading-8 text-slate-600">{item.isi}</p></article>;
}