import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { KartuMitraGelap, LatarGelap, PenghargaanBaris, SorotanMitra } from "@/components/public/mitra-gelap";

export const metadata = { title: "Mitra" };
export const dynamic = "force-dynamic";

export default async function MitraPage() {
  const [mitra, penghargaan] = await Promise.all([
    prisma.mitra.findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }] }),
    prisma.penghargaan.findMany({ orderBy: [{ urutan: "asc" }, { tahun: "desc" }] }),
  ]);
  const unggulan = mitra.find((m) => m.isUnggulan);
  const strategis = mitra.filter((m) => m.tingkat === "STRATEGIS" && m.id !== unggulan?.id);
  const pendukung = mitra.filter((m) => m.tingkat === "PENDUKUNG" && m.id !== unggulan?.id);
  return <LatarGelap className="pb-20 pt-16 lg:pt-24">
    <div className="mx-auto max-w-7xl px-5 lg:px-8">
      <div className="max-w-3xl"><h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Dipercaya Lembaga Terbaik</h1><p className="mt-5 text-lg leading-8 text-blue-100/70">Kami bekerja sama dengan berbagai lembaga untuk memberikan layanan terbaik dan teraman bagi anggota.</p></div>

      {unggulan && <div className="mt-12"><SorotanMitra m={unggulan} /></div>}

      {strategis.length > 0 && <section className="mt-16"><h2 className="text-2xl font-bold text-white">Mitra Strategis</h2><p className="mt-1 text-sm text-blue-200/70">Kolaborasi inti dalam layanan keuangan BuyaLater.</p><div className="mt-6 grid gap-5 md:grid-cols-2">{strategis.map((m) => <KartuMitraGelap key={m.id} m={m} />)}</div></section>}
      {pendukung.length > 0 && <section className="mt-16"><h2 className="text-2xl font-bold text-white">Mitra Pendukung</h2><p className="mt-1 text-sm text-blue-200/70">Lembaga yang memperkuat ekosistem anggota.</p><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{pendukung.map((m) => <KartuMitraGelap key={m.id} m={m} ringkas />)}</div></section>}
      {!mitra.length && <p className="py-16 text-center text-blue-200/70">Belum ada mitra yang ditampilkan.</p>}

      {penghargaan.length > 0 && <section className="mt-16"><h2 className="text-2xl font-bold text-white">Penghargaan</h2><p className="mt-1 text-sm text-blue-200/70">Pengakuan atas kepercayaan anggota dan mitra.</p><div className="mt-6"><PenghargaanBaris items={penghargaan} /></div></section>}

      <div className="mt-20 rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center sm:px-12"><h2 className="text-3xl font-bold tracking-tight text-white">Ingin Menjadi Mitra BuyaLater?</h2><p className="mx-auto mt-4 max-w-xl text-blue-100/70">Mari berkolaborasi menghadirkan layanan keuangan yang lebih mudah dan terpercaya bagi anggota.</p><Button className="mt-7 bg-white text-primary hover:bg-blue-50" href="/kontak" size="lg" variant="outline">Hubungi Kami</Button></div>
    </div>
  </LatarGelap>;
}
