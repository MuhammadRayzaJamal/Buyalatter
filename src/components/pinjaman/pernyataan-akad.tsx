"use client";

import { useState } from "react";
import { TombolKirim } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";

/** Bagian bawah form akad: tombol setuju baru aktif setelah kedua pernyataan dicentang. Dipasang di dalam AksiForm. */
export function PernyataanAkad() {
  const [paham, setPaham] = useState(false);
  const [setuju, setSetuju] = useState(false);
  return <>
    <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-800"><input checked={paham} className="mt-1.5 h-4 w-4" name="pahamBiaya" onChange={(e) => setPaham(e.target.checked)} required type="checkbox" />Saya sudah membaca dan memahami seluruh biaya di atas</label>
    <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input checked={setuju} className="mt-1.5 h-4 w-4" name="setuju" onChange={(e) => setSetuju(e.target.checked)} required type="checkbox" />Saya telah membaca dan memahami seluruh isi akad (nominal, bunga, tenor, jadwal angsuran, dan ketentuan denda), dan menyetujuinya.</label>
    <Input autoComplete="current-password" id="password" label="Masukkan password Anda untuk menandatangani" name="password" required type="password" />
    <TombolKirim disabled={!paham || !setuju} teksProses="Menyimpan persetujuan...">Setujui akad</TombolKirim>
  </>;
}
