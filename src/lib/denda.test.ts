import { describe, expect, it } from "vitest";
import { hariTerlambat, hitungDenda, levelTunggakan, linkWhatsApp, normalisasiNoHp } from "./denda";

describe("denda", () => {
  it("menghitung denda = jumlah × persen/hari × hari", () => {
    expect(hitungDenda(500000, 0.1, 10).toString()).toBe("5000");
    expect(hitungDenda("333333.33", "0.1", 3).toString()).toBe("1000");
    // 0,1 + 0,2 pada Number = 0.30000000000000004; Decimal harus persis.
    expect(hitungDenda("0.10", "0.2", 1).toString()).toBe("0");
  });

  it("menghitung hari terlambat minimal 1 dan 0 jika belum jatuh tempo", () => {
    const sekarang = new Date(2026, 8, 30, 8, 0);
    expect(hariTerlambat(new Date(2026, 9, 2), sekarang)).toBe(0);
    expect(hariTerlambat(new Date(2026, 8, 30, 1, 0), sekarang)).toBe(1);
    expect(hariTerlambat(new Date(2026, 8, 20, 12, 0), sekarang)).toBe(10);
  });

  it("menentukan level tunggakan", () => {
    expect(levelTunggakan(7, 30)).toBe("ringan");
    expect(levelTunggakan(8, 30)).toBe("tinggi");
    expect(levelTunggakan(30, 30)).toBe("tinggi");
    expect(levelTunggakan(31, 30)).toBe("kritis");
  });

  it("menormalkan nomor HP dan membuat link WhatsApp", () => {
    expect(normalisasiNoHp("0812-3456-0001")).toBe("6281234560001");
    const link = linkWhatsApp("081234560001", { nama: "Budi", angsuranKe: 2, jumlah: 500000, denda: 5000, jatuhTempo: new Date(2026, 8, 20) });
    expect(link.startsWith("https://wa.me/6281234560001?text=")).toBe(true);
    expect(decodeURIComponent(link)).toContain("Angsuran ke-2");
  });
});
