import { Quote } from "lucide-react";
import type { Mitra, Penghargaan } from "@prisma/client";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { PreviewImage } from "@/components/ui/preview-image";

export const NAVY_GELAP = "#0F1B4C";
const GRID = "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)";
const GLOW = "radial-gradient(closest-side, rgba(30,95,199,.45), rgba(30,95,199,0))";

/** Latar navy gelap dengan grid tipis dan cahaya radial biru di pojok kanan atas. */
export function LatarGelap({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section className={`relative isolate overflow-hidden text-white ${className}`} id={id} style={{ background: NAVY_GELAP }}>
      <div aria-hidden className="absolute inset-0 -z-10" style={{ backgroundImage: GRID, backgroundSize: "48px 48px" }} />
      <div aria-hidden className="absolute -right-40 -top-48 -z-10 h-[40rem] w-[40rem]" style={{ background: GLOW }} />
      {children}
    </section>
  );
}

const labelTingkat = (m: Mitra) => (m.tingkat === "STRATEGIS" ? "Mitra Strategis" : "Mitra Pendukung");

/** Logo berwarna aslinya ditempatkan di ubin putih agar tetap terbaca di latar gelap. */
function UbinLogo({ m, tinggi = "h-14", className = "" }: { m: Mitra; tinggi?: string; className?: string }) {
  return <div className={`flex items-center justify-center rounded-2xl bg-white p-5 shadow-lg ${className}`}><PreviewImage alt={m.nama} className={`${tinggi} w-auto max-w-full object-contain`} src={m.logoUrl} /></div>;
}

export function SorotanMitra({ m }: { m: Mitra }) {
  return (
    <div className="scroll-mt-28 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm target:ring-4 target:ring-white/20 sm:p-8 lg:p-10" id={`mitra-${m.id}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-12">
        <UbinLogo className="min-h-36" m={m} tinggi="h-16" />
        <figure>
          <Quote aria-hidden className="h-9 w-9 text-accent" />
          {m.kutipan && <blockquote className="mt-3 text-xl font-medium italic leading-9 text-white sm:text-2xl sm:leading-10">&ldquo;{m.kutipan}&rdquo;</blockquote>}
          <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm">{m.namaPerwakilan && <strong className="text-white">{m.namaPerwakilan}</strong>}{m.jabatanPerwakilan && <span className="text-blue-200/80">{m.namaPerwakilan ? ", " : ""}{m.jabatanPerwakilan}</span>}<span className="text-blue-200/60"> · {m.nama}</span></span>
            <span className="rounded-full border border-white/20 px-3 py-0.5 text-[11px] font-semibold text-accent">{labelTingkat(m)}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

export function KartuMitraGelap({ m, ringkas = false }: { m: Mitra; ringkas?: boolean }) {
  return (
    <div className="scroll-mt-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10 target:ring-4 target:ring-white/20" id={`mitra-${m.id}`} style={{ borderTop: `3px solid ${m.warnaBrand ?? "#4FB8EC"}` }}>
      <div className={ringkas ? "p-5" : "p-7"}>
        <UbinLogo className={ringkas ? "h-20 p-3" : "h-28"} m={m} tinggi={ringkas ? "h-10" : "h-14"} />
        <div className="mt-5 flex flex-wrap items-center gap-2"><h3 className={`font-bold text-white ${ringkas ? "text-base" : "text-xl"}`}>{m.nama}</h3>{m.kategori && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-accent">{m.kategori}</span>}</div>
        {m.deskripsi && <p className={`mt-2 leading-6 text-blue-100/70 ${ringkas ? "text-xs" : "text-sm"}`}>{m.deskripsi}</p>}
        {m.kutipan && <blockquote className={`mt-4 border-l-2 border-white/20 pl-3 italic leading-7 text-blue-50/90 ${ringkas ? "text-xs" : "text-base"}`}>&ldquo;{m.kutipan}&rdquo;</blockquote>}
        {m.namaPerwakilan && <p className="mt-3 text-xs"><strong className="text-white">{m.namaPerwakilan}</strong>{m.jabatanPerwakilan && <span className="text-blue-200/70"> · {m.jabatanPerwakilan}</span>}</p>}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-blue-200/60">{m.tahunBermitra ? <span>Bermitra sejak <strong className="text-white">{m.tahunBermitra}</strong></span> : <span />}{m.website && <a className="font-bold text-accent hover:underline" href={m.website} rel="noopener noreferrer" target="_blank">Kunjungi situs →</a>}</div>
      </div>
    </div>
  );
}

/** Deretan penghargaan: ikon emas, judul, pemberi, tahun. Menggulir horizontal di HP. */
export function PenghargaanBaris({ items }: { items: Penghargaan[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {items.map((p) => (
        <li className="flex w-72 shrink-0 snap-start items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:w-auto" key={p.id}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(245,196,81,.15)", color: "#F5C451" }}><DynamicIcon className="h-5 w-5" name={p.ikon} /></span>
          <span className="min-w-0"><strong className="block text-sm font-semibold leading-5 text-white">{p.judul}</strong><span className="mt-0.5 block text-xs text-blue-200/70">{p.pemberi} · {p.tahun}</span></span>
        </li>
      ))}
    </ul>
  );
}
