"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pratinjauPinjaman } from "@/app/(anggota)/anggota/actions";
import { RingkasanBiayaPinjaman } from "@/components/pinjaman/ringkasan-biaya";
import type { TampilanRingkasan } from "@/lib/ringkasan";
import { formatRupiah } from "@/lib/format";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function useSubmit(url: string, success: string, asFormData = false, refreshOnSuccess = false) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [success_, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = asFormData
      ? await fetch(url, { method: "POST", body: formData })
      : await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
    const result = await response.json(); setMessage(result.message ?? (response.ok ? success : "Terjadi kesalahan.")); setSuccess(response.ok); setPending(false); if (response.ok) { form.reset(); if (refreshOnSuccess) router.refresh(); }
  }
  return { message, success: success_, pending, submit };
}

export function ProfileForm({ profile }: { profile: { nama: string; email: string; noHp: string; alamat: string; foto: string | null } }) {
  const state = useSubmit("/api/anggota/profil", "Profil berhasil diperbarui.", true, true);
  return <form className="space-y-4" onSubmit={state.submit}><div className="flex items-center gap-4">{profile.foto ? // eslint-disable-next-line @next/next/no-img-element
  <img alt="Foto profil" className="h-16 w-16 shrink-0 rounded-full object-cover" height={64} src={profile.foto} width={64} /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-50 text-lg font-bold text-green-700">{profile.nama.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>}<Input accept="image/*" className="flex-1" id="fotoProfil" label="Ganti foto profil" name="fotoProfil" type="file" /></div><Input defaultValue={profile.nama} id="nama" label="Nama lengkap" name="nama" required /><Input defaultValue={profile.email} id="email" label="Email" name="email" required type="email" /><Input defaultValue={profile.noHp} id="noHp" label="Nomor HP" name="noHp" required /><label className="block space-y-1.5" htmlFor="alamat"><span className="block text-sm font-semibold text-slate-700">Alamat</span><textarea className="min-h-28 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" defaultValue={profile.alamat} id="alamat" name="alamat" required /></label><Button disabled={state.pending} type="submit">{state.pending ? "Menyimpan..." : "Simpan perubahan"}</Button>{state.message && <p className={`text-sm font-semibold ${state.success ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}</form>;
}

export function KtpForm({ needsReupload }: { needsReupload: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/anggota/ktp", { method: "POST", body: new FormData(form) });
    const result = await response.json();
    setMessage(result.message ?? "Terjadi kesalahan.");
    setSuccess(response.ok);
    setPending(false);
    if (response.ok) { form.reset(); router.refresh(); }
  }

  return <form className="space-y-3" onSubmit={submit}><Input accept="image/*" id="fotoKtpBaru" label={needsReupload ? "Unggah ulang foto KTP" : "Ganti foto KTP"} name="fotoKtp" required type="file" /><p className="text-xs text-slate-400">Mengunggah foto baru akan mengatur ulang status verifikasi menjadi menunggu peninjauan admin.</p><Button disabled={pending} size="sm" type="submit">{pending ? "Mengunggah..." : "Kirim untuk verifikasi"}</Button>{message && <p className={`text-sm font-semibold ${success ? "text-green-700" : "text-red-600"}`}>{message}</p>}</form>;
}

export function WithdrawalForm({ balance, min, maksInput }: { balance: string; min: string; maksInput: string }) {
  const state = useSubmit("/api/anggota/penarikan", "Pengajuan penarikan berhasil dikirim.");
  // Hanya untuk menampilkan/menyembunyikan form; validasi nominal sebenarnya dilakukan server dengan Decimal.
  if (Number(balance) < Number(min)) {
    return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">Saldo sukarela belum mencukupi untuk penarikan. Minimal penarikan {formatRupiah(min)}, saldo tersedia saat ini {formatRupiah(balance)}.</p>;
  }
  return <form className="space-y-4" onSubmit={state.submit}><Input id="jumlah" label="Jumlah penarikan" max={maksInput} min={min} name="jumlah" placeholder="Contoh: 100000" required step="0.01" type="number" /><p className="text-xs text-slate-500">Saldo sukarela tersedia: {formatRupiah(balance)}</p><Button disabled={state.pending} type="submit">{state.pending ? "Mengajukan..." : "Ajukan penarikan"}</Button>{state.message && <p className={`text-sm font-semibold ${state.success ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}</form>;
}

export function LoanApplicationForm({ min, maks }: { min: string; maks: string }) {
  const state = useSubmit("/api/anggota/pinjaman", "Pengajuan pinjaman berhasil dikirim.");
  const [jumlah, setJumlah] = useState("");
  const [tenor, setTenor] = useState("12");
  const [ringkasan, setRingkasan] = useState<TampilanRingkasan | null>(null);
  const [galat, setGalat] = useState("");
  // Pratinjau biaya dihitung server (sumber yang sama dengan akad) setiap jumlah/tenor berubah.
  useEffect(() => {
    if (!jumlah) return;
    let batal = false;
    const timer = setTimeout(async () => {
      const hasil = await pratinjauPinjaman(jumlah, tenor);
      if (batal) return;
      if (hasil.ok) { setRingkasan(hasil.data); setGalat(""); } else { setRingkasan(null); setGalat(hasil.pesan); }
    }, 300);
    return () => { batal = true; clearTimeout(timer); };
  }, [jumlah, tenor]);
  return <form className="space-y-4" onSubmit={state.submit}><Input id="jumlah" label={`Jumlah pinjaman (${formatRupiah(min)} – ${formatRupiah(maks)})`} max={maks} min={min} name="jumlah" onChange={(e) => setJumlah(e.target.value)} placeholder="Contoh: 5000000" required step="0.01" type="number" value={jumlah} /><Input id="tenorBulan" label="Tenor (bulan)" max="24" min="3" name="tenorBulan" onChange={(e) => setTenor(e.target.value)} placeholder="12" required type="number" value={tenor} />{jumlah && ringkasan && <RingkasanBiayaPinjaman data={ringkasan} sembunyikanHak />}{jumlah && galat && <p className="text-xs text-amber-700">{galat}</p>}<label className="block space-y-1.5" htmlFor="alasan"><span className="block text-sm font-semibold text-slate-700">Tujuan pinjaman</span><textarea className="min-h-28 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" id="alasan" name="alasan" placeholder="Jelaskan kebutuhan pinjaman" required /></label><Button disabled={state.pending} type="submit">{state.pending ? "Mengajukan..." : "Kirim pengajuan"}</Button>{state.message && <p className={`text-sm font-semibold ${state.success ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}</form>;
}
