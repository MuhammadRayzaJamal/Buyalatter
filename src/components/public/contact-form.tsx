"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/pesan", { body: JSON.stringify(Object.fromEntries(new FormData(form))), headers: { "Content-Type": "application/json" }, method: "POST" });
    const result = await response.json();
    setMessage(result.message);
    setSuccess(response.ok);
    setPending(false);
    if (response.ok) form.reset();
  }

  return <form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><Input id="nama" label="Nama lengkap" name="nama" placeholder="Nama Anda" required /><Input id="email" label="Email" name="email" placeholder="nama@email.com" required type="email" /></div><Input id="subjek" label="Subjek" name="subjek" placeholder="Bagaimana kami dapat membantu?" required /><label className="block space-y-1.5" htmlFor="isi"><span className="block text-sm font-semibold text-slate-700">Pesan</span><textarea className="min-h-32 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100" id="isi" name="isi" placeholder="Tulis pesan Anda..." required /></label><Button disabled={pending} type="submit">{pending ? "Mengirim..." : "Kirim Pesan"}</Button>{message && <p className={`text-sm font-semibold ${success ? "text-green-700" : "text-red-600"}`}>{message}</p>}</form>;
}