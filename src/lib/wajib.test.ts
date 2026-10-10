import { describe, expect, it } from "vitest";
import { tunggakanWajibBulan } from "./wajib";

const sekarang = new Date(2026, 9, 3); // 3 Okt 2026: bulan penuh terakhir = September 2026
const bulanBayar = (...bulan: number[]) => bulan.map((m) => new Date(2026, m - 1, 5));

describe("simpanan wajib rutin", () => {
  it("lancar bila semua bulan penuh (12 terakhir) dibayar", () => {
    expect(tunggakanWajibBulan(new Date(2024, 0, 10), [...bulanBayar(1, 2, 3, 4, 5, 6, 7, 8, 9), new Date(2025, 9, 5), new Date(2025, 10, 5), new Date(2025, 11, 5)], sekarang)).toEqual({ jatuhTempo: 12, tunggakan: 0 });
  });
  it("menghitung bulan yang belum dibayar", () => {
    expect(tunggakanWajibBulan(new Date(2024, 0, 10), bulanBayar(1, 2, 3, 4, 5, 6, 7, 8, 9), sekarang).tunggakan).toBe(3);
    expect(tunggakanWajibBulan(new Date(2024, 0, 10), bulanBayar(1, 2, 3, 4, 5, 6, 7), sekarang).tunggakan).toBe(5);
  });
  it("bulan sebelum bergabung dan bulan berjalan tidak dihitung", () => {
    expect(tunggakanWajibBulan(new Date(2026, 6, 15), [], sekarang)).toEqual({ jatuhTempo: 2, tunggakan: 2 }); // Agustus & September
    expect(tunggakanWajibBulan(new Date(2026, 8, 20), [], sekarang)).toEqual({ jatuhTempo: 0, tunggakan: 0 });
  });
});
