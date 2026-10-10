import { z } from "zod";
import { Decimal } from "@/lib/uang";
import type { BatasNominal } from "@/lib/pengaturan";
import { formatRupiah } from "@/lib/format";
import { BATAS_BIAYA_ADMIN_PERSEN, BATAS_BUNGA_PINJAMAN_TAHUN, BATAS_BUNGA_SIMPANAN_TAHUN, BATAS_DENDA_PERSEN_POKOK, bungaEfektifTertinggi, PESAN_MELEBIHI_BATAS } from "@/lib/bunga";
import { cariKataTerlarang } from "@/lib/penagihan-aturan";

// ---------- Primitif ----------
export const teks = (label: string, maks = 191, min = 1) =>
  z.string({ error: `${label} wajib diisi.` }).trim().min(min, `${label} wajib diisi.`).max(maks, `${label} maksimal ${maks} karakter.`);

export const teksOpsional = (label: string, maks = 191) =>
  z.string().trim().max(maks, `${label} maksimal ${maks} karakter.`).optional().transform((v) => v || null);

export const emailSchema = z.string({ error: "Email wajib diisi." }).trim().toLowerCase().max(191, "Email terlalu panjang.").pipe(z.email("Format email tidak valid."));

/** Minimal 8 karakter, mengandung huruf dan angka. */
export const passwordSchema = z
  .string({ error: "Password wajib diisi." })
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Password harus mengandung huruf.")
  .regex(/\d/, "Password harus mengandung angka.");

export const nikSchema = z.string({ error: "NIK wajib diisi." }).trim().regex(/^\d{16}$/, "NIK harus 16 digit angka.");
export const noHpSchema = z
  .string({ error: "Nomor HP wajib diisi." })
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor HP tidak valid (contoh 081234567890)."));

export const idSchema = (label: string) => teks(label, 191);

/** Nominal uang dari form: string angka positif, maksimal 2 desimal, dikonversi ke Decimal tanpa melalui Number. */
export const uangSchema = (label: string) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, `${label} harus berupa angka (tanpa titik ribuan, maksimal 2 desimal).`)
    .transform((v) => new Decimal(v))
    .refine((d) => d.gt(0), `${label} harus lebih dari nol.`);

/** Nominal positif yang harus berada dalam [min, maks] sesuai Pengaturan. */
export const nominalBatas = (label: string, min: Decimal, maks: Decimal) =>
  uangSchema(label)
    .refine((d) => d.gte(min), `${label} minimal ${formatRupiah(min)}.`)
    .refine((d) => d.lte(maks), `${label} maksimal ${formatRupiah(maks)}.`);

const bilanganBulat = (label: string, min: number, maks: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .regex(/^\d{1,6}$/, `${label} harus berupa bilangan bulat.`)
    .transform(Number)
    .refine((n) => n >= min && n <= maks, `${label} harus antara ${min} dan ${maks}.`);

const persen = (label: string) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, `${label} harus berupa angka (maksimal 2 desimal).`)
    .transform((v) => new Decimal(v))
    .refine((d) => d.gte(0) && d.lte(100), `${label} harus antara 0 dan 100.`);

const uangNolBoleh = (label: string) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, `${label} harus berupa angka (maksimal 2 desimal).`)
    .transform((v) => new Decimal(v));

// ---------- Auth ----------
export const loginSchema = z.object({ email: emailSchema, password: z.string({ error: "Password wajib diisi." }).min(1, "Password wajib diisi.") });
export const lupaPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z
  .object({ token: teks("Token", 200), password: passwordSchema, konfirmasi: z.string() })
  .refine((v) => v.password === v.konfirmasi, { message: "Konfirmasi password tidak sama.", path: ["konfirmasi"] });

// ---------- Anggota ----------
export const registerSchema = z.object({
  nama: teks("Nama", 100, 3),
  email: emailSchema,
  noHp: noHpSchema,
  nik: nikSchema,
  alamat: teks("Alamat", 191, 5),
  password: passwordSchema,
  tanggalMasuk: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal bergabung tidak valid.").refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal bergabung tidak valid."),
});
const persetujuan = (pesan: string) => z.string({ error: pesan }).refine((v) => v === "on", pesan);
/** Pendaftaran publik: tiga persetujuan penggunaan data pribadi (UU PDP) wajib dicentang terpisah. */
export const registerPublikSchema = registerSchema.extend({
  persetujuanIdentitas: persetujuan("Setujui penggunaan data untuk verifikasi identitas."),
  persetujuanKelayakan: persetujuan("Setujui penggunaan data untuk penilaian kelayakan pinjaman."),
  persetujuanPengingat: persetujuan("Setujui penggunaan data untuk pengiriman pengingat."),
});
export const anggotaBaruSchema = registerSchema;
export const anggotaUbahSchema = z.object({
  nama: teks("Nama", 100, 3),
  email: emailSchema,
  noHp: noHpSchema,
  nik: nikSchema,
  alamat: teks("Alamat", 191, 5),
  status: z.enum(["AKTIF", "NONAKTIF"], { error: "Status tidak valid." }),
});
export const profilSchema = z.object({ nama: teks("Nama", 100, 3), email: emailSchema, noHp: noHpSchema, alamat: teks("Alamat", 191, 5) });
export const verifikasiAnggotaSchema = z.object({ catatan: teksOpsional("Catatan", 191) });

export const penggunaBaruSchema = z.object({
  nama: teks("Nama", 100, 3),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "MANAJER", "TELLER"], { error: "Peran tidak valid." }),
});
export const ubahPeranSchema = z.object({ role: z.enum(["ADMIN", "MANAJER", "TELLER"], { error: "Peran tidak valid." }) });

// ---------- Uang ----------
export const buatSimpananSchema = (b: BatasNominal) =>
  z.object({
    anggotaId: idSchema("Anggota"),
    jenis: z.enum(["POKOK", "WAJIB", "SUKARELA"], { error: "Jenis simpanan tidak valid." }),
    jumlah: nominalBatas("Jumlah simpanan", b.minTransaksi, b.maksTransaksi),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.").refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid."),
    keterangan: teksOpsional("Keterangan", 191),
  });

export const buatPenarikanSchema = (b: BatasNominal) => z.object({ jumlah: nominalBatas("Jumlah penarikan", b.minTransaksi, b.maksTransaksi) });

export const buatPinjamanSchema = (b: BatasNominal) =>
  z.object({
    jumlah: nominalBatas("Jumlah pinjaman", b.minPinjaman, b.maksPinjaman),
    tenorBulan: bilanganBulat("Tenor", 3, 24),
    alasan: teks("Tujuan pinjaman", 191, 5),
  });

export const pencairanSchema = z.object({
  rekeningAnggotaId: idSchema("Rekening tujuan"),
  jumlahDicairkan: uangSchema("Jumlah dicairkan"),
  biayaAdmin: uangNolBoleh("Biaya admin"),
  catatan: teksOpsional("Catatan", 191),
});

export const tolakSchema = z.object({ alasan: teks("Alasan penolakan", 191, 3) });
export const dendaSchema = z.object({ denda: uangNolBoleh("Denda") });
export const bayarTunaiSchema = z.object({ tanggalBayar: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal bayar tidak valid.").refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal bayar tidak valid.") });
export const ajukanPembayaranSchema = z.object({ rekeningKoperasiId: idSchema("Rekening tujuan"), jumlahTransfer: uangSchema("Jumlah transfer") });
export const diterimaSchema = z.object({ jumlahDiterima: uangSchema("Jumlah diterima") });

export const rekeningSchema = z.object({
  password: z.string({ error: "Masukkan password Anda untuk konfirmasi." }).min(1, "Masukkan password Anda untuk konfirmasi."),
  namaBank: teks("Nama bank", 60),
  noRekening: z.string({ error: "Nomor rekening wajib diisi." }).trim().regex(/^\d{5,20}$/, "Nomor rekening harus 5–20 digit angka."),
  atasNama: teks("Atas nama", 100),
});

export const koreksiSchema = z.object({
  anggotaId: idSchema("Anggota"),
  arah: z.enum(["MASUK", "KELUAR"], { error: "Arah koreksi tidak valid." }),
  jumlah: uangSchema("Jumlah koreksi"),
  keterangan: teks("Keterangan koreksi", 191, 5),
});

// ---------- Pengaturan ----------
const metodeBunga = z.enum(["FLAT", "MENURUN", "ANUITAS"], { error: "Metode bunga tidak valid." });
export const pengaturanSchema = z
  .object({
    bungaPinjamanPerTahun: persen("Bunga pinjaman per tahun"),
    bungaSimpananPerTahun: persen("Bunga simpanan per tahun"),
    metodeBunga,
    biayaAdminPersen: persen("Biaya administrasi"),
    simpananPokok: uangNolBoleh("Simpanan pokok"),
    simpananWajib: uangNolBoleh("Simpanan wajib"),
    dendaPersenPerHari: persen("Denda per hari"),
    masaTenggangHari: bilanganBulat("Masa tenggang", 0, 30),
    templatePengingat: z.string().trim().max(1000, "Template maksimal 1000 karakter.").optional().transform((v) => v || null),
    hariPengingatSebelumJatuhTempo: bilanganBulat("Hari pengingat", 0, 60),
    batasHariTerlambatKritis: bilanganBulat("Batas hari kritis", 1, 3650),
    batasPencairanManajer: uangSchema("Batas pencairan wajib manajer"),
    minPinjaman: uangSchema("Pinjaman minimal"),
    maksPinjaman: uangSchema("Pinjaman maksimal"),
    minTransaksi: uangSchema("Transaksi minimal"),
    maksTransaksi: uangSchema("Transaksi maksimal"),
    minLamaAnggotaBulan: bilanganBulat("Lama keanggotaan minimal", 0, 600),
    plafonKaliSimpanan: z.string().trim().regex(/^\d{1,3}(\.\d{1,2})?$/, "Kelipatan plafon harus berupa angka.").transform((v) => new Decimal(v)).refine((d) => d.gt(0), "Kelipatan plafon harus lebih dari nol."),
    maksRasioAngsuranPersen: persen("Rasio angsuran maksimal"),
    maksHariTunggakan: bilanganBulat("Batas hari tunggakan", 0, 3650),
    periodeTunggakanBulan: bilanganBulat("Periode tunggakan", 1, 120),
    batasDendaPersen: persen("Batas denda"),
  })
  .refine((v) => v.minPinjaman.lte(v.maksPinjaman), { message: "Pinjaman minimal tidak boleh melebihi maksimal.", path: ["minPinjaman"] })
  .refine((v) => v.minTransaksi.lte(v.maksTransaksi), { message: "Transaksi minimal tidak boleh melebihi maksimal.", path: ["minTransaksi"] })
  // Batas regulasi (Permenkop UKM 8/2023): divalidasi di server dan tidak dapat dilampaui admin.
  .refine((v) => v.bungaSimpananPerTahun.lte(BATAS_BUNGA_SIMPANAN_TAHUN), { message: `${PESAN_MELEBIHI_BATAS}: bunga simpanan maksimal ${BATAS_BUNGA_SIMPANAN_TAHUN}% per tahun.`, path: ["bungaSimpananPerTahun"] })
  .refine((v) => v.bungaPinjamanPerTahun.lte(BATAS_BUNGA_PINJAMAN_TAHUN), { message: `${PESAN_MELEBIHI_BATAS}: bunga pinjaman maksimal ${BATAS_BUNGA_PINJAMAN_TAHUN}% per tahun.`, path: ["bungaPinjamanPerTahun"] })
  .refine((v) => v.biayaAdminPersen.lte(BATAS_BIAYA_ADMIN_PERSEN), { message: `${PESAN_MELEBIHI_BATAS}: biaya administrasi maksimal ${BATAS_BIAYA_ADMIN_PERSEN}% dari pokok.`, path: ["biayaAdminPersen"] })
  .refine((v) => v.batasDendaPersen.lte(BATAS_DENDA_PERSEN_POKOK), { message: `Total denda maksimal ${BATAS_DENDA_PERSEN_POKOK}% dari pokok pinjaman.`, path: ["batasDendaPersen"] })
  .refine((v) => { const kata = v.templatePengingat ? cariKataTerlarang(v.templatePengingat) : null; return !kata; }, { message: "Template pengingat memuat kata yang tidak diperbolehkan (ancaman, mempermalukan, dsb.). Gunakan bahasa yang sopan dan informatif.", path: ["templatePengingat"] })
  .superRefine((v, ctx) => {
    // Bunga efektif (termasuk biaya admin) pada tenor mana pun tidak boleh melewati 24% per tahun.
    if (v.bungaPinjamanPerTahun.gt(BATAS_BUNGA_PINJAMAN_TAHUN) || v.biayaAdminPersen.gt(BATAS_BIAYA_ADMIN_PERSEN)) return;
    const efektif = bungaEfektifTertinggi(v.bungaPinjamanPerTahun, v.metodeBunga, v.biayaAdminPersen);
    if (efektif.gt(BATAS_BUNGA_PINJAMAN_TAHUN)) ctx.addIssue({ code: "custom", path: ["bungaPinjamanPerTahun"], message: `${PESAN_MELEBIHI_BATAS}: bunga efektif pinjaman ${efektif.toString()}% per tahun melebihi ${BATAS_BUNGA_PINJAMAN_TAHUN}% (metode ${v.metodeBunga}, termasuk biaya admin). Turunkan bunga atau pilih metode menurun/anuitas.` });
  });

export const hariLiburSchema = z.object({
  tanggal: z.string({ error: "Tanggal wajib diisi." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.").refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid."),
  keterangan: teks("Keterangan", 120, 3),
});

// ---------- Pengaduan ----------
export const pengaduanSchema = z.object({
  kategori: z.enum(["PINJAMAN", "PENAGIHAN", "SIMPANAN", "LAYANAN", "DATA"], { error: "Pilih kategori pengaduan." }),
  isi: teks("Isi pengaduan", 2000, 10),
});
export const tanggapanSchema = z.object({
  status: z.enum(["DIPROSES", "SELESAI"], { error: "Status tidak valid." }),
  tanggapan: teks("Tanggapan", 2000, 5),
});

// ---------- Konten ----------
export const situsSchema = z.object({
  namaInstansi: z.string().trim().max(100).optional().transform((v) => v || "BuyaLater"),
  deskripsiFooter: teksOpsional("Deskripsi footer", 1000),
  emailCs: z.string().trim().max(191).optional().transform((v) => v || null).refine((v) => v === null || z.email().safeParse(v).success, "Email CS tidak valid."),
  teleponCs: teksOpsional("Telepon CS", 50),
  whatsappCs: teksOpsional("WhatsApp CS", 50),
  alamatPusat: teksOpsional("Alamat pusat", 191),
});

/** Mengubah FormData menjadi objek string sederhana untuk di-parse dengan skema di atas. */
export function dariForm(formData: FormData) {
  const hasil: Record<string, string> = {};
  for (const [kunci, nilai] of formData.entries()) if (typeof nilai === "string") hasil[kunci] = nilai;
  return hasil;
}

// ---------- Konten publik (CRUD admin) ----------
const centang = z.string().optional().transform((v) => v === "on");
const bulat = (label: string, min = -100000, maks = 100000, bawaan = 0) =>
  z.string().trim().optional().transform((v) => (v ? Number(v) : bawaan)).refine((n) => Number.isInteger(n) && n >= min && n <= maks, `${label} harus bilangan bulat ${min}–${maks}.`);
const tautan = (label: string) =>
  z.string().trim().max(500, `${label} terlalu panjang.`).optional().transform((v) => v || null)
    .refine((v) => v === null || (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v), `${label} harus diawali / (halaman internal) atau https://.`);
const tanggalOpsional = z.string().trim().optional().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Format tanggal tidak valid.");

export const galeriSchema = z.object({ judul: teks("Judul", 150), deskripsi: teksOpsional("Deskripsi", 500), kategori: teks("Kategori", 60) });
export const artikelSchema = z.object({
  judul: teks("Judul", 150),
  slug: z.string({ error: "Slug wajib diisi." }).trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.").max(150, "Slug maksimal 150 karakter."),
  isi: teks("Isi artikel", 20000, 10),
});
export const rekeningKoperasiSchema = z.object({ namaBank: teks("Nama bank", 60), noRekening: z.string({ error: "Nomor rekening wajib diisi." }).trim().regex(/^\d{5,20}$/, "Nomor rekening harus 5–20 digit angka."), atasNama: teks("Atas nama", 100), isAktif: centang });
export const bannerSchema = z.object({
  judul: teks("Judul", 120), subjudul: teksOpsional("Subjudul", 191), linkTujuan: tautan("Link tujuan"), teksTombol: teksOpsional("Teks tombol", 40),
  posisi: z.enum(["HERO", "FOOTER", "SIDEBAR"], { error: "Posisi banner tidak valid." }), urutan: bulat("Urutan"), isAktif: centang, tanggalMulai: tanggalOpsional, tanggalSelesai: tanggalOpsional,
});
export const testimoniSchema = z.object({ nama: teks("Nama", 100), pekerjaan: teksOpsional("Pekerjaan", 100), kota: teksOpsional("Kota", 100), isi: teks("Isi testimoni", 500, 5), rating: bulat("Rating", 1, 5, 5), isTampil: centang });
export const mitraSchema = z.object({
  nama: teks("Nama mitra", 100), website: tautan("Website"), kategori: teksOpsional("Kategori", 100), deskripsi: teksOpsional("Deskripsi", 500),
  tahunBermitra: z.string().trim().optional().transform((v) => (v ? Number(v) : null)).refine((n) => n === null || (Number.isInteger(n) && n >= 1900 && n <= 2100), "Tahun bermitra tidak valid."),
  urutan: bulat("Urutan"), tingkat: z.enum(["STRATEGIS", "PENDUKUNG"], { error: "Tingkat mitra tidak valid." }).default("PENDUKUNG"), isUnggulan: centang,
  kutipan: teksOpsional("Kutipan", 500), namaPerwakilan: teksOpsional("Nama perwakilan", 100), jabatanPerwakilan: teksOpsional("Jabatan perwakilan", 100),
  warnaBrand: z.string().trim().optional().transform((v) => v || null).refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Warna brand harus berformat hex, mis. #1A2A6C."),
});
export const pencapaianSchema = z.object({ tahun: bulat("Tahun", 1900, 2100, 0), judul: teks("Judul", 150), deskripsi: teks("Deskripsi", 500), ikon: z.string().trim().max(40).optional().transform((v) => v || "trending") });
export const penghargaanSchema = z.object({ judul: teks("Judul", 150), pemberi: teks("Pemberi", 150), tahun: bulat("Tahun", 1900, 2100, 0), deskripsi: teksOpsional("Deskripsi", 500), ikon: z.string().trim().max(40).optional().transform((v) => v || "award"), urutan: bulat("Urutan") });
const koordinat = (label: string, batas: number) => z.string({ error: `${label} wajib diisi.` }).trim().transform((v) => Number(v.replace(",", "."))).refine((n) => Number.isFinite(n) && Math.abs(n) <= batas, `${label} harus antara -${batas} dan ${batas}.`);
export const kantorSchema = z.object({ nama: teks("Nama kantor", 100), alamat: teks("Alamat", 191), kota: teks("Kota", 100), telepon: teksOpsional("Telepon", 50), jamOperasional: teksOpsional("Jam operasional", 100), latitude: koordinat("Latitude", 90), longitude: koordinat("Longitude", 180), isPusat: centang });
export const menuFooterSchema = z.object({ kolom: z.enum(["LAYANAN", "PERUSAHAAN", "BANTUAN"], { error: "Kolom footer tidak valid." }), label: teks("Label", 60), href: teks("Link", 500).pipe(z.string().refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v), "Link harus diawali / (halaman internal) atau https://.")), urutan: bulat("Urutan") });
export const mediaSosialSchema = z.object({ platform: z.enum(["INSTAGRAM", "FACEBOOK", "YOUTUBE", "TIKTOK", "WHATSAPP"], { error: "Platform tidak valid." }), url: teks("URL", 500).pipe(z.string().regex(/^https?:\/\//, "URL media sosial harus diawali https://.")), urutan: bulat("Urutan"), isAktif: centang });
export const metodePembayaranSchema = z.object({ nama: teks("Nama metode", 60), ikon: z.string().trim().max(40).optional().transform((v) => v || "bank"), urutan: bulat("Urutan") });
export const pesanKontakSchema = z.object({ nama: teks("Nama", 100), email: emailSchema, subjek: teks("Subjek", 150), isi: teks("Pesan", 5000, 5) });

// ---------- Tahap 11B ----------
export const kycSchema = z.object({ penghasilanBulanan: uangSchema("Penghasilan bulanan"), pekerjaan: teks("Pekerjaan", 100, 2) });
export const akadSchema = z.object({
  pahamBiaya: z.string({ error: "Centang pernyataan bahwa Anda sudah membaca dan memahami seluruh biaya." }).refine((v) => v === "on", "Centang pernyataan bahwa Anda sudah membaca dan memahami seluruh biaya."),
  setuju: z.string({ error: "Centang pernyataan persetujuan akad." }).refine((v) => v === "on", "Centang pernyataan persetujuan akad."),
  password: z.string({ error: "Masukkan password Anda." }).min(1, "Masukkan password Anda."),
});
export const restrukturSchema = z.object({ tenorBaru: z.string().trim().regex(/^\d{1,3}$/, "Tenor baru harus bilangan bulat.").transform(Number), alasan: teks("Alasan", 191, 10) });
export const shuSchema = z
  .object({ tahun: z.string().trim().regex(/^\d{4}$/, "Tahun tidak valid.").transform(Number), totalShu: uangSchema("Total SHU"), persenJasaModal: persen("Persen jasa modal"), persenJasaPinjaman: persen("Persen jasa pinjaman") })
  .refine((v) => v.persenJasaModal.plus(v.persenJasaPinjaman).lte(100), { message: "Jumlah persen jasa modal dan jasa pinjaman tidak boleh melebihi 100%.", path: ["persenJasaModal"] });
