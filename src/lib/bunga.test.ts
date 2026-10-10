import { describe, expect, it } from "vitest";
import { bungaEfektifPerTahun, bungaEfektifTertinggi, hitungBiayaAdmin, hitungPinjaman, jadwalPinjaman } from "./bunga";
import { NOL } from "./uang";

describe("bunga per tahun", () => {
  it("FLAT: total bunga = pokok × bunga/tahun × tenor/12", () => {
    const r = hitungPinjaman({ pokok: "6000000", bungaTahun: "12", tenorBulan: 12, metode: "FLAT" });
    expect(r.totalBunga.toString()).toBe("720000");
    expect(r.cicilanPertama.toString()).toBe("560000");
    expect(r.bungaEfektifTahun.toNumber()).toBeGreaterThan(23);
    expect(r.bungaEfektifTahun.toNumber()).toBeLessThan(25);
  });

  it("ANUITAS: cicilan tetap dan bunga efektif ≈ (1+i)^12−1", () => {
    const r = hitungPinjaman({ pokok: "12000000", bungaTahun: "12", tenorBulan: 12, metode: "ANUITAS" });
    expect(r.cicilanPertama.toString()).toBe("1066185.46");
    expect(r.bungaEfektifTahun.toFixed(2)).toBe("12.68");
    expect(r.jadwal.reduce((a, b) => a.plus(b), NOL).toString()).toBe(r.totalBayar.toString());
  });

  it("MENURUN: cicilan menurun tiap bulan dan lebih murah dari flat", () => {
    const r = hitungPinjaman({ pokok: "12000000", bungaTahun: "12", tenorBulan: 12, metode: "MENURUN" });
    expect(r.cicilanPertama.toString()).toBe("1120000");
    expect(r.cicilanTerakhir.toString()).toBe("1010000");
    expect(r.totalBunga.lt(hitungPinjaman({ pokok: "12000000", bungaTahun: "12", tenorBulan: 12, metode: "FLAT" }).totalBunga)).toBe(true);
  });

  it("biaya admin 1% mengurangi dana diterima dan menaikkan bunga efektif", () => {
    expect(hitungBiayaAdmin("5000000", "1").toString()).toBe("50000");
    const tanpa = hitungPinjaman({ pokok: "5000000", bungaTahun: "12", tenorBulan: 6, metode: "ANUITAS" });
    const dengan = hitungPinjaman({ pokok: "5000000", bungaTahun: "12", tenorBulan: 6, metode: "ANUITAS", biayaAdminPersen: "1" });
    expect(dengan.danaDiterima.toString()).toBe("4950000");
    expect(dengan.bungaEfektifTahun.gt(tanpa.bungaEfektifTahun)).toBe(true);
    expect(dengan.totalBiaya.toString()).toBe(tanpa.totalBunga.plus(50000).toString());
  });

  it("bunga 0% menghasilkan cicilan = pokok/tenor dan efektif 0", () => {
    expect(bungaEfektifPerTahun("1200000", jadwalPinjaman("1200000", "0", 12, "ANUITAS"))).toEqual(NOL);
  });

  it("bawaan (12% anuitas + admin 1%) di bawah 24%, flat 12% dan 14% melebihi 24% karena efektifnya hampir dua kali lipat", () => {
    expect(bungaEfektifTertinggi("12", "FLAT", "1").gt(24)).toBe(true);
    expect(bungaEfektifTertinggi("12", "ANUITAS", "1").lte(24)).toBe(true);
    expect(bungaEfektifTertinggi("14", "FLAT", "1").gt(24)).toBe(true);
    expect(bungaEfektifTertinggi("24", "ANUITAS", "0").gt(24)).toBe(true);
  });
});
