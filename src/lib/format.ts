type NilaiUang = number | string | { toString(): string } | null | undefined;

/**
 * Format Rupiah tanpa konversi ke Number: Decimal/string diteruskan sebagai string desimal ke Intl.NumberFormat,
 * sehingga nominal besar tetap presisi. Aman dipakai di komponen klien (tidak mengimpor Prisma).
 */
export function formatRupiah(value: NilaiUang, tampilkanSen = false) {
  const teks = value === null || value === undefined ? "0" : typeof value === "number" ? String(value) : value.toString();
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: tampilkanSen ? 2 : 0,
    maximumFractionDigits: tampilkanSen ? 2 : 0,
  }).format(teks as unknown as number);
}

export function formatTanggal(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}