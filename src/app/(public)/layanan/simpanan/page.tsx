import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconCalendarCheck, IconPiggyBank, IconTrendingUp } from "@/components/ui/icons";

export const metadata = { title: "Layanan Simpanan" };

const jenisSimpanan = [
  { title: "Simpanan Pokok", amount: "Rp 100.000", text: "Setoran awal sebagai tanda keanggotaan koperasi.", icon: IconPiggyBank },
  { title: "Simpanan Wajib", amount: "Rp 50.000 / bulan", text: "Setoran rutin untuk memperkuat dana bersama.", icon: IconCalendarCheck },
  { title: "Simpanan Sukarela", amount: "Sesuai kemampuan", text: "Simpanan fleksibel untuk tujuan finansial pribadi.", icon: IconTrendingUp },
];

export default function SimpananPage() {
  return <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div className="max-w-2xl"><p className="text-sm font-semibold text-secondary">Layanan simpanan</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Simpan hari ini, kuatkan hari esok.</h1><p className="mt-6 text-lg leading-8 text-slate-500">Pilih jenis simpanan yang sesuai dengan kebutuhan dan rencana keuangan Anda.</p></div><div className="relative h-56 overflow-hidden rounded-2xl"><Image alt="Menabung bersama untuk masa depan" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 40vw" src="https://picsum.photos/seed/buyalatter-simpanan/1000/700" /></div></div><div className="mt-14 grid gap-5 md:grid-cols-3">{jenisSimpanan.map(({ title, amount, text, icon: Icon }) => <div className="rounded-xl border bg-white p-6 shadow-sm" key={title}><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-secondary"><Icon /></div><h2 className="mt-8 text-xl font-bold text-slate-900">{title}</h2><p className="mt-2 font-semibold text-secondary">{amount}</p><p className="mt-4 text-sm leading-6 text-slate-500">{text}</p></div>)}</div><div className="mt-14 rounded-2xl bg-navy-deep p-8 text-white"><h2 className="text-2xl font-bold">Belum menjadi anggota?</h2><p className="mt-2 text-sm text-blue-100/70">Daftar sekarang untuk mulai membangun simpanan bersama.</p><Button className="mt-6" href="/register" variant="secondary">Daftar Anggota</Button></div><p className="mt-8 text-sm text-slate-500">Ingin melihat layanan pinjaman? <Link className="font-bold text-navy hover:underline" href="/layanan/pinjaman">Pelajari pinjaman</Link>.</p></div>;
}