"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Warna grafik diambil dari variabel CSS (--g-*) sehingga otomatis mengikuti mode gelap/terang. */
export const WARNA_GRAFIK = {
  biru: "var(--g-biru)",
  langit: "var(--g-langit)",
  hijau: "var(--g-hijau)",
  emas: "var(--g-emas)",
  merah: "var(--g-merah)",
  ungu: "var(--g-ungu)",
} as const;
export type NamaWarna = keyof typeof WARNA_GRAFIK;
const URUTAN: NamaWarna[] = ["biru", "langit", "emas", "hijau", "ungu", "merah"];

export type FormatNilai = "rupiah" | "angka" | "persen";

function ringkas(n: number) {
  const a = Math.abs(n);
  if (a >= 1e9) return `${+(n / 1e9).toFixed(1)} M`;
  if (a >= 1e6) return `${+(n / 1e6).toFixed(1)} jt`;
  if (a >= 1e3) return `${Math.round(n / 1e3)} rb`;
  return String(Math.round(n));
}
function tampil(n: number, f: FormatNilai) {
  if (f === "rupiah") return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  if (f === "persen") return `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  return n.toLocaleString("id-ID");
}
const sumbu = (f: FormatNilai) => (n: number) => (f === "rupiah" ? ringkas(n) : f === "persen" ? `${n}%` : String(n));

type TipProps = { active?: boolean; payload?: { name?: string; value?: number | string; color?: string; payload?: { warna?: string } }[]; label?: string | number };
function TipKartu({ active, payload, label, format }: TipProps & { format: FormatNilai }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur">
      {label !== undefined && label !== "" && <p className="mb-1.5 font-semibold text-slate-800">{label}</p>}
      {payload.map((p, i) => (
        <p className="flex items-center gap-2 text-slate-600" key={i}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.warna }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-4 font-bold text-slate-900">{tampil(Number(p.value), format)}</span>
        </p>
      ))}
    </div>
  );
}

const TICK = { fill: "var(--g-teks)", fontSize: 12 };

/** Grafik area dua atau lebih seri (tren bulanan). */
export function GrafikTren({ data, seri, format = "rupiah", tinggi = 300 }: { data: Record<string, string | number>[]; seri: { kunci: string; nama: string; warna: NamaWarna }[]; format?: FormatNilai; tinggi?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {seri.map((s) => <span className="inline-flex items-center gap-2" key={s.kunci}><span className="h-2.5 w-2.5 rounded-full" style={{ background: WARNA_GRAFIK[s.warna] }} />{s.nama}</span>)}
      </div>
      <div style={{ height: tinggi }} className="w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {seri.map((s) => (
                <linearGradient id={`${id}-${s.kunci}`} key={s.kunci} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={WARNA_GRAFIK[s.warna]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={WARNA_GRAFIK[s.warna]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--g-garis)" strokeDasharray="3 5" vertical={false} />
            <XAxis axisLine={false} dataKey={Object.keys(data[0] ?? { x: 0 })[0]} tick={TICK} tickLine={false} />
            <YAxis axisLine={false} domain={format === "angka" ? ["dataMin - 2", "dataMax + 2"] : [0, "auto"]} tick={TICK} tickFormatter={sumbu(format)} tickLine={false} width={56} />
            <Tooltip content={<TipKartu format={format} />} cursor={{ stroke: "var(--g-garis)", strokeWidth: 1 }} />
            {seri.map((s) => (
              <Area dataKey={s.kunci} fill={`url(#${id}-${s.kunci})`} key={s.kunci} name={s.nama} stroke={WARNA_GRAFIK[s.warna]} strokeWidth={2.5} type="monotone" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donat dengan ringkasan di tengah dan legenda berisi nilai serta persentase. */
export function GrafikDonat({ data, format = "angka", tengahJudul, tengahNilai }: { data: { nama: string; nilai: number; warna?: NamaWarna }[]; format?: FormatNilai; tengahJudul?: string; tengahNilai?: string }) {
  const total = data.reduce((a, b) => a + b.nilai, 0);
  const isi = data.map((d, i) => ({ ...d, warna: WARNA_GRAFIK[d.warna ?? URUTAN[i % URUTAN.length]] }));
  if (total === 0) return <p className="py-12 text-center text-sm text-slate-500">Belum ada data.</p>;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-48 w-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie cornerRadius={6} data={isi} dataKey="nilai" innerRadius={62} nameKey="nama" outerRadius={88} paddingAngle={3} stroke="none">
              {isi.map((d, i) => <Cell fill={d.warna} key={i} />)}
            </Pie>
            <Tooltip content={<TipKartu format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        {(tengahJudul || tengahNilai) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {tengahNilai && <span className="text-lg font-bold tracking-tight text-slate-900">{tengahNilai}</span>}
            {tengahJudul && <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{tengahJudul}</span>}
          </div>
        )}
      </div>
      <ul className="w-full space-y-2">
        {isi.map((d) => (
          <li className="flex items-center gap-2.5 text-sm" key={d.nama}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.warna }} />
            <span className="text-slate-600">{d.nama}</span>
            <span className="ml-auto font-semibold text-slate-900">{format === "rupiah" ? ringkas(d.nilai) : tampil(d.nilai, format)}</span>
            <span className="w-11 text-right text-xs text-slate-400">{Math.round((d.nilai / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Batang vertikal atau horizontal; tiap batang dapat diberi warna sendiri. */
export function GrafikBatang({ data, format = "angka", horizontal = false, tinggi = 260, warna = "biru" }: { data: { nama: string; nilai: number; warna?: NamaWarna }[]; format?: FormatNilai; horizontal?: boolean; tinggi?: number; warna?: NamaWarna }) {
  if (data.length === 0 || data.every((d) => d.nilai === 0)) return <p className="py-12 text-center text-sm text-slate-500">Belum ada data.</p>;
  return (
    <div className="w-full" style={{ height: tinggi }}>
      <ResponsiveContainer>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, left: horizontal ? 8 : -8, bottom: 0 }}>
          <CartesianGrid horizontal={!horizontal} stroke="var(--g-garis)" strokeDasharray="3 5" vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis axisLine={false} tick={TICK} tickFormatter={sumbu(format)} tickLine={false} type="number" />
              <YAxis axisLine={false} dataKey="nama" tick={TICK} tickLine={false} type="category" width={96} />
            </>
          ) : (
            <>
              <XAxis axisLine={false} dataKey="nama" tick={TICK} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tick={TICK} tickFormatter={sumbu(format)} tickLine={false} width={format === "rupiah" ? 64 : 52} />
            </>
          )}
          <Tooltip content={<TipKartu format={format} />} cursor={{ fill: "var(--g-garis)", opacity: 0.35 }} />
          <Bar dataKey="nilai" name="Nilai" radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]} maxBarSize={36}>
            {data.map((d, i) => <Cell fill={WARNA_GRAFIK[d.warna ?? warna]} key={i} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Meteran setengah lingkaran untuk rasio persen. */
export function Meteran({ persen, warna = "hijau", judul, keterangan }: { persen: number; warna?: NamaWarna; judul: string; keterangan?: string }) {
  const nilai = Math.max(0, Math.min(100, persen));
  return (
    <div className="relative mx-auto h-40 w-56">
      <ResponsiveContainer>
        <RadialBarChart barSize={16} cx="50%" cy="85%" data={[{ nilai, isi: WARNA_GRAFIK[warna] }]} endAngle={0} innerRadius="150%" outerRadius="190%" startAngle={180}>
          <PolarAngleAxis angleAxisId={0} domain={[0, 100]} tick={false} type="number" />
          <RadialBar background={{ fill: "var(--g-garis)" }} cornerRadius={10} dataKey="nilai">
            <Cell fill={WARNA_GRAFIK[warna]} />
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900">{tampil(persen, "persen")}</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{judul}</p>
        {keterangan && <p className="mt-0.5 text-xs text-slate-400">{keterangan}</p>}
      </div>
    </div>
  );
}

/** Sparkline kecil untuk kartu statistik. */
export function Sparkline({ data, warna = "biru" }: { data: number[]; warna?: NamaWarna }) {
  const id = useId().replace(/:/g, "");
  const baris = data.map((nilai, i) => ({ i, nilai }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer>
        <AreaChart data={baris} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={WARNA_GRAFIK[warna]} stopOpacity={0.4} />
              <stop offset="100%" stopColor={WARNA_GRAFIK[warna]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Area dataKey="nilai" fill={`url(#${id})`} isAnimationActive={false} stroke={WARNA_GRAFIK[warna]} strokeWidth={2} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
