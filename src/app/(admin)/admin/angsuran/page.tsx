import Link from "next/link";
import { AKSES, requireRole } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { syncStatusTerlambat } from "@/lib/angsuran";
import { bayarAngsuranTunai, updateDendaAngsuran } from "../actions";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AksiForm, TombolKirim } from "@/components/ui/aksi-form";

export const dynamic = "force-dynamic";

const statusVariant = { BELUM: "warning", MENUNGGU_VERIFIKASI: "info", LUNAS: "success", TERLAMBAT: "danger" } as const;
const statusLabel = { BELUM: "Belum bayar", MENUNGGU_VERIFIKASI: "Menunggu verifikasi", LUNAS: "Lunas", TERLAMBAT: "Terlambat" } as const;

export default async function AdminAngsuranPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireRole(...AKSES.angsuran);
  const bolehTunai = AKSES.angsuranTunai.includes(user.role); const bolehDenda = AKSES.angsuranDenda.includes(user.role);
  await syncStatusTerlambat();
  const params = await searchParams; const page = Math.max(1, Number(params.page ?? 1) || 1); const pageSize = 15;
  const [installments, total] = await Promise.all([
    prisma.angsuran.findMany({
      include: { pinjaman: { include: { anggota: { include: { user: true } } } }, pembayaran: { where: { status: "MENUNGGU" }, take: 1 } },
      orderBy: { tanggalJatuhTempo: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.angsuran.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return <div className="space-y-8">
    <div><p className="text-sm font-semibold text-green">Transaksi keuangan</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pembayaran angsuran</h1><p className="mt-2 text-sm text-slate-500">Catat pembayaran angsuran yang diterima koperasi, atau tandai lunas untuk pembayaran tunai.</p></div>
    <Card>
      <CardHeader><CardTitle>{total} jadwal angsuran</CardTitle></CardHeader>
      <CardContent className="p-0">
        {installments.length ? <div className="divide-y divide-slate-100">{installments.map((item) => {
          const total = item.jumlah.plus(item.denda);
          const pending = item.pembayaran[0];
          return <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
            <div>
              <p className="font-bold text-slate-800">{item.pinjaman.anggota.user.nama} · Angsuran ke-{item.angsuranKe}</p>
              <p className="mt-1 text-sm text-slate-500">{formatRupiah(total)}{item.denda.gt(0) && <span className="text-red-600"> (termasuk denda {formatRupiah(item.denda)})</span>} · jatuh tempo {formatTanggal(item.tanggalJatuhTempo)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge>
              {(item.status === "BELUM" || item.status === "TERLAMBAT") && <>
                {bolehDenda && <AksiForm aksi={updateDendaAngsuran.bind(null, item.id)} className="flex flex-wrap items-center gap-2">
                  <Input className="h-9 w-32" defaultValue={item.denda.toString()} min="0" name="denda" placeholder="Denda" step="0.01" type="number" />
                  <TombolKirim size="sm"  variant="outline">Set denda</TombolKirim>
                </AksiForm>}
                {bolehTunai && <AksiForm aksi={bayarAngsuranTunai.bind(null, item.id)}><input name="tanggalBayar" type="hidden" value={new Date().toISOString().slice(0, 10)} />
                  <TombolKirim size="sm"  variant="secondary">Tandai lunas (tunai)</TombolKirim>
                </AksiForm>}
              </>}
              {item.status === "MENUNGGU_VERIFIKASI" && pending && (
                <Link className="text-xs font-bold text-navy hover:underline" href={`/admin/verifikasi-pembayaran/${pending.id}`}>Lihat bukti pembayaran →</Link>
              )}
            </div>
          </div>;
        })}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">Belum ada jadwal angsuran.</p>}
        <Pagination basePath="/admin/angsuran" currentPage={page} totalPages={totalPages} />
      </CardContent>
    </Card>
  </div>;
}
