import { describe, expect, it } from "vitest";
import { Decimal, jadwalAngsuran, parseUang, tambah, NOL } from "./uang";

describe("uang (Decimal)", () => {
  it("tidak terkena galat pecahan biner", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(new Decimal("0.1").plus("0.2").toString()).toBe("0.3");
  });

  it("jadwal angsuran berjumlah persis totalBayar (sisa pembulatan di angsuran terakhir)", () => {
    const jadwal = jadwalAngsuran("1000000.00", 3);
    expect(jadwal.map((d) => d.toFixed(2))).toEqual(["333333.33", "333333.33", "333333.34"]);
    expect(jadwal.reduce((a, b) => a.plus(b), NOL).toFixed(2)).toBe("1000000.00");
  });

  it("parseUang hanya menerima angka positif maksimal 2 desimal", () => {
    expect(parseUang("100000")?.toString()).toBe("100000");
    expect(parseUang("100000.50")?.toString()).toBe("100000.5");
    for (const buruk of ["", "-5", "1e5", "1.234", "abc", "1,000", " "]) expect(parseUang(buruk)).toBeNull();
  });

  it("tambah() menjumlahkan kolom dengan Decimal", () => {
    const baris = [{ jumlah: new Decimal("0.1") }, { jumlah: new Decimal("0.2") }];
    expect(baris.reduce(tambah("jumlah"), NOL).toString()).toBe("0.3");
  });
});
