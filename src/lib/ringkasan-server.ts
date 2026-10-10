import { hitungPinjaman } from "@/lib/bunga";
import { getBatas, getPengaturanTagihan } from "@/lib/pengaturan";
import { tampilanRingkasan, type TampilanRingkasan } from "@/lib/ringkasan";
import { parseUang } from "@/lib/uang";

/** Aturan pinjaman yang berlaku saat ini (dari Pengaturan), dipakai pengajuan, akad, dan simulasi. */
export async function getAturanPinjaman() {
  const [batas, tagihan] = await Promise.all([getBatas(), getPengaturanTagihan()]);
  return { batas, bungaTahun: batas.bungaPinjamanPerTahun, metode: batas.metodeBunga, biayaAdminPersen: batas.biayaAdminPersen, dendaPersenPerHari: tagihan.dendaPersenPerHari, masaTenggang: tagihan.masaTenggang, batasDendaPersen: batas.batasDendaPersen };
}

export type HasilRingkasan = { ok: true; data: TampilanRingkasan } | { ok: false; pesan: string };

/** Ringkasan Biaya Pinjaman untuk jumlah dan tenor tertentu; dipakai pratinjau pengajuan dan simulasi publik. */
export async function ringkasanBiaya(jumlahTeks: string, tenorTeks: string): Promise<HasilRingkasan> {
  const a = await getAturanPinjaman();
  const jumlah = parseUang(jumlahTeks); const tenor = Number(tenorTeks);
  if (!jumlah || !Number.isInteger(tenor)) return { ok: false, pesan: "Isi jumlah dan tenor dengan benar." };
  if (tenor < 3 || tenor > 24) return { ok: false, pesan: "Tenor harus antara 3 dan 24 bulan." };
  if (jumlah.lt(a.batas.minPinjaman) || jumlah.gt(a.batas.maksPinjaman)) return { ok: false, pesan: "Jumlah pinjaman di luar batas yang berlaku." };
  const r = hitungPinjaman({ pokok: jumlah, bungaTahun: a.bungaTahun, tenorBulan: tenor, metode: a.metode, biayaAdminPersen: a.biayaAdminPersen });
  return { ok: true, data: tampilanRingkasan(r, a) };
}
