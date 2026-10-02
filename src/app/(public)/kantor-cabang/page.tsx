import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { KantorPeta } from "@/components/public/kantor-peta";

export const metadata = { title: "Kantor Cabang" };
export const dynamic = "force-dynamic";

export default async function KantorCabangPage() {
  const kantor = await prisma.kantorCabang.findMany({ orderBy: [{ isPusat: "desc" }, { nama: "asc" }] });
  return <div>
    <section className="mx-auto max-w-7xl px-5 pb-6 pt-16 lg:px-8 lg:pt-24"><div className="max-w-3xl"><p className="text-sm font-semibold text-secondary">Kantor kami</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">Kantor Cabang</h1><p className="mt-5 text-lg leading-8 text-slate-600">Kunjungi kantor BuyaLater terdekat untuk konsultasi, setoran tunai, atau bantuan langsung dari pengurus.</p></div></section>
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">{kantor.length ? <KantorPeta kantor={kantor.map((k) => ({ id: k.id, nama: k.nama, alamat: k.alamat, kota: k.kota, telepon: k.telepon, jamOperasional: k.jamOperasional, latitude: Number(k.latitude), longitude: Number(k.longitude), isPusat: k.isPusat }))} /> : <p className="py-16 text-center text-slate-500">Belum ada kantor yang ditampilkan.</p>}</section>
    <section className="bg-primary"><div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-14 text-center lg:px-8"><h2 className="text-2xl font-bold text-white sm:text-3xl">Tidak sempat berkunjung?</h2><p className="mt-3 max-w-xl text-blue-100/80">Hubungi kami lewat formulir kontak, dan pengurus akan membalas secepatnya.</p><Button className="mt-6 bg-white text-primary hover:bg-blue-50" href="/kontak" variant="outline">Hubungi Kami</Button></div></section>
  </div>;
}
