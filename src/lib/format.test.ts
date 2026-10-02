import { describe, expect, test } from "vitest";
import { formatRupiah as formatRupiahAsli, formatTanggal } from "./format";

// Intl memakai spasi tak-terputus (NBSP) setelah "Rp" pada Node baru; normalkan agar tes stabil di semua lingkungan.
const formatRupiah = (...args: Parameters<typeof formatRupiahAsli>) => formatRupiahAsli(...args).replace(/\u00a0/g, "");

describe("formatRupiah", () => {
  test("formats a positive number as IDR currency with no decimals", () => {
    expect(formatRupiah(10000)).toBe("Rp10.000");
  });

  test("formats a numeric string", () => {
    expect(formatRupiah("5000")).toBe("Rp5.000");
  });

  test("rounds fractional values down to whole rupiah", () => {
    expect(formatRupiah(1500.75)).toBe("Rp1.501");
  });

  test("treats null as zero", () => {
    expect(formatRupiah(null)).toBe("Rp0");
  });

  test("treats undefined as zero", () => {
    expect(formatRupiah(undefined)).toBe("Rp0");
  });
});

describe("formatTanggal", () => {
  test("formats a Date object in Indonesian long form", () => {
    expect(formatTanggal(new Date(2024, 0, 15))).toBe("15 Januari 2024");
  });

  test("formats a date string", () => {
    expect(formatTanggal("2024-12-25T00:00:00")).toBe("25 Desember 2024");
  });
});
