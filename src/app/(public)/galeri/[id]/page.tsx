import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GaleriDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.galeri.findUnique({ where: { id } });
  if (!item) notFound();
  return <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24"><Link className="text-sm font-bold text-navy hover:underline" href="/galeri">← Kembali ke galeri</Link><div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="relative aspect-[16/9] max-h-[620px]"><Image alt={item.judul} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 1024px" src={item.gambarUrl} /></div><div className="p-7"><p className="text-xs font-semibold text-green">{item.kategori} · {formatTanggal(item.createdAt)}</p><h1 className="mt-3 text-3xl font-bold text-slate-900">{item.judul}</h1><p className="mt-4 leading-7 text-slate-500">{item.deskripsi}</p></div></div></div>;
}