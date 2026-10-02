/** Deteksi tipe berkas dari magic bytes. Tanpa dependensi framework agar bisa dipakai di skrip dan tes. */
export type Jenis = { ext: string; mime: string };
export const JPEG: Jenis = { ext: "jpg", mime: "image/jpeg" };
export const PNG: Jenis = { ext: "png", mime: "image/png" };
export const WEBP: Jenis = { ext: "webp", mime: "image/webp" };
export const GIF: Jenis = { ext: "gif", mime: "image/gif" };
export const PDF: Jenis = { ext: "pdf", mime: "application/pdf" };

/** Mengenali tipe berkas dari byte awalnya (magic bytes). Ekstensi dan Content-Type dari klien sengaja diabaikan. */
export function deteksiJenis(buf: Buffer): Jenis | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return JPEG;
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return PNG;
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return WEBP;
  if (buf.length >= 6 && ["GIF87a", "GIF89a"].includes(buf.subarray(0, 6).toString("latin1"))) return GIF;
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return PDF;
  return null;
}

