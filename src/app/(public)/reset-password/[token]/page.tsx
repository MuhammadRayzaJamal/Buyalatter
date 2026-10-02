import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "../../lupa-password/actions";

export const metadata = { title: "Atur Ulang Password" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <div className="flex min-h-[calc(100vh-145px)] items-center justify-center px-5 py-16"><div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-kartu"><div className="text-center"><Logo className="mx-auto" height={64} /><h1 className="mt-5 text-2xl font-bold text-primary">Buat password baru</h1><p className="mt-2 text-sm text-slate-500">Minimal 8 karakter dengan huruf dan angka.</p></div><AksiForm aksi={resetPassword} className="mt-8 space-y-4"><input name="token" type="hidden" value={token} /><Input autoComplete="new-password" id="password" label="Password baru" minLength={8} name="password" required type="password" /><Input autoComplete="new-password" id="konfirmasi" label="Ulangi password baru" minLength={8} name="konfirmasi" required type="password" /><TombolKirim className="w-full" teksProses="Menyimpan...">Simpan password</TombolKirim></AksiForm><p className="mt-6 text-center text-sm text-slate-500"><Link className="font-bold text-navy hover:underline" href="/login">Masuk</Link></p></div></div>;
}
