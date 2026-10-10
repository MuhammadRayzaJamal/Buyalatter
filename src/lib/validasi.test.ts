import { describe, expect, it } from "vitest";
import { buatPenarikanSchema, buatPinjamanSchema, passwordSchema, pengaturanSchema, uangSchema } from "./validasi";
import { Decimal } from "./uang";
import type { BatasNominal } from "./pengaturan";

const batas: BatasNominal = { bungaPinjamanPerTahun: new Decimal("12"), bungaSimpananPerTahun: new Decimal("4"), metodeBunga: "ANUITAS", biayaAdminPersen: new Decimal("1"), simpananPokok: new Decimal("100000"), simpananWajib: new Decimal("50000"), batasPencairanManajer: new Decimal("10000000"), minPinjaman: new Decimal("1000000"), maksPinjaman: new Decimal("50000000"), minTransaksi: new Decimal("10000"), maksTransaksi: new Decimal("100000000"), minLamaAnggotaBulan: 3, plafonKaliSimpanan: new Decimal("3"), maksRasioAngsuranPersen: new Decimal("30"), maksHariTunggakan: 30, periodeTunggakanBulan: 12, batasDendaPersen: new Decimal("10") };

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

  describe("pengaturan (batas Permenkop UKM 8/2023)", () => {
    const dasar = { bungaPinjamanPerTahun: "12", bungaSimpananPerTahun: "4", metodeBunga: "ANUITAS", biayaAdminPersen: "1", simpananPokok: "100000", simpananWajib: "50000", dendaPersenPerHari: "0.05", masaTenggangHari: "3", templatePengingat: "", hariPengingatSebelumJatuhTempo: "3", batasHariTerlambatKritis: "30", batasPencairanManajer: "10000000", minPinjaman: "1000000", maksPinjaman: "50000000", minTransaksi: "10000", maksTransaksi: "100000000", minLamaAnggotaBulan: "3", plafonKaliSimpanan: "3", maksRasioAngsuranPersen: "30", maksHariTunggakan: "30", periodeTunggakanBulan: "12", batasDendaPersen: "10" };
    const pesan = (ubah: Record<string, string>) => { const r = pengaturanSchema.safeParse({ ...dasar, ...ubah }); return r.success ? null : r.error.issues[0].message; };

    it("menerima pengaturan bawaan", () => expect(pesan({})).toBeNull());
    it("menolak bunga pinjaman di atas 24% per tahun", () => expect(pesan({ bungaPinjamanPerTahun: "24.5" })).toContain("Melebihi batas Permenkop UKM 8/2023"));
    it("menolak bunga efektif di atas 24% walau bunga nominal 12% (metode flat)", () => expect(pesan({ metodeBunga: "FLAT" })).toContain("Melebihi batas Permenkop UKM 8/2023"));
    it("menolak bunga simpanan di atas 9%", () => expect(pesan({ bungaSimpananPerTahun: "9.5" })).toContain("Melebihi batas Permenkop UKM 8/2023"));
    it("menolak biaya admin di atas 1%", () => expect(pesan({ biayaAdminPersen: "1.5" })).toContain("Melebihi batas Permenkop UKM 8/2023"));
    it("menolak batas denda di atas 10% pokok", () => expect(pesan({ batasDendaPersen: "15" })).toContain("maksimal 10%"));
    it("menolak template pengingat bernada ancaman", () => expect(pesan({ templatePengingat: "Bayar atau kami sebar ke tetangga" })).toContain("kata yang tidak diperbolehkan"));
    it("menerima template sopan", () => expect(pesan({ templatePengingat: "Halo {nama}, angsuran ke-{angsuranKe} jatuh tempo {jatuhTempo}. Terima kasih." })).toBeNull());
  });
});
