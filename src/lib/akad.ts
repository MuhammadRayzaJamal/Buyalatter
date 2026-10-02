import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { samarkanNik } from "@/lib/nik";
import { jadwalAngsuran, dec, type MasukanUang } from "@/lib/uang";

type DataAkad = {
  pinjamanId: string;
  anggota: { nama: string; noAnggota: string; nik: string; alamat: string };
  jumlah: MasukanUang; bungaPersen: MasukanUang; tenorBulan: number; totalBayar: MasukanUang; tanggalPersetujuan: Date;
  dendaPersenPerHari: MasukanUang; batasDendaPersen: MasukanUang;
};

/** Teks akad (bahasa Indonesia). Disimpan utuh di AkadPinjaman.isiAkad saat disetujui sehingga tidak berubah meski pengaturan berubah. */
export function susunIsiAkad(d: DataAkad) {
  const jadwal = jadwalAngsuran(d.totalBayar, d.tenorBulan);
  const bungaTotal = dec(d.totalBayar).minus(dec(d.jumlah));
  const baris = [
    "AKAD PEMBIAYAAN BUYALATER",
    `Nomor akad: ${d.pinjamanId}`,
    `Tanggal persetujuan pinjaman: ${formatTanggal(d.tanggalPersetujuan)}`,
    "",
    "PIHAK",
    "Pihak Pertama: Koperasi BuyaLater (selanjutnya disebut Koperasi).",
    `Pihak Kedua: ${d.anggota.nama}, anggota nomor ${d.anggota.noAnggota}, NIK ${samarkanNik(d.anggota.nik)}, beralamat di ${d.anggota.alamat} (selanjutnya disebut Anggota).`,
    "",
    "RINCIAN PINJAMAN",
    `Pokok pinjaman      : ${formatRupiah(d.jumlah)}`,
    `Bunga               : ${dec(d.bungaPersen).toString()}% per bulan (flat) = ${formatRupiah(bungaTotal)} selama masa pinjaman`,
    `Tenor               : ${d.tenorBulan} bulan`,
    `Total kewajiban     : ${formatRupiah(d.totalBayar)}`,
    "",
    "JADWAL ANGSURAN (jatuh tempo tiap bulan sejak tanggal pencairan)",
    ...jadwal.map((j, i) => `Angsuran ke-${String(i + 1).padStart(2, "0")}   ${formatRupiah(j)}`),
    "",
    "KETENTUAN DENDA",
    `1. Keterlambatan dikenakan denda ${dec(d.dendaPersenPerHari).toString()}% per hari dari sisa tagihan angsuran.`,
    `2. Total denda selama masa pinjaman dibatasi maksimal ${dec(d.batasDendaPersen).toString()}% dari pokok pinjaman; setelah batas tercapai denda tidak bertambah.`,
    "3. Pelunasan dipercepat hanya menagih sisa pokok ditambah bunga bulan berjalan; bunga bulan berikutnya tidak ditagih.",
    "4. Setiap angsuran memiliki kode unik 3 digit yang ditambahkan ke nominal transfer untuk membantu pencocokan pembayaran.",
    "",
    "PERNYATAAN",
    "Dengan menyetujui akad ini, Anggota menyatakan telah membaca dan memahami seluruh isi akad, bahwa data yang diberikan benar, serta sanggup melunasi kewajiban sesuai jadwal.",
  ];
  return baris.join("\n");
}

// Font bawaan PDF memakai WinAnsi: ganti karakter di luar rentangnya agar tidak gagal saat mencetak.
const amanWinAnsi = (teks: string) => teks.replace(/[^\x09\x20-\x7e\xa0-\xff]/g, "?");

/** Membuat PDF akad dari teks akad, dengan pembungkusan baris otomatis dan paginasi. */
export async function buatPdfAkad(isiAkad: string, meta: { disetujuiPada?: Date | null; ipAddress?: string | null }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  const tebal = await pdf.embedFont(StandardFonts.CourierBold);
  const ukuran = 10; const lebar = 595; const tinggi = 842; const margin = 50; const tinggiBaris = 14;
  const maksKarakter = Math.floor((lebar - margin * 2) / (ukuran * 0.6));
  let halaman = pdf.addPage([lebar, tinggi]); let y = tinggi - margin;
  const tulis = (teks: string, huruf = font) => {
    for (const potong of pembungkus(amanWinAnsi(teks), maksKarakter)) {
      if (y < margin + tinggiBaris) { halaman = pdf.addPage([lebar, tinggi]); y = tinggi - margin; }
      halaman.drawText(potong, { x: margin, y, size: ukuran, font: huruf, color: rgb(0.1, 0.12, 0.2) });
      y -= tinggiBaris;
    }
  };
  isiAkad.split("\n").forEach((baris, i) => tulis(baris, i === 0 || /^[A-Z ()]{4,}$/.test(baris.replace(/\(.*\)/, "").trim()) ? tebal : font));
  y -= tinggiBaris;
  if (meta.disetujuiPada) tulis(`Disetujui secara digital pada ${formatTanggal(meta.disetujuiPada)}${meta.ipAddress ? ` dari IP ${meta.ipAddress}` : ""}.`, tebal);
  else tulis("Dokumen pratinjau: belum disetujui anggota.", tebal);
  return pdf.save();
}

function pembungkus(teks: string, maks: number): string[] {
  if (teks.length <= maks) return [teks];
  const hasil: string[] = []; let sisa = teks;
  while (sisa.length > maks) {
    let potong = sisa.lastIndexOf(" ", maks); if (potong <= 0) potong = maks;
    hasil.push(sisa.slice(0, potong)); sisa = sisa.slice(potong).trimStart();
  }
  hasil.push(sisa);
  return hasil;
}
