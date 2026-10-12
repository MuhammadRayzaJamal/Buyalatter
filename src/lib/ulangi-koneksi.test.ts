import { describe, expect, it } from "vitest";
import { ulangiBilaKoneksiPutus } from "./ulangi-koneksi";

const putus = () => Object.assign(new Error("closed"), { code: "P1017" });

describe("ulangiBilaKoneksiPutus", () => {
  it("mengulang query yang gagal karena koneksi terputus", async () => {
    let n = 0;
    const hasil = await ulangiBilaKoneksiPutus(async () => { if (++n < 3) throw putus(); return "ok"; }, 3, 1);
    expect(hasil).toBe("ok");
    expect(n).toBe(3);
  });
  it("tidak mengulang galat lain", async () => {
    let n = 0;
    await expect(ulangiBilaKoneksiPutus(async () => { n++; throw Object.assign(new Error("unik"), { code: "P2002" }); }, 3, 1)).rejects.toThrow("unik");
    expect(n).toBe(1);
  });
  it("menyerah setelah batas percobaan", async () => {
    let n = 0;
    await expect(ulangiBilaKoneksiPutus(async () => { n++; throw putus(); }, 3, 1)).rejects.toThrow("closed");
    expect(n).toBe(3);
  });
});
