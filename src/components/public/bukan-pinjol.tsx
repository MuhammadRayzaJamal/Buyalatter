import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";

const BANDING = [
  { aspek: "Siapa yang dilayani", kita: "Hanya anggota koperasi yang sudah terverifikasi", mereka: "Siapa saja yang mengunduh aplikasi" },
  { aspek: "Bunga", kita: "Bunga per tahun, maksimal 24% efektif per tahun sesuai Permenkop UKM 8/2023", mereka: "Bunga harian yang menumpuk" },
  { aspek: "Keuntungan", kita: "Kembali ke anggota lewat Sisa Hasil Usaha (SHU)", mereka: "Menjadi keuntungan perusahaan" },
  { aspek: "Penagihan", kita: "Penagihan beretika: hanya kepada anggota yang bersangkutan, Senin–Sabtu 08.00–20.00 WIB", mereka: "Penagihan ke kontak darurat, keluarga, dan tempat kerja" },
] as const;

/** Perbandingan koperasi simpan pinjam dengan pinjol + acuan regulasi. Dipakai di beranda dan /tentang. */
export function BukanPinjol({ id = "bukan-pinjol" }: { id?: string }) {
  return <section className="bg-white" id={id}><div className="mx-auto max-w-7xl px-5 py-12 sm:py-20 lg:px-8">
    <div className="max-w-2xl"><p className="text-sm font-semibold text-secondary">Koperasi, bukan aplikasi pinjaman</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">BuyaLater </h2><p className="mt-4 leading-7 text-slate-500">BuyaLater adalah koperasi simpan pinjam digital yang hanya melayani anggotanya. Kami dimiliki dan dijalankan bersama anggota, dengan musyawarah dan semangat kekeluargaan.</p></div>
    <div className="mt-10 overflow-hidden rounded-2xl border">
      <div className="hidden grid-cols-[0.8fr_1.4fr_1.4fr] bg-slate-50 text-sm font-bold md:grid"><div className="px-5 py-4 text-slate-500">&nbsp;</div><div className="px-5 py-4 text-emerald-700">BuyaLater (koperasi)</div><div className="px-5 py-4 text-red-700">Pinjol</div></div>
      <ul className="divide-y">{BANDING.map((baris) => <li className="grid gap-3 px-5 py-5 md:grid-cols-[0.8fr_1.4fr_1.4fr] md:gap-0 md:px-0 md:py-0" key={baris.aspek}>
        <p className="font-bold text-slate-900 md:px-5 md:py-5">{baris.aspek}</p>
        <p className="flex gap-3 text-sm leading-6 text-slate-700 md:bg-emerald-50/60 md:px-5 md:py-5"><Check aria-label="BuyaLater" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{baris.kita}</p>
        <p className="flex gap-3 text-sm leading-6 text-slate-500 md:px-5 md:py-5"><X aria-label="Pinjol" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />{baris.mereka}</p>
      </li>)}</ul>
    </div>
    <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
      <Image alt="Logo Otoritas Jasa Keuangan (OJK)" className="h-20 w-auto shrink-0 rounded-lg bg-white" height={80} src="/images/logo-ojk.jpg" width={120} />
      <p className="text-sm leading-6 text-slate-600"><strong className="text-slate-900">Mengacu pada regulasi.</strong> Suku bunga BuyaLater mengacu pada Permenkop UKM 8/2023, dan penagihan mengikuti prinsip pelindungan konsumen POJK 22/2023 dari Otoritas Jasa Keuangan. Pelajari <Link className="font-bold text-secondary hover:underline" href="/hak-anggota">hak dan kewajiban anggota</Link>.</p>
    </div>
  </div></section>;
}
