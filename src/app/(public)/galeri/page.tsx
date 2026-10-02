import { prisma } from "@/lib/prisma";
import { GalleryGrid } from "@/components/public/gallery-grid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galeri" };

export default async function GaleriPage() {
  const items = await prisma.galeri.findMany({ orderBy: { createdAt: "desc" } });
  return <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-sm font-semibold text-secondary">Dokumentasi</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Cerita dalam kebersamaan.</h1><p className="mt-5 leading-7 text-slate-500">Lihat kegiatan, rapat, dan aksi sosial yang mempertemukan keluarga besar BuyaLater.</p></div><div className="mt-12"><GalleryGrid items={items} /></div></div>;
}