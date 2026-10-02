"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function RegisterForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const response = await fetch("/api/register", { method: "POST", body: new FormData(form) });
    const result = await response.json();
    setMessage(result.message);
    setSuccess(response.ok);
    setPending(false);
    if (response.ok) form.reset();
  }
  return <form className="space-y-4" onSubmit={submit}><Input id="nama" label="Nama lengkap" name="nama" placeholder="Nama sesuai KTP" required /><div className="grid gap-4 sm:grid-cols-2"><Input id="email" label="Email" name="email" placeholder="nama@email.com" required type="email" /><Input id="noHp" label="Nomor HP" name="noHp" placeholder="08xxxxxxxxxx" required /></div><Input id="nik" label="NIK" inputMode="numeric" maxLength={16} name="nik" pattern="\d{16}" placeholder="16 digit NIK" required title="NIK harus terdiri dari 16 digit angka" /><Input id="alamat" label="Alamat" name="alamat" placeholder="Alamat tempat tinggal" required /><div className="grid gap-4 sm:grid-cols-2"><Input id="password" label="Password" minLength={8} name="password" placeholder="Minimal 8 karakter" required type="password" /><Input id="tanggalMasuk" label="Tanggal bergabung" name="tanggalMasuk" required type="date" /></div><Input accept="image/*" id="fotoKtp" label="Foto KTP" name="fotoKtp" required type="file" /><p className="-mt-2 text-xs text-slate-400">Foto KTP digunakan untuk verifikasi data oleh admin sebelum akun aktif sepenuhnya. Format JPG/PNG/WEBP, maks 5MB.</p><Button className="w-full" disabled={pending} type="submit">{pending ? "Mendaftarkan..." : "Daftar sebagai anggota"}</Button>{message && <p className={`text-sm font-semibold ${success ? "text-green-700" : "text-red-600"}`}>{message}</p>}</form>;
}