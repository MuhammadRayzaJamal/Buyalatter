import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { LABEL_PERAN } from "@/lib/akses";
import { buatPengguna, ubahPeran } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengguna" };

const PERAN = ["ADMIN", "MANAJER", "TELLER"] as const;
const selectClass = "h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-sm";

export default async function PenggunaPage() {
  const saya = await requireRole(...AKSES.pengguna);
  const staf = await prisma.user.findMany({ where: { role: { in: [...PERAN] } }, orderBy: [{ role: "asc" }, { nama: "asc" }] });
  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keamanan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pengguna staf</h1><p className="mt-2 text-sm text-slate-500">Admin mengelola pengguna. Manajer menyetujui pinjaman dan pencairan; Teller menginput simpanan dan pembayaran tunai.</p></div>
    <Card><CardHeader><CardTitle>Tambah pengguna</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={buatPengguna} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" resetSetelahSukses>
        <Input id="nama" label="Nama" name="nama" required />
        <Input id="email" label="Email" name="email" required type="email" />
        <Input autoComplete="new-password" id="password" label="Password awal" minLength={8} name="password" required type="password" />
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Peran</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" name="role">{PERAN.map((p) => <option key={p} value={p}>{LABEL_PERAN[p]}</option>)}</select></label>
        <div className="sm:col-span-2 lg:col-span-4"><p className="mb-3 text-xs text-slate-500">Password minimal 8 karakter dengan huruf dan angka.</p><TombolKirim teksProses="Menyimpan...">Tambah pengguna</TombolKirim></div>
      </AksiForm>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{staf.length} pengguna staf</CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-100">{staf.map((u) => <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={u.id}>
      <div><p className="font-semibold text-slate-800">{u.nama}{u.id === saya.id && <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>}</p><p className="text-sm text-slate-500">{u.email}</p></div>
      <div className="flex flex-wrap items-center gap-3"><Badge variant={u.role === "ADMIN" ? "info" : u.role === "MANAJER" ? "success" : "warning"}>{LABEL_PERAN[u.role]}</Badge>
        {u.id !== saya.id && <AksiForm aksi={ubahPeran.bind(null, u.id)} className="flex items-center gap-2"><select className={selectClass} defaultValue={u.role} name="role">{PERAN.map((p) => <option key={p} value={p}>{LABEL_PERAN[p]}</option>)}</select><TombolKirim size="sm" teksProses="..." variant="outline">Ubah peran</TombolKirim></AksiForm>}
      </div>
    </div>)}</div></CardContent></Card>
  </div>;
}
