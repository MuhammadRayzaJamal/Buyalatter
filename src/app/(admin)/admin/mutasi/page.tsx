import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { hitungSaldo } from "@/lib/mutasi";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { catatKoreksi } from "../actions";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buku Mutasi" };

const JENIS = ["SIMPANAN", "PENARIKAN", "PENCAIRAN", "ANGSURAN", "DENDA", "KOREKSI"] as const;
const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminMutasiPage({ searchParams }: { searchParams: Promise<{ anggotaId?: string; jenis?: string; page?: string }> }) {
  const user = await requireRole(...AKSES.mutasi);
  const bolehKoreksi = AKSES.mutasiKoreksi.includes(user.role);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1); const pageSize = 20;
  const jenis = JENIS.find((j) => j === params.jenis);
  const where: Prisma.MutasiWhereInput = { ...(params.anggotaId ? { anggotaId: params.anggotaId } : {}), ...(jenis ? { jenis } : {}) };
  const [anggota, rows, total, saldo] = await Promise.all([
    prisma.anggota.findMany({ include: { user: true }, orderBy: { noAnggota: "asc" } }),
    prisma.mutasi.findMany({ where, include: { anggota: { include: { user: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.mutasi.count({ where }),
    params.anggotaId ? hitungSaldo(prisma, params.anggotaId) : null,
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Buku mutasi</h1><p className="mt-2 text-sm text-slate-500">Catatan semua transaksi uang. Baris mutasi tidak dapat diedit atau dihapus; koreksi dicatat sebagai mutasi baru berjenis KOREKSI.</p></div>

    <Card><CardHeader><CardTitle>Filter</CardTitle></CardHeader><CardContent>
      <form className="grid gap-4 sm:grid-cols-[1fr_200px_auto]">
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Anggota</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" defaultValue={params.anggotaId ?? ""} name="anggotaId"><option value="">Semua anggota</option>{anggota.map((a) => <option key={a.id} value={a.id}>{a.noAnggota} · {a.user.nama}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Jenis</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" defaultValue={jenis ?? ""} name="jenis"><option value="">Semua jenis</option>{JENIS.map((j) => <option key={j}>{j}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="h-11 rounded-[10px] bg-secondary px-5 text-sm font-bold text-white" type="submit">Terapkan</button><Link className="flex h-11 items-center px-3 text-sm font-semibold text-slate-500 hover:underline" href="/admin/mutasi">Reset</Link></div>
      </form>
      {saldo && <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-slate-700">Saldo simpanan anggota terpilih (dihitung dari mutasi): <strong className="text-navy">{formatRupiah(saldo, true)}</strong></p>}
    </CardContent></Card>

    {bolehKoreksi && <Card><CardHeader><CardTitle>Catat koreksi</CardTitle></CardHeader><CardContent>
      <AksiForm aksi={catatKoreksi} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" resetSetelahSukses>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 lg:col-span-2"><span>Anggota</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" name="anggotaId" required><option value="">Pilih anggota</option>{anggota.map((a) => <option key={a.id} value={a.id}>{a.noAnggota} · {a.user.nama}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Arah</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" name="arah"><option value="MASUK">MASUK (menambah saldo)</option><option value="KELUAR">KELUAR (mengurangi saldo)</option></select></label>
        <Input id="jumlah" label="Jumlah (Rp)" min="0.01" name="jumlah" required step="0.01" type="number" />
        <Input className="lg:col-span-3" id="keterangan" label="Alasan koreksi" maxLength={191} name="keterangan" placeholder="Wajib diisi, mis. salah input setoran tgl 5 Okt" required />
        <div className="flex items-end"><TombolKirim teksProses="Menyimpan...">Simpan koreksi</TombolKirim></div>
      </AksiForm>
    </CardContent></Card>}

    <Card><CardHeader><CardTitle>{total} mutasi</CardTitle></CardHeader><CardContent className="p-0">
      <Table emptyMessage="Belum ada mutasi." rows={rows} columns={[
        { key: "createdAt", label: "Waktu", render: (r) => waktu.format(r.createdAt) },
        { key: "anggota", label: "Anggota", render: (r) => <span className="font-semibold text-slate-800">{r.anggota.user.nama}</span> },
        { key: "jenis", label: "Jenis", render: (r) => <Badge variant={r.jenis === "KOREKSI" ? "warning" : "info"}>{r.jenis}</Badge> },
        { key: "jumlah", label: "Jumlah", render: (r) => <strong className={r.arah === "MASUK" ? "text-green-700" : "text-red-600"}>{r.arah === "MASUK" ? "+" : "−"}{formatRupiah(r.jumlah, true)}</strong> },
        { key: "saldoSetelah", label: "Saldo setelah", render: (r) => formatRupiah(r.saldoSetelah, true) },
        { key: "keterangan", label: "Keterangan", render: (r) => r.keterangan ?? "-" },
      ]} />
      <Pagination basePath="/admin/mutasi" currentPage={page} params={{ anggotaId: params.anggotaId, jenis }} totalPages={totalPages} />
    </CardContent></Card>
    <p className="text-xs text-slate-400">Tanggal terakhir diperbarui: {formatTanggal(new Date())}. Saldo simpanan hanya dipengaruhi mutasi SIMPANAN, PENARIKAN, dan KOREKSI; pencairan, angsuran, dan denda dicatat sebagai arus kas koperasi.</p>
  </div>;
}
