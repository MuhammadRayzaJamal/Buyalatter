import { formatRupiah } from "@/lib/format";
import { BATAS_KRITIS_PERSEN, BATAS_PERINGATAN_PERSEN, HARI_PINJAMAN_BERMASALAH, type Kesehatan } from "@/lib/kesehatan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WARNA = {
  aman: { bar: "bg-emerald-500", kotak: "border-emerald-200 bg-emerald-50 text-emerald-900", judul: "Sehat" },
  kuning: { bar: "bg-amber-400", kotak: "border-amber-300 bg-amber-50 text-amber-900", judul: "Peringatan" },
  merah: { bar: "bg-red-600", kotak: "border-red-300 bg-red-50 text-red-900", judul: "Kritis" },
} as const;

/** Indikator prinsip kehati-hatian: pinjaman beredar dibanding simpanan anggota, dan rasio pinjaman bermasalah. */
export function KesehatanKoperasi({ data }: { data: Kesehatan }) {
  const w = WARNA[data.level]; const persen = data.rasio ?? 0;
  const npl = data.bermasalah;
  return <Card>
    <CardHeader><CardTitle>Kesehatan koperasi</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-end justify-between"><div><p className="text-xs text-slate-500">Pinjaman beredar dibanding total simpanan anggota</p><p className="mt-1 text-3xl font-extrabold text-slate-900">{data.rasio === null ? "-" : `${persen}%`}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${w.kotak}`}>{w.judul}</span></div>
          <div aria-label={`Rasio pinjaman terhadap simpanan ${persen}%`} className="relative mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="img"><div className={`h-full ${w.bar}`} style={{ width: `${Math.min(100, persen)}%` }} /><span className="absolute inset-y-0 w-px bg-slate-400" style={{ left: `${BATAS_PERINGATAN_PERSEN}%` }} /><span className="absolute inset-y-0 w-px bg-slate-600" style={{ left: `${BATAS_KRITIS_PERSEN}%` }} /></div>
          <div className="relative mt-1 h-4 text-[10px] text-slate-400"><span className="absolute" style={{ left: `${BATAS_PERINGATAN_PERSEN - 2}%` }}>{BATAS_PERINGATAN_PERSEN}%</span><span className="absolute" style={{ left: `${BATAS_KRITIS_PERSEN - 2}%` }}>{BATAS_KRITIS_PERSEN}%</span></div>
          <p className="mt-2 text-xs text-slate-500">Pokok beredar {formatRupiah(data.beredar)} dari simpanan {formatRupiah(data.simpanan)}.</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pinjaman bermasalah (tunggakan lebih dari {HARI_PINJAMAN_BERMASALAH} hari) dibanding pinjaman beredar</p>
          <p className={`mt-1 text-3xl font-extrabold ${npl.jumlahPinjaman > 0 ? "text-red-600" : "text-slate-900"}`}>{npl.persen === null ? "-" : `${npl.persen}%`}</p>
          <p className="mt-2 text-xs text-slate-500">{npl.jumlahPinjaman} dari {npl.totalPinjaman} pinjaman berjalan · sisa pokok {formatRupiah(npl.nominal)}.</p>
        </div>
      </div>
      {data.level !== "aman" && <p className={`rounded-xl border p-4 text-sm leading-6 ${w.kotak}`}>{data.level === "kuning" ? `Pinjaman beredar sudah melewati ${BATAS_PERINGATAN_PERSEN}% dari simpanan anggota. Berhati-hatilah menyetujui pinjaman baru.` : `Pinjaman beredar melewati ${BATAS_KRITIS_PERSEN}% dari simpanan anggota. Persetujuan pinjaman baru diblokir dan hanya dapat dilakukan oleh Manajer.`}</p>}
    </CardContent>
  </Card>;
}
