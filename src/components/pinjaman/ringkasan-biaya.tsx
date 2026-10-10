import type { TampilanRingkasan } from "@/lib/ringkasan";

const HAK_ANGGOTA = [
  "Mendapat informasi biaya yang jelas sebelum menyetujui akad.",
  "Ditagih secara beretika: hanya kepada Anda, Senin–Sabtu pukul 08.00–20.00 WIB di luar hari libur, maksimal satu pengingat per hari.",
  "Melunasi lebih awal; bunga bulan-bulan berikutnya tidak ditagih.",
  "Mengajukan restrukturisasi bila mengalami kesulitan membayar.",
  "Menyampaikan pengaduan dan mendapat tanggapan paling lambat 10 hari kerja.",
  "Ikut rapat anggota dan menerima SHU.",
];

function Baris({ label, nilai, tebal = false }: { label: string; nilai: string; tebal?: boolean }) {
  return <div className={`flex items-start justify-between gap-4 py-2 text-sm sm:py-2.5 sm:gap-6 ${tebal ? "font-bold text-slate-900" : "text-slate-600"}`}><dt>{label}</dt><dd className={`text-right ${tebal ? "" : "font-semibold text-slate-800"}`}>{nilai}</dd></div>;
}

/** Ringkasan Biaya Pinjaman dalam satu kotak. Dipakai sebelum akad, pada halaman ajukan pinjaman, dan simulasi publik. */
export function RingkasanBiayaPinjaman({ data, sembunyikanHak = false, judul = "Ringkasan Biaya Pinjaman" }: { data: TampilanRingkasan; sembunyikanHak?: boolean; judul?: string }) {
  return <section aria-label={judul} className="rounded-2xl border-2 border-primary/20 bg-white p-5 sm:p-6">
    <h2 className="text-lg font-bold text-slate-900">{judul}</h2>
    <dl className="mt-3 divide-y divide-slate-100">
      <Baris label="Pokok pinjaman" nilai={data.pokok} />
      <Baris label="Tenor" nilai={`${data.tenorBulan} bulan`} />
      <Baris label="Bunga per tahun" nilai={`${data.bungaTahun} · ${data.metode}`} />
      <Baris label="Bunga efektif per tahun (termasuk biaya admin)" nilai={data.bungaEfektif} />
      <Baris label="Total bunga" nilai={data.totalBunga} />
      <Baris label="Biaya administrasi (dipotong saat pencairan)" nilai={data.biayaAdmin} />
      <Baris label="Dana yang Anda terima" nilai={data.danaDiterima} />
      <Baris label="Total yang harus dibayar" nilai={data.totalBayar} tebal />
      <Baris label="Total biaya (bunga + admin)" nilai={data.totalBiaya} />
      <Baris label="Cicilan" nilai={data.cicilan} tebal />
    </dl>
    <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Ketentuan denda.</strong> {data.denda}</div>
    {!sembunyikanHak && <div className="mt-4"><h3 className="text-sm font-bold text-slate-900">Hak Anda sebagai anggota</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{HAK_ANGGOTA.map((hak) => <li key={hak}>{hak}</li>)}</ul></div>}
  </section>;
}
