/** Peran dan matriks akses. File ini murni (tanpa impor server) sehingga aman dipakai di sidebar klien. */
export type Peran = "ADMIN" | "MANAJER" | "TELLER" | "ANGGOTA";
export const STAF = ["ADMIN", "MANAJER", "TELLER"] as const satisfies readonly Peran[];

export const LABEL_PERAN: Record<Peran, string> = { ADMIN: "Admin", MANAJER: "Manajer", TELLER: "Teller", ANGGOTA: "Anggota" };

const ADMIN: Peran[] = ["ADMIN"];
const ADMIN_MANAJER: Peran[] = ["ADMIN", "MANAJER"];
const SEMUA_STAF: Peran[] = ["ADMIN", "MANAJER", "TELLER"];

/**
 * Siapa boleh membuka bagian mana di /admin. ADMIN mengelola pengaturan dan pengguna; MANAJER menyetujui pinjaman dan pencairan;
 * TELLER menginput simpanan dan pembayaran tunai.
 */
export const AKSES = {
  dashboard: SEMUA_STAF,
  anggota: SEMUA_STAF,
  anggotaKelola: ADMIN,
  verifikasi: ADMIN_MANAJER,
  simpanan: SEMUA_STAF,
  simpananInput: ["ADMIN", "TELLER"] as Peran[],
  penarikan: ADMIN_MANAJER,
  pinjaman: SEMUA_STAF,
  pinjamanSetujui: ADMIN_MANAJER,
  pencairan: ADMIN_MANAJER,
  angsuran: SEMUA_STAF,
  angsuranTunai: ["ADMIN", "TELLER"] as Peran[],
  angsuranDenda: ADMIN_MANAJER,
  verifikasiPembayaran: SEMUA_STAF,
  tunggakan: ADMIN_MANAJER,
  pengingat: ADMIN_MANAJER,
  laporan: ADMIN_MANAJER,
  mutasi: SEMUA_STAF,
  mutasiKoreksi: ADMIN_MANAJER,
  auditLog: ADMIN_MANAJER,
  verifikasiAnggota: ADMIN_MANAJER,
  restrukturisasi: ADMIN_MANAJER,
  restrukturisasiKeputusan: ["MANAJER"] as Peran[],
  shu: ADMIN_MANAJER,
  pengguna: ADMIN,
  pengaturan: ADMIN,
  konten: ADMIN,
} as const satisfies Record<string, readonly Peran[]>;

const PETA_HREF: [string, readonly Peran[]][] = [
  ["/admin/dashboard", AKSES.dashboard],
  ["/admin/anggota", AKSES.anggota],
  ["/admin/verifikasi-pembayaran", AKSES.verifikasiPembayaran],
  ["/admin/verifikasi-anggota", AKSES.verifikasiAnggota],
  ["/admin/restrukturisasi", AKSES.restrukturisasi],
  ["/admin/shu", AKSES.shu],
  ["/admin/verifikasi", AKSES.verifikasi],
  ["/admin/simpanan", AKSES.simpanan],
  ["/admin/penarikan", AKSES.penarikan],
  ["/admin/pinjaman", AKSES.pinjaman],
  ["/admin/pencairan", AKSES.pencairan],
  ["/admin/angsuran", AKSES.angsuran],
  ["/admin/tunggakan", AKSES.tunggakan],
  ["/admin/pengingat", AKSES.pengingat],
  ["/admin/laporan", AKSES.laporan],
  ["/admin/mutasi", AKSES.mutasi],
  ["/admin/audit-log", AKSES.auditLog],
  ["/admin/pengguna", AKSES.pengguna],
  ["/admin/pengaturan", AKSES.pengaturan],
];

/** Untuk menyaring menu sidebar. Href yang tidak terdaftar dianggap konten (ADMIN saja). */
export function bolehAkses(peran: Peran, href: string) {
  const entri = PETA_HREF.find(([awalan]) => href === awalan || href.startsWith(`${awalan}/`));
  return (entri ? entri[1] : AKSES.konten).includes(peran);
}
