"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const email = String(new FormData(form).get("email") ?? "");
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/subscribe", { body: JSON.stringify({ email }), headers: { "Content-Type": "application/json" }, method: "POST" });
      const result = await response.json();
      setMessage(result.message); setSuccess(response.ok);
      if (response.ok) form.reset();
    } catch {
      setMessage("Gagal menghubungi server. Coba lagi."); setSuccess(false);
    } finally { setPending(false); }
  }

  return <form className="w-full max-w-md" onSubmit={submit}>
    <label className="sr-only" htmlFor="newsletter-email">Alamat email</label>
    <div className="flex gap-2"><input autoComplete="email" className="h-11 min-w-0 flex-1 rounded-[10px] border border-white/20 bg-white/10 px-3.5 text-sm text-white outline-none placeholder:text-blue-200/60 focus:border-accent focus:ring-4 focus:ring-accent/20" id="newsletter-email" name="email" placeholder="Email Anda" required type="email" /><button className="h-11 shrink-0 rounded-[10px] bg-accent px-4 text-sm font-bold text-primary transition hover:bg-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Mengirim..." : "Berlangganan"}</button></div>
    {message && <p aria-live="polite" className={`mt-2 text-xs font-semibold ${success ? "text-emerald-300" : "text-red-300"}`}>{message}</p>}
  </form>;
}
