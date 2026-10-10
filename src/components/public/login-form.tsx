"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Perangkat = "ios-browser" | "ios-app" | "lain";

function bacaPerangkat(): Perangkat {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!ios) return "lain";
  // WebView aplikasi (Capacitor) tidak punya token "Safari" di user agent.
  return /Safari/.test(ua) ? "ios-browser" : "ios-app";
}
const langgananKosong = () => () => {};

function IkonGoogle() {
  return <svg aria-hidden className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>;
}
function IkonApple() {
  return <svg aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.3-.9-2.3-4.1zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>;
}

export function LoginForm({ callbackUrl = "/anggota/dashboard", sosial = { google: false, apple: false } }: { callbackUrl?: string; sosial?: { google: boolean; apple: boolean } }) {
  const perangkat = useSyncExternalStore(langgananKosong, bacaPerangkat, () => "lain" as Perangkat);
  // Apple hanya ditawarkan di perangkat iOS; Google menolak login di WebView aplikasi, jadi disembunyikan di sana.
  const tampilApple = sosial.apple && perangkat !== "lain";
  const tampilGoogle = sosial.google && perangkat !== "ios-app";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (result?.error) {
      setError(result.code === "terkunci" ? "Terlalu banyak percobaan gagal. Akun dikunci 15 menit, coba lagi nanti." : "Email atau password tidak sesuai.");
      setPending(false);
      return;
    }
    const session = await getSession();
    const destination = callbackUrl !== "/anggota/dashboard"
      ? callbackUrl
      : session?.user.role && session.user.role !== "ANGGOTA"
        ? "/admin/dashboard"
        : "/anggota/dashboard";
    window.location.assign(destination);
  }
  return <><form className="mt-8 space-y-4" onSubmit={submit}><Input id="email" label="Email" name="email" placeholder="nama@email.com" required type="email" /><Input id="password" label="Password" name="password" placeholder="Masukkan password" required type="password" /><div className="text-right"><Link className="text-sm font-semibold text-secondary hover:underline" href="/lupa-password">Lupa password?</Link></div><Button className="w-full" disabled={pending} type="submit">{pending ? "Memeriksa..." : "Masuk"}</Button>{error && <p className="text-sm font-semibold text-red-600">{error}</p>}</form>{(tampilGoogle || tampilApple) && <div className="mt-6 space-y-3"><div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>{tampilGoogle && <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => signIn("google", { redirectTo: callbackUrl })} type="button"><IkonGoogle />Masuk dengan Google</button>}{tampilApple && <button className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-black text-sm font-semibold text-white hover:bg-slate-800" onClick={() => signIn("apple", { redirectTo: callbackUrl })} type="button"><IkonApple />Masuk dengan Apple</button>}<p className="text-center text-xs text-slate-400">Hanya untuk anggota yang sudah terdaftar dengan email yang sama.</p></div>}</>;
}