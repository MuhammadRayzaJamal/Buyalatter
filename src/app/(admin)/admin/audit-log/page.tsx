import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

const ENTITAS = ["Pinjaman", "Pencairan", "Pembayaran", "Simpanan", "Penarikan", "RekeningAnggota", "Pengaturan", "Angsuran", "Anggota", "User", "Mutasi"];
const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "medium" });
const warnaAksi = { CREATE: "success", UPDATE: "info", DELETE: "danger" } as const;

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string; userId?: string; entitas?: string; page?: string }> }) {
  await requireRole(...AKSES.auditLog);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1); const pageSize = 25;
  const dari = /^\d{4}-\d{2}-\d{2}$/.test(params.dari ?? "") ? new Date(`${params.dari}T00:00:00`) : null;
  const sampai = /^\d{4}-\d{2}-\d{2}$/.test(params.sampai ?? "") ? new Date(`${params.sampai}T23:59:59.999`) : null;
  const entitas = ENTITAS.find((e) => e === params.entitas);
  const where: Prisma.AuditLogWhereInput = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(entitas ? { entitas } : {}),
    ...(dari || sampai ? { createdAt: { ...(dari ? { gte: dari } : {}), ...(sampai ? { lte: sampai } : {}) } } : {}),
  };
  const [rows, total, users] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({ select: { id: true, nama: true, role: true }, orderBy: { nama: "asc" } }),
  ]);
  const namaUser = new Map(users.map((u) => [u.id, `${u.nama} (${u.role})`]));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const json = (nilai: unknown) => (nilai === null || nilai === undefined ? null : typeof nilai === "string" ? nilai : JSON.stringify(nilai, null, 2));

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Keamanan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Audit log</h1><p className="mt-2 text-sm text-slate-500">Jejak perubahan data penting. Halaman ini hanya untuk dibaca; catatan tidak dapat diedit atau dihapus.</p></div>
    <Card><CardHeader><CardTitle>Filter</CardTitle></CardHeader><CardContent>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input defaultValue={params.dari ?? ""} id="dari" label="Dari tanggal" name="dari" type="date" />
        <Input defaultValue={params.sampai ?? ""} id="sampai" label="Sampai tanggal" name="sampai" type="date" />
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Pengguna</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" defaultValue={params.userId ?? ""} name="userId"><option value="">Semua pengguna</option>{users.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.role})</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700"><span>Entitas</span><select className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-normal" defaultValue={entitas ?? ""} name="entitas"><option value="">Semua entitas</option>{ENTITAS.map((e) => <option key={e}>{e}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="h-11 rounded-[10px] bg-secondary px-5 text-sm font-bold text-white" type="submit">Terapkan</button><Link className="flex h-11 items-center px-3 text-sm font-semibold text-slate-500 hover:underline" href="/admin/audit-log">Reset</Link></div>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{total} catatan</CardTitle></CardHeader><CardContent className="p-0">
      {rows.length ? <div className="divide-y divide-slate-100">{rows.map((r) => <div className="px-5 py-4 text-sm" key={r.id}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1"><Badge variant={warnaAksi[r.aksi as keyof typeof warnaAksi] ?? "neutral"}>{r.aksi}</Badge><strong className="text-slate-800">{r.entitas}</strong><span className="font-mono text-xs text-slate-400">{r.entitasId}</span><span className="text-xs text-slate-500">{waktu.format(r.createdAt)}</span></div>
        <p className="mt-1 text-xs text-slate-500">Oleh {r.userId ? (namaUser.get(r.userId) ?? r.userId) : "sistem"} · IP {r.ipAddress ?? "-"}</p>
        {(r.dataLama || r.dataBaru) && <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-navy">Lihat perubahan</summary><div className="mt-2 grid gap-3 md:grid-cols-2"><div><p className="text-xs font-semibold text-slate-400">Data lama</p><pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{json(r.dataLama) ?? "-"}</pre></div><div><p className="text-xs font-semibold text-slate-400">Data baru</p><pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{json(r.dataBaru) ?? "-"}</pre></div></div></details>}
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada catatan untuk filter ini.</p>}
      <Pagination basePath="/admin/audit-log" currentPage={page} params={{ dari: params.dari, sampai: params.sampai, userId: params.userId, entitas }} totalPages={totalPages} />
    </CardContent></Card>
  </div>;
}
