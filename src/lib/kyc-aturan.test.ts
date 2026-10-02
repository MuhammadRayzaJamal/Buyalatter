import { describe, expect, it } from "vitest";
import { samarkanNik } from "./nik";
import { namaSama, normalisasiNama } from "./nama";
import { alokasiPembayaran, hitungPelunasan } from "./pelunasan";
import { hitungPembagianShu } from "./shu";
import { Decimal } from "./uang";

describe("NIK dan nama", () => {
  it("menyamarkan NIK 16 digit menjadi 3201********0001", () => {
    expect(samarkanNik("3201010101010001")).toBe("3201********0001");
  });
  it("mengabaikan huruf besar/kecil dan gelar pada nama pemilik rekening", () => {
    expect(normalisasiNama("Dr. H. Budi Santoso, S.E., M.M.")).toBe("budi santoso");
    expect(namaSama("BUDI  SANTOSO", "Budi Santoso S.Kom")).toBe(true);
    expect(namaSama("Budi Santoso", "Budi Susanto")).toBe(false);
  });
});

describe("pelunasan dan alokasi pembayaran", () => {
  const pinjaman = { jumlah: "6000000", totalBayar: "6540000" }; // 6 bulan, bunga 1,5%
  const angsuran = [1, 2, 3, 4, 5, 6].map((ke) => ({ angsuranKe: ke, jumlah: "1090000", denda: "0", terbayar: "0", status: ke <= 2 ? "LUNAS" : "BELUM" }));
  it("sisa pokok + bunga bulan berjalan saja", () => {
    const p = hitungPelunasan(pinjaman, angsuran)!;
    expect(p.jumlahAngsuranSisa).toBe(4);
    expect(p.sisaPokok.toString()).toBe("4000000");
    expect(p.bungaBulanBerjalan.toString()).toBe("90000");
    expect(p.total.toString()).toBe("4090000");
    expect(p.bungaDihemat.toString()).toBe("270000");
  });
  it("denda dilunasi dulu; kurang → sebagian; lebih → kelebihan", () => {
    const a = { jumlah: "1000000", denda: "5000", terbayar: "0" };
    const kurang = alokasiPembayaran(a, "400000");
    expect(kurang.lunas).toBe(false); expect(kurang.denda.toString()).toBe("5000"); expect(kurang.pokok.toString()).toBe("395000");
    const lebih = alokasiPembayaran(a, "1005123");
    expect(lebih.lunas).toBe(true); expect(lebih.kelebihan.toString()).toBe("123");
    const lanjut = alokasiPembayaran({ ...a, terbayar: "400000" }, "605000");
    expect(lanjut.lunas).toBe(true); expect(lanjut.kelebihan.toString()).toBe("0");
  });
});

describe("SHU", () => {
  it("membagi proporsional dan tidak melebihi pool", () => {
    const hasil = hitungPembagianShu({ totalShu: "1000000", persenJasaModal: "70", persenJasaPinjaman: "30", modal: new Map([["a", new Decimal(300)], ["b", new Decimal(100)]]), jasa: new Map([["a", new Decimal(10)], ["c", new Decimal(30)]]) });
    const a = hasil.find((x) => x.anggotaId === "a")!;
    expect(a.jasaModal.toString()).toBe("525000"); expect(a.jasaPinjaman.toString()).toBe("75000");
    expect(hasil.reduce((t, x) => t.plus(x.total), new Decimal(0)).lte(1000000)).toBe(true);
  });
});
