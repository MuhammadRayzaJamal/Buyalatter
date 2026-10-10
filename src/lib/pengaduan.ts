import type { KategoriPengaduan, StatusPengaduan } from "@prisma/client";

export const LABEL_KATEGORI: Record<KategoriPengaduan, string> = { PINJAMAN: "Pinjaman", PENAGIHAN: "Penagihan", SIMPANAN: "Simpanan", LAYANAN: "Layanan", DATA: "Data pribadi" };
export const LABEL_STATUS_PENGADUAN: Record<StatusPengaduan, string> = { DITERIMA: "Diterima", DIPROSES: "Diproses", SELESAI: "Selesai" };
export const VARIAN_STATUS_PENGADUAN = { DITERIMA: "warning", DIPROSES: "info", SELESAI: "success" } as const;
/** Target penyelesaian pengaduan (hari kerja). */
export const TARGET_HARI_KERJA = 10;
