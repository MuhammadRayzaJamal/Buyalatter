import Image from "next/image";
import { Eye, HeartHandshake, Lightbulb, ShieldCheck, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TIM } from "@/lib/tim";
import { Card } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { PreviewImage } from "@/components/ui/preview-image";

export const metadata = { title: "Tentang Kami" };
export const dynamic = "force-dynamic";

const misi = [
  "Memberikan layanan simpan pinjam yang cepat, mudah, dan transparan.",
  "Menumbuhkan budaya menabung di kalangan anggota.",
  "Mendukung usaha kecil melalui pembiayaan yang terjangkau.",
  "Menjaga keamanan data dan dana anggota dengan teknologi yang andal.",
];

const nilai = [
  { nama: "Amanah", teks: "Kami memegang teguh kepercayaan anggota dalam mengelola setiap dana.", ikon: ShieldCheck },
  { nama: "Transparan", teks: "Biaya, bunga, dan laporan dapat dilihat anggota secara terbuka.", ikon: Eye },
  { nama: "Kekeluargaan", teks: "Kami tumbuh bersama anggota dengan semangat gotong royong.", ikon: HeartHandshake },
  { nama: "Inovatif", teks: "Kami terus menghadirkan teknologi yang memudahkan anggota.", ikon: Lightbulb },
];

export default async function TentangPage() {
  const [pencapaian, penghargaan] = await Promise.all([
    prisma.pencapaian.findMany({ orderBy: [{ tahun: "asc" }, { id: "asc" }] }),
    prisma.penghargaan.findMany({ orderBy: [{ urutan: "asc" }, { tahun: "desc" }] }),
  ]);
  return <div>
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div className="max-w-3xl"><p className="text-sm font-semibold text-secondary">Portofolio</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">Tentang BuyaLater</h1><p className="mt-6 text-lg leading-8 text-slate-600">BuyaLater lahir dari semangat gotong royong. Kami percaya setiap orang berhak mendapatkan akses keuangan yang adil, mudah, dan manusiawi. Berawal dari koperasi kecil, kini kami hadir secara digital agar anggota bisa menabung dan meminjam kapan saja, di mana saja.</p></div><div className="relative h-72 overflow-hidden rounded-2xl"><Image alt="Kegiatan kebersamaan anggota BuyaLater" className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 40vw" src="https://picsum.photos/seed/buyalatter-tentang/1000/700" /></div></div></section>

    <section className="border-y bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
      <Card className="bg-gradient-to-br from-[#1A2A6C] via-[#1E5FC7] to-[#4FB8EC] p-8 text-white"><Eye aria-hidden className="h-8 w-8 text-sky-100" /><h2 className="mt-4 text-2xl font-bold">Visi</h2><p className="mt-3 leading-7 text-blue-50">Menjadi koperasi simpan pinjam digital yang paling dipercaya dan paling dekat dengan anggotanya.</p></Card>
      <Card className="p-8"><Target aria-hidden className="h-8 w-8 text-secondary" /><h2 className="mt-4 text-2xl font-bold text-primary">Misi</h2><ol className="mt-4 space-y-3">{misi.map((item, index) => <li className="flex gap-3 text-sm leading-6 text-slate-600" key={item}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-secondary">{index + 1}</span>{item}</li>)}</ol></Card>
    </div></section>

    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="max-w-xl"><p className="text-sm font-semibold text-secondary">Nilai kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Yang kami pegang setiap hari</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{nilai.map((item) => { const Icon = item.ikon; return <Card className="p-6" key={item.nama}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-secondary"><Icon aria-hidden className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{item.nama}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.teks}</p></Card>; })}</div></section>

    {pencapaian.length > 0 && <section className="border-y bg-white"><div className="mx-auto max-w-4xl px-5 py-20 lg:px-8"><div className="text-center"><p className="text-sm font-semibold text-secondary">Perjalanan</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Timeline pencapaian</h2></div>
      <ol className="relative mt-14 space-y-10 before:absolute before:bottom-2 before:left-6 before:top-2 before:w-0.5 before:bg-gradient-to-b before:from-[#1A2A6C] before:via-[#1E5FC7] before:to-[#4FB8EC] md:before:left-1/2 md:before:-translate-x-1/2">
        {pencapaian.map((item, index) => <li className={`relative pl-16 md:w-1/2 md:pl-0 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:ml-auto md:pl-12"}`} key={item.id}>
          <span className={`absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-md ring-4 ring-blue-100 md:top-1 ${index % 2 === 0 ? "md:left-auto md:right-0 md:translate-x-1/2" : "md:-translate-x-1/2"}`}><DynamicIcon name={item.ikon} /></span>
          <p className="text-2xl font-black text-secondary">{item.tahun}</p><h3 className="mt-1 font-bold text-slate-900">{item.judul}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">{item.deskripsi}</p>
        </li>)}
      </ol></div></section>}

    {penghargaan.length > 0 && <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="max-w-xl"><p className="text-sm font-semibold text-secondary">Penghargaan</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Pengakuan atas kepercayaan anggota</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{penghargaan.map((item) => <Card className="p-6" key={item.id}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><DynamicIcon className="h-6 w-6" name={item.ikon} /></span><p className="mt-5 text-xs font-bold text-secondary">{item.tahun}</p><h3 className="mt-1 font-bold leading-6 text-slate-900">{item.judul}</h3><p className="mt-1 text-sm text-slate-500">{item.pemberi}</p>{item.deskripsi && <p className="mt-2 text-xs leading-5 text-slate-400">{item.deskripsi}</p>}</Card>)}</div><p className="mt-4 text-xs text-slate-400">Seluruh penghargaan bersifat fiktif (proyek akademik).</p></section>}

    <section className="bg-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="max-w-xl"><p className="text-sm font-semibold text-secondary">Tim kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Orang-orang di balik BuyaLater</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{TIM.map((orang, index) => <Card className="p-6 text-center" key={index}><PreviewImage alt={orang.nama || "Foto anggota tim"} className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-blue-100" src={orang.foto} /><h3 className={`mt-5 font-bold ${orang.nama ? "text-slate-900" : "text-slate-300"}`}>{orang.nama || "Nama anggota"}</h3><p className={`mt-1 text-sm ${orang.peran ? "text-secondary" : "text-slate-300"}`}>{orang.peran || "Peran"}</p></Card>)}</div></div></section>
  </div>;
}
