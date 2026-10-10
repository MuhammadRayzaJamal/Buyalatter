import { describe, expect, it } from "vitest";
import { cariKataTerlarang, cekJadwalPenagihan, isiTemplate, tambahHariKerja, TEMPLATE_BAWAAN } from "./penagihan-aturan";

const libur = new Set(["2026-08-17"]);
// Waktu WIB ditulis eksplisit dengan offset +07:00.
const wib = (iso: string) => new Date(`${iso}+07:00`);

describe("jadwal penagihan beretika", () => {
  it("boleh Senin–Sabtu 08.00–19.59 WIB", () => {
    expect(cekJadwalPenagihan(wib("2026-10-05T08:00:00"), libur).boleh).toBe(true); // Senin
    expect(cekJadwalPenagihan(wib("2026-10-10T19:59:00"), libur).boleh).toBe(true); // Sabtu
  });
  it("menolak Minggu, jam 07.59, jam 20.00, dan hari libur", () => {
    expect(cekJadwalPenagihan(wib("2026-10-04T10:00:00"), libur).boleh).toBe(false); // Minggu
    expect(cekJadwalPenagihan(wib("2026-10-05T07:59:00"), libur).boleh).toBe(false);
    expect(cekJadwalPenagihan(wib("2026-10-05T20:00:00"), libur).boleh).toBe(false);
    expect(cekJadwalPenagihan(wib("2026-08-17T10:00:00"), libur)).toEqual({ boleh: false, alasan: "Hari libur nasional." });
  });
  it("memakai WIB walau waktu diberikan dalam UTC", () => {
    expect(cekJadwalPenagihan(new Date("2026-10-05T00:30:00Z"), libur).boleh).toBe(false); // 07.30 WIB
    expect(cekJadwalPenagihan(new Date("2026-10-05T01:00:00Z"), libur).boleh).toBe(true); // 08.00 WIB
    expect(cekJadwalPenagihan(new Date("2026-10-10T17:30:00Z"), libur).boleh).toBe(false); // Minggu 00.30 WIB
  });
  it("tenggat 10 hari kerja melewati akhir pekan dan libur", () => {
    const tenggat = tambahHariKerja(wib("2026-08-10T09:00:00"), 5, libur); // Senin 10 Agu + 5 hari kerja, 17 Agu libur
    expect(tenggat.toISOString().slice(0, 10)).toBe("2026-08-18");
  });
});

describe("kata terlarang", () => {
  it("memblokir ancaman dan variasinya", () => {
    for (const teks of ["Kami akan mengancam Anda", "ancaman polisi", "kami sebar ke tetangga", "akan viral", "bikin malu", "masuk penjara", "disebarkan", "Debt   Collector"]) expect(cariKataTerlarang(teks), teks).not.toBeNull();
  });
  it("tidak salah memblokir kata biasa", () => {
    expect(cariKataTerlarang(TEMPLATE_BAWAAN)).toBeNull();
    expect(cariKataTerlarang("Silakan bermusyawarah secara kekeluargaan, terima kasih.")).toBeNull();
  });
});

describe("template pesan", () => {
  it("mengisi placeholder", () => {
    const pesan = isiTemplate(null, { nama: "Budi", angsuranKe: 2, jumlah: 500000, denda: 0, jatuhTempo: new Date(2026, 8, 20) });
    expect(pesan).toContain("Halo Budi");
    expect(pesan).toContain("Angsuran ke-2");
    expect(pesan).not.toContain("Denda");
  });
});
