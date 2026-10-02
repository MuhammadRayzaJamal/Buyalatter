import { describe, expect, it } from "vitest";
import { AKSES, bolehAkses } from "./akses";

describe("matriks akses", () => {
  it("TELLER input simpanan dan pembayaran tunai, tetapi tidak menyetujui pinjaman", () => {
    expect(AKSES.simpananInput).toContain("TELLER");
    expect(AKSES.angsuranTunai).toContain("TELLER");
    expect(AKSES.pinjamanSetujui).not.toContain("TELLER");
  });
  it("MANAJER menyetujui pinjaman dan pencairan; ADMIN mengelola pengaturan dan pengguna", () => {
    expect(AKSES.pinjamanSetujui).toContain("MANAJER");
    expect(AKSES.pencairan).toContain("MANAJER");
    expect(AKSES.pengaturan).toEqual(["ADMIN"]);
    expect(AKSES.pengguna).toEqual(["ADMIN"]);
  });
  it("menu sidebar disaring per peran", () => {
    expect(bolehAkses("TELLER", "/admin/pencairan")).toBe(false);
    expect(bolehAkses("TELLER", "/admin/simpanan")).toBe(true);
    expect(bolehAkses("MANAJER", "/admin/pengaturan")).toBe(false);
    expect(bolehAkses("MANAJER", "/admin/banner")).toBe(false);
    expect(bolehAkses("ADMIN", "/admin/banner")).toBe(true);
    expect(bolehAkses("ANGGOTA", "/admin/dashboard")).toBe(false);
  });
});
