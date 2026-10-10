import { jalankanPengecekan } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function TombolPengecekan({ returnTo }: { returnTo: "/admin/tunggakan" | "/admin/pengingat" }) {
  return <form action={jalankanPengecekan.bind(null, returnTo)}><Button type="submit">Jalankan Pengecekan Sekarang</Button></form>;
}

/** Ringkasan hasil pengecekan; format query `dicek=pengingat.terlambat.email.dilewati`. */
export function HasilPengecekan({ dicek, ditunda }: { dicek?: string; ditunda?: string }) {
  if (ditunda) return <div className="rounded-xl bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"><strong>Pengingat ditunda.</strong> Penagihan hanya boleh Senin–Sabtu 08.00–20.00 WIB di luar hari libur ({ditunda}). Status terlambat dan denda tetap diperbarui; pengingat dikirim pada jadwal berikutnya.</div>;
  if (!dicek) return null;
  const [pengingat, terlambat, email, dilewati] = dicek.split(".").map((n) => Number(n) || 0);
  return <div className="rounded-xl bg-green-50 px-5 py-4 text-sm text-green-800"><strong>Pengecekan selesai.</strong> {pengingat} pengingat jatuh tempo dan {terlambat} notifikasi keterlambatan dibuat, {email} email terkirim{dilewati ? `, ${dilewati} dilewati karena anggota sudah diingatkan hari ini (maks. 1 pengingat per hari)` : ""}.</div>;
}
