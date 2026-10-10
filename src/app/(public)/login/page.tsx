import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { loginSosialAktif } from "@/auth";
import { LoginForm } from "@/components/public/login-form";

export const metadata = { title: "Login" };

const errorMessages: Record<string, string> = {
  admin: "Halaman tersebut hanya dapat diakses oleh admin.",
  role: "Akun ini tidak memiliki akses ke halaman tersebut.",
  "sosial-belum": "Akun Google/Apple ini belum terdaftar sebagai anggota. Daftar dulu lewat form pendaftaran, lalu masuk dengan email yang sama.",
  "sosial-email": "Email dari Google/Apple tidak terverifikasi, sehingga tidak bisa dipakai untuk masuk.",
  "sosial-kunci": "Terlalu banyak percobaan gagal. Akun dikunci 15 menit, coba lagi nanti.",
  profile: "Profil anggota tidak ditemukan. Hubungi pengurus koperasi.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? "Terjadi kendala saat memproses permintaan Anda." : null;
  return <div className="flex min-h-[calc(100vh-145px)] items-center justify-center px-5 py-16"><div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm"><div className="text-center"><Logo className="mx-auto" height={64} priority /><h1 className="mt-5 text-2xl font-bold text-primary">Masuk ke BuyaLater</h1><p className="mt-2 text-sm text-slate-500">Gunakan akun anggota atau admin Anda.</p></div>{errorMessage && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMessage}</p>}<LoginForm callbackUrl={params.callbackUrl ?? "/anggota/dashboard"} sosial={loginSosialAktif} /><p className="mt-6 text-center text-sm text-slate-500">Belum menjadi anggota? <Link className="font-bold text-navy hover:underline" href="/register">Daftar sekarang</Link></p></div></div>;
}