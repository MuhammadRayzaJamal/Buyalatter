import { describe, expect, it } from "vitest";
import { buatPenarikanSchema, buatPinjamanSchema, passwordSchema, uangSchema } from "./validasi";
import { Decimal } from "./uang";
import type { BatasNominal } from "./pengaturan";

const batas: BatasNominal = { bungaDefault: new Decimal("1.5"), batasPencairanManajer: new Decimal("10000000"), minPinjaman: new Decimal("1000000"), maksPinjaman: new Decimal("50000000"), minTransaksi: new Decimal("10000"), maksTransaksi: new Decimal("100000000"), minLamaAnggotaBulan: 3, plafonKaliSimpanan: new Decimal("3"), maksRasioAngsuranPersen: new Decimal("30"), maksHariTunggakan: 30, periodeTunggakanBulan: 12, batasDendaPersen: new Decimal("10") };

describe("validasi", () => {
  it("password minimal 8 karakter dengan huruf dan angka", () => {
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
    expect(passwordSchema.safeParse("abc1234").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("nominal harus positif", () => {
    expect(uangSchema("Jumlah").safeParse("0").success).toBe(false);
    expect(uangSchema("Jumlah").safeParse("-10").success).toBe(false);
    expect(uangSchema("Jumlah").safeParse("10.5").success).toBe(true);
  });

  it("nominal pinjaman dan penarikan dibatasi sesuai Pengaturan", () => {
    const pinjaman = buatPinjamanSchema(batas);
    expect(pinjaman.safeParse({ jumlah: "999999", tenorBulan: "12", alasan: "Modal usaha" }).success).toBe(false);
    expect(pinjaman.safeParse({ jumlah: "50000001", tenorBulan: "12", alasan: "Modal usaha" }).success).toBe(false);
    expect(pinjaman.safeParse({ jumlah: "5000000", tenorBulan: "12", alasan: "Modal usaha" }).success).toBe(true);
    expect(pinjaman.safeParse({ jumlah: "5000000", tenorBulan: "2", alasan: "Modal usaha" }).success).toBe(false);
    expect(buatPenarikanSchema(batas).safeParse({ jumlah: "9999" }).success).toBe(false);
    expect(buatPenarikanSchema(batas).safeParse({ jumlah: "10000" }).success).toBe(true);
  });
});
