"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function LoginForm({ callbackUrl = "/anggota/dashboard" }: { callbackUrl?: string }) {
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
  return <form className="mt-8 space-y-4" onSubmit={submit}><Input id="email" label="Email" name="email" placeholder="nama@email.com" required type="email" /><Input id="password" label="Password" name="password" placeholder="Masukkan password" required type="password" /><div className="text-right"><Link className="text-sm font-semibold text-secondary hover:underline" href="/lupa-password">Lupa password?</Link></div><Button className="w-full" disabled={pending} type="submit">{pending ? "Memeriksa..." : "Masuk"}</Button>{error && <p className="text-sm font-semibold text-red-600">{error}</p>}</form>;
}