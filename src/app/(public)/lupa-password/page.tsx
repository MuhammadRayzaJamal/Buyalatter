import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { mintaResetPassword } from "./actions";

export const metadata = { title: "Lupa Password" };

export default function LupaPasswordPage() {
  return <div className="flex min-h-[calc(100vh-145px)] items-center justify-center px-5 py-16"><div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-kartu"><div className="text-center"><Logo className="mx-auto" height={64} /><h1 className="mt-5 text-2xl font-bold text-primary">Lupa password?</h1><p className="mt-2 text-sm text-slate-500">Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru (berlaku 1 jam).</p></div><AksiForm aksi={mintaResetPassword} className="mt-8 space-y-4"><Input id="email" label="Email" name="email" placeholder="nama@email.com" required type="email" /><TombolKirim className="w-full" teksProses="Mengirim...">Kirim tautan reset</TombolKirim></AksiForm><p className="mt-6 text-center text-sm text-slate-500"><Link className="font-bold text-navy hover:underline" href="/login">← Kembali ke halaman masuk</Link></p></div></div>;
}
