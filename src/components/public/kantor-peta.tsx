"use client";

import { useState } from "react";
import { Clock, ExternalLink, MapPin, Phone } from "lucide-react";

export type KantorItem = { id: string; nama: string; alamat: string; kota: string; telepon: string | null; jamOperasional: string | null; latitude: number; longitude: number; isPusat: boolean };

/** bbox kecil di sekitar titik; marker ditampilkan oleh embed OpenStreetMap. */
const embedUrl = (k: KantorItem) => {
  const d = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${k.longitude - d},${k.latitude - d * 0.7},${k.longitude + d},${k.latitude + d * 0.7}&layer=mapnik&marker=${k.latitude},${k.longitude}`;
};
const besarUrl = (k: KantorItem) => `https://www.openstreetmap.org/?mlat=${k.latitude}&mlon=${k.longitude}#map=17/${k.latitude}/${k.longitude}`;

export function KantorPeta({ kantor }: { kantor: KantorItem[] }) {
  const [aktifId, setAktifId] = useState(kantor[0]?.id);
  const aktif = kantor.find((k) => k.id === aktifId) ?? kantor[0];
  if (!aktif) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <ul className="space-y-4">{kantor.map((k) => {
        const dipilih = k.id === aktif.id;
        return <li key={k.id}><button aria-pressed={dipilih} className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${dipilih ? "border-secondary! ring-4 ring-blue-100" : ""}`} onClick={() => setAktifId(k.id)} type="button">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{k.nama}</h2>{k.isPusat && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-secondary">Kantor Pusat</span>}</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{k.alamat}, {k.kota}</span></li>
            {k.telepon && <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{k.telepon}</li>}
            {k.jamOperasional && <li className="flex gap-2"><Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{k.jamOperasional}</li>}
          </ul>
        </button></li>;
      })}</ul>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <iframe className="h-80 w-full sm:h-[26rem]" key={aktif.id} loading="lazy" referrerPolicy="no-referrer" src={embedUrl(aktif)} title={`Peta lokasi ${aktif.nama}`} />
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm"><span className="font-semibold text-slate-700">{aktif.nama}</span><a className="inline-flex items-center gap-1 font-bold text-secondary hover:underline" href={besarUrl(aktif)} rel="noopener noreferrer" target="_blank">Buka peta lebih besar <ExternalLink aria-hidden className="h-3.5 w-3.5" /></a></div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Peta © kontributor OpenStreetMap. Alamat dan koordinat bersifat contoh.</p>
      </div>
    </div>
  );
}
