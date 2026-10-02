import Link from "next/link";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { BadgeCheck, CalendarClock, Check, ClipboardList, Landmark, Sparkles, UserPlus, Wallet, Banknote, GraduationCap, Siren, PiggyBank, Store, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBannerAktif } from "@/lib/banner";
import { formatTanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Logo } from "@/components/ui/logo";
import { PreviewImage } from "@/components/ui/preview-image";
import { MitraMarquee } from "@/components/MitraMarquee";
import { LatarGelap, PenghargaanBaris, SorotanMitra } from "@/components/public/mitra-gelap";
import { CountUp } from "@/components/public/count-up";
import { TestimoniCarousel } from "@/components/public/testimoni-carousel";

export const dynamic = "force-dynamic";

const langkah: { judul: string; teks: string; ikon: LucideIcon }[] = [
  { judul: "Daftar Akun", teks: "Buat akun gratis hanya dengan email dan nomor HP.", ikon: UserPlus },
  { judul: "Lengkapi Data", teks: "Isi profil dan tambahkan rekening bank untuk pencairan.", ikon: ClipboardList },
  { judul: "Ajukan Pinjaman", teks: "Tentukan nominal dan tenor, lihat simulasi cicilannya langsung.", ikon: Wallet },
  { judul: "Dana Cair", teks: "Setelah disetujui, dana ditransfer langsung ke rekening Anda.", ikon: Landmark },
];

const produk: { nama: string; teks: string; href: string; ikon: LucideIcon }[] = [
  { nama: "Simpanan Pokok", teks: "Modal dasar keanggotaan Anda di BuyaLater.", href: "/layanan/simpanan", ikon: Landmark },
  { nama: "Simpanan Wajib", teks: "Tabungan rutin bulanan yang membangun kebiasaan menabung.", href: "/layanan/simpanan", ikon: PiggyBank },
  { nama: "Simpanan Sukarela", teks: "Menabung kapan saja, sesuai kemampuan Anda.", href: "/layanan/simpanan", ikon: Sparkles },
  { nama: "Pinjaman Usaha", teks: "Modal untuk mengembangkan usaha kecil Anda.", href: "/layanan/pinjaman", ikon: Store },
  { nama: "Pinjaman Pendidikan", teks: "Biaya sekolah dan kuliah tanpa perlu khawatir.", href: "/layanan/pinjaman", ikon: GraduationCap },
  { nama: "Pinjaman Darurat", teks: "Dana cepat untuk kebutuhan mendesak.", href: "/layanan/pinjaman", ikon: Siren },
];

export default async function Home() {
  const [banners, anggotaAktif, pencairan, pinjamanDisetujui, keunggulan, testimoni, mitra, penghargaan, artikel] = await Promise.all([
    getBannerAktif("HERO"),
    prisma.anggota.count({ where: { status: "AKTIF" } }),
    prisma.pencairan.aggregate({ _sum: { jumlahDicairkan: true } }),
    prisma.pinjaman.count({ where: { status: { in: ["DISETUJUI", "DICAIRKAN", "LUNAS"] } } }),
    prisma.keunggulan.findMany({ orderBy: { urutan: "asc" } }),
    prisma.testimoni.findMany({ where: { isTampil: true }, orderBy: { id: "asc" } }),
    prisma.mitra.findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }] }),
    prisma.penghargaan.findMany({ orderBy: [{ urutan: "asc" }, { tahun: "desc" }] }),
    prisma.artikel.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const unggulan = mitra.find((m) => m.isUnggulan);
  const strategis = mitra.filter((m) => m.tingkat === "STRATEGIS");
  const pendukung = mitra.filter((m) => m.tingkat === "PENDUKUNG");
  const ringkasMitra = (m: (typeof mitra)[number]) => ({ id: m.id, nama: m.nama, logoUrl: m.logoUrl, kategori: m.kategori });
  const danaTersalurkan = (pencairan._sum.jumlahDicairkan ?? new Prisma.Decimal(0)).toDecimalPlaces(0).toNumber();
  const statistik = [
    { label: "Anggota Aktif", value: anggotaAktif, prefix: "", suffix: "" },
    { label: "Dana Tersalurkan", value: danaTersalurkan, prefix: "Rp ", suffix: "" },
    { label: "Pinjaman Disetujui", value: pinjamanDisetujui, prefix: "", suffix: "" },
    { label: "Tingkat Kepuasan", value: 98, prefix: "", suffix: "%" },
  ];

  return <div>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1A2A6C] via-[#1E5FC7] to-[#4FB8EC]">
      <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border-[60px] border-white/10!" />
      <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
        <div className="relative">
          <p className="animate-masuk mb-5 text-sm font-bold uppercase tracking-[0.22em] text-sky-100">Simpan Pinjam Online Terpercaya</p>
          <h1 className="animate-masuk [animation-delay:120ms] max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">Wujudkan Rencana Anda, Bayar dengan Tenang</h1>
          <p className="animate-masuk [animation-delay:240ms] mt-6 max-w-xl text-base leading-7 text-blue-50/90">BuyaLater membantu Anda menabung lebih teratur dan meminjam dengan bunga ringan. Proses cepat, cicilan jelas, tanpa biaya tersembunyi.</p>
          <div className="animate-masuk [animation-delay:360ms] mt-8 flex flex-wrap gap-4"><Button href="/anggota/pinjaman/ajukan" size="lg" variant="secondary">Ajukan Pinjaman</Button><Button className="border-2 border-white/60 bg-white/10 text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-primary" href="/simulasi-pinjaman" size="lg" variant="outline">Simulasi Cicilan</Button></div>
          <p className="mt-6 flex items-center gap-2 text-sm text-blue-50/80"><BadgeCheck aria-hidden className="h-4 w-4 shrink-0 text-sky-200" />Bergabung bersama ribuan anggota yang sudah merasakan manfaatnya</p>
        </div>
        <div aria-hidden className="relative mx-auto hidden h-[26rem] w-full max-w-md lg:block">
          <div className="absolute inset-x-8 inset-y-6 rounded-[2rem] border border-white/25 bg-white/10 backdrop-blur-sm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Logo height={190} href={null} variant="ikon" /></div>
          <div className="absolute left-0 top-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">Pinjaman disetujui</strong><span className="text-xs text-slate-500">Dana siap dicairkan</span></span></div>
          <div className="absolute bottom-16 right-0 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-secondary"><Banknote className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">Cicilan Rp 450.000</strong><span className="text-xs text-slate-500">per bulan, tenor 12 bulan</span></span></div>
          <div className="absolute bottom-2 left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"><CalendarClock className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">Jatuh tempo 3 hari lagi</strong><span className="text-xs text-slate-500">Pengingat otomatis</span></span></div>
        </div>
      </div>
    </section>

    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 lg:px-8"><div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border bg-slate-200 shadow-kartu lg:grid-cols-4">{statistik.map((item) => <div className="bg-white px-6 py-7 text-center" key={item.label}><p className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"><CountUp prefix={item.prefix} suffix={item.suffix} value={item.value} /></p><p className="mt-2 text-xs font-semibold text-slate-500">{item.label}</p></div>)}</div></section>

    {banners.length > 0 && <section className="mx-auto max-w-7xl space-y-5 px-5 pt-16 lg:px-8">{banners.map((banner) => <div className="relative overflow-hidden rounded-[28px] bg-primary" key={banner.id}><PreviewImage alt={banner.judul} className="h-56 w-full object-cover sm:h-72" src={banner.gambarUrl} /><div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-primary/85 via-primary/50 to-transparent px-7 sm:px-12"><h2 className="max-w-lg text-2xl font-bold text-white sm:text-3xl">{banner.judul}</h2>{banner.subjudul && <p className="mt-2 max-w-md text-sm text-blue-50">{banner.subjudul}</p>}{banner.linkTujuan && banner.teksTombol && <Button className="mt-5 w-fit bg-white text-secondary hover:bg-blue-50" href={banner.linkTujuan} variant="outline">{banner.teksTombol}</Button>}</div></div>)}</section>}

    <section className="bg-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="max-w-xl"><p className="text-sm font-semibold text-secondary">Keunggulan kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Mengapa memilih BuyaLater?</h2></div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{keunggulan.map((item) => <Card className="p-6 transition-shadow hover:shadow-lg" key={item.id}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-secondary"><DynamicIcon className="h-6 w-6" name={item.ikon} /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{item.judul}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.deskripsi}</p></Card>)}</div>
    </div></section>

    <section className="bg-[#F7F8FC]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-xl text-center"><p className="text-sm font-semibold text-secondary">Cara kerja</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Empat langkah mudah</h2></div>
      <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
        <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-7 hidden border-t-2 border-dashed border-accent/60 md:block" />
        {langkah.map((item, index) => { const Icon = item.ikon; return <li className="relative flex gap-4 md:flex-col md:items-center md:text-center" key={item.judul}><span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A2A6C] to-[#1E5FC7] text-lg font-bold text-white shadow-lg shadow-secondary/30">{index + 1}</span><div><Icon aria-hidden className="mb-2 hidden h-5 w-5 text-secondary md:mx-auto md:block" /><h3 className="font-bold text-slate-900">{item.judul}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">{item.teks}</p></div></li>; })}
      </ol>
    </div></section>

    <section className="bg-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="max-w-xl"><p className="text-sm font-semibold text-secondary">Produk kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Pilih yang sesuai kebutuhan Anda</h2></div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{produk.map((item) => { const Icon = item.ikon; return <Card className="flex flex-col p-6 transition-shadow hover:shadow-lg" key={item.nama}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 text-secondary"><Icon aria-hidden className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{item.nama}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{item.teks}</p><Button className="mt-6 w-fit" href={item.href} size="sm" variant="outline">Lihat Detail</Button></Card>; })}</div>
    </div></section>

    {testimoni.length > 0 && <section className="bg-[#F7F8FC]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="-mb-10 max-w-xl"><p className="text-sm font-semibold text-secondary">Testimoni</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Kata mereka tentang BuyaLater</h2></div><TestimoniCarousel items={testimoni.map((item) => ({ id: item.id, nama: item.nama, pekerjaan: item.pekerjaan, fotoUrl: item.fotoUrl, isi: item.isi, rating: item.rating }))} /></div></section>}

    {mitra.length > 0 && <LatarGelap className="py-20 lg:py-24" id="mitra">
      <div className="mx-auto max-w-2xl px-5 text-center"><h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Dipercaya Lembaga Terbaik</h2><p className="mt-4 leading-7 text-blue-100/70">Kami bekerja sama dengan berbagai lembaga untuk memberikan layanan terbaik dan teraman bagi anggota.</p></div>
      {unggulan && <div className="mx-auto mt-12 max-w-5xl px-5 lg:px-8"><SorotanMitra m={unggulan} /></div>}
      <div className="mt-12 space-y-2">
        <MitraMarquee arah="kiri" mitra={strategis.map(ringkasMitra)} />
        {pendukung.length > 0 && <MitraMarquee arah="kanan" kecil mitra={pendukung.map(ringkasMitra)} />}
      </div>
      <dl className="mx-auto mt-14 grid max-w-5xl grid-cols-1 divide-y divide-white/10 border-y border-white/10 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
        {[{ nilai: mitra.length, akhiran: "", label: "Mitra Resmi" }, { nilai: penghargaan.length, akhiran: "", label: "Penghargaan" }, { nilai: 100, akhiran: "%", label: "Dana Tercatat Transparan" }].map((item) => <div className="py-8 text-center" key={item.label}><dt className="sr-only">{item.label}</dt><dd className="font-heading text-5xl font-extrabold tracking-tight text-white"><CountUp suffix={item.akhiran} value={item.nilai} /></dd><p aria-hidden className="mt-2 text-sm font-medium text-blue-100/70">{item.label}</p></div>)}
      </dl>
      {penghargaan.length > 0 && <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8"><PenghargaanBaris items={penghargaan} /></div>}
      <p className="mt-10 text-center"><Link className="text-sm font-bold hover:underline" href="/mitra" style={{ color: "#4FB8EC" }}>Lihat semua mitra →</Link></p>
    </LatarGelap>}

    <section className="bg-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-secondary">Kabar koperasi</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Artikel terbaru</h2></div><Link className="text-sm font-bold text-secondary hover:underline" href="/berita">Lihat semua berita</Link></div><div className="mt-10 grid gap-5 md:grid-cols-3">{artikel.map((item) => <Card className="overflow-hidden" key={item.id}>{item.gambarUrl ? <div className="relative h-36"><Image alt={item.judul} className="object-cover" fill sizes="(max-width: 768px) 100vw, 33vw" src={item.gambarUrl} /></div> : <div className="h-36 bg-gradient-to-br from-blue-100 to-sky-50" />}<div className="p-5"><p className="text-xs text-slate-400">{formatTanggal(item.createdAt)}</p><h3 className="mt-2 font-bold leading-6 text-slate-900">{item.judul}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.isi}</p><Link className="mt-4 inline-block text-xs font-bold text-secondary hover:underline" href={`/berita/${item.slug}`}>Baca artikel</Link></div></Card>)}</div></div></section>

  </div>;
}
