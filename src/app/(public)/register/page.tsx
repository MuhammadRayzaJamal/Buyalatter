import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RegisterForm } from "@/components/public/register-form";

export const metadata = { title: "Registrasi" };

export default function RegisterPage() {
  return <div className="mx-auto grid max-w-5xl gap-12 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8 lg:py-24"><div className="pt-5"><Logo className="mb-8" height={56} priority /><p className="text-sm font-semibold text-secondary">Keanggotaan</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Mulai perjalanan bersama BuyaLater.</h1><p className="mt-5 leading-7 text-slate-500">Lengkapi data diri untuk mengajukan keanggotaan koperasi.</p><div className="mt-8 space-y-4 text-sm text-slate-600"><p>✓ Akses layanan simpanan</p><p>✓ Ajukan pinjaman produktif</p><p>✓ Pantau transaksi dengan transparan</p></div></div><div className="rounded-2xl border bg-white p-6 shadow-sm lg:p-8"><h2 className="text-xl font-bold text-slate-900">Form pendaftaran</h2><p className="mt-2 text-sm text-slate-500">Data Anda akan diverifikasi oleh pengurus.</p><div className="mt-7"><RegisterForm /></div><p className="mt-6 text-center text-sm text-slate-500">Sudah memiliki akun? <Link className="font-bold text-navy hover:underline" href="/login">Masuk di sini</Link></p></div></div>;
}