"use client";

import { createContext, useContext, useState, useTransition, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Button } from "./button";

export type HasilAksi = { ok: boolean; pesan: string } | null;

const SedangProses = createContext(false);

/** Tombol submit yang otomatis nonaktif selama Server Action berjalan, mencegah klik ganda. */
export function TombolKirim({ children, teksProses = "Memproses...", disabled, ...props }: ComponentProps<typeof Button> & { teksProses?: string }) {
  const pending = useContext(SedangProses);
  return <Button {...props} aria-busy={pending} disabled={pending || disabled} type="submit">{pending ? teksProses : children}</Button>;
}

/**
 * Form untuk Server Action yang mengembalikan { ok, pesan }. Menampilkan pesan hasil (termasuk
 * "Transaksi sudah diproses sebelumnya.") tanpa melempar error ke error boundary. Isian form dipertahankan
 * bila aksi gagal, dan hanya dikosongkan bila `resetSetelahSukses` dan aksi berhasil.
 */
export function AksiForm({
  aksi,
  children,
  className = "",
  resetSetelahSukses = false,
}: {
  aksi: (formData: FormData) => Promise<{ ok: boolean; pesan: string }>;
  children: ReactNode;
  className?: string;
  resetSetelahSukses?: boolean;
}) {
  const [hasil, setHasil] = useState<HasilAksi>(null);
  const [pending, mulai] = useTransition();

  function kirim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    mulai(async () => {
      const respons = await aksi(formData);
      setHasil(respons);
      if (respons.ok && resetSetelahSukses) form.reset();
    });
  }

  return (
    <SedangProses.Provider value={pending}>
      <form className={className} onSubmit={kirim}>
        {children}
        {hasil && <p aria-live="polite" className={`mt-2 text-xs font-semibold ${hasil.ok ? "text-emerald-600" : "text-red-600"}`} role={hasil.ok ? "status" : "alert"}>{hasil.pesan}</p>}
      </form>
    </SedangProses.Provider>
  );
}
