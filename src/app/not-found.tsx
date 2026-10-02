import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function NotFound() {
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-16"><div className="max-w-md text-center"><Logo className="mx-auto mb-8" height={72} /><p className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-7xl font-black tracking-tight text-transparent">404</p><h1 className="mt-5 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1><p className="mt-3 text-sm leading-6 text-slate-500">Alamat yang kamu buka mungkin sudah dipindahkan atau belum tersedia.</p><div className="mt-7 flex justify-center gap-3"><Button href="/">Ke Beranda</Button><Button href="/login" variant="outline">Masuk</Button></div></div></main><Footer /></div>;
}