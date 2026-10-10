// Demo: 4 anggota dengan tunggakan berbeda untuk mencoba pengingat tunggakan. Aman dijalankan ulang (id berawalan "demo-").
// Dipanggil otomatis oleh seed; bisa juga dijalankan sendiri: npx tsx prisma/demo-tunggakan.ts
import bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "@prisma/client";
import { hitungPinjaman } from "../src/lib/bunga";

const HARI_MS = 24 * 60 * 60 * 1000;
const geserBulan = (dasar: Date, bulan: number) => { const h = new Date(dasar); h.setMonth(h.getMonth() + bulan); return h; };

// offsetHari: negatif = sudah lewat jatuh tempo, positif = jatuh tempo masih beberapa hari lagi
const DEMO = [
  { kode: "rizmi", nama: "Rizmi Kiran", noHp: "0896-7847-0275", offsetHari: -3, nik: "3200000000000101" },
  { kode: "rayza", nama: "Rayza", noHp: "0821-1937-8422", offsetHari: -12, nik: "3200000000000102" },
  { kode: "lail", nama: "Lail", noHp: "0857-7543-6665", offsetHari: -45, nik: "3200000000000103" },
  { kode: "fatih", nama: "Fatih", noHp: "0851-8454-3035", offsetHari: 2, nik: "3200000000000104" },
] as const;

export async function buatDataDemoTunggakan(prisma: PrismaClient) {
  const password = await bcrypt.hash("anggota123", 10);
  for (const [i, d] of DEMO.entries()) {
    const userId = `demo-user-${d.kode}`; const anggotaId = `demo-anggota-${d.kode}`; const pinjamanId = `demo-pinjaman-${d.kode}`;
    const email = `${d.kode}@buyalatter.com`;
    await prisma.user.deleteMany({ where: { id: userId } }); // cascade: anggota, pinjaman, angsuran, notifikasi
    await prisma.user.create({ data: { id: userId, nama: d.nama, email, password, role: "ANGGOTA" } });
    await prisma.anggota.create({ data: { id: anggotaId, userId, noAnggota: `BL-DEMO-00${i + 1}`, nik: d.nik, alamat: "Alamat demo, Jakarta", noHp: d.noHp, tanggalMasuk: new Date(Date.now() - 150 * HARI_MS), status: "AKTIF", statusVerifikasi: "TERVERIFIKASI", diverifikasiPada: new Date() } });
    await prisma.simpanan.create({ data: { anggotaId, jenis: "POKOK", jumlah: new Prisma.Decimal(100000), tanggal: new Date(Date.now() - 150 * HARI_MS), keterangan: "Simpanan pokok anggota" } });
    const rekening = await prisma.rekeningAnggota.create({ data: { anggotaId, namaBank: "BCA", noRekening: `88000000${i + 1}`, atasNama: d.nama, isUtama: true } });

    const jumlah = 3000000; const tenor = 6; const r = hitungPinjaman({ pokok: jumlah, bungaTahun: 12, tenorBulan: tenor, metode: "ANUITAS", biayaAdminPersen: 1 }); const totalBayar = r.totalBayar;
    const jatuhTempoKe2 = new Date(Date.now() + d.offsetHari * HARI_MS);
    const tanggalPencairan = geserBulan(jatuhTempoKe2, -2);
    await prisma.pinjaman.create({ data: { id: pinjamanId, anggotaId, jumlah: new Prisma.Decimal(jumlah), tenorBulan: tenor, bungaPersen: new Prisma.Decimal(12), metodeBunga: "ANUITAS", biayaAdmin: r.biayaAdmin, totalBayar, status: "DICAIRKAN", tanggalPengajuan: geserBulan(tanggalPencairan, 0), tanggalDisetujui: tanggalPencairan, alasan: "Demo tunggakan", dibuatOlehId: userId, disetujuiOlehId: "seed-user-manajer" } });
    await prisma.pencairan.create({ data: { pinjamanId, rekeningAnggotaId: rekening.id, jumlahDicairkan: r.danaDiterima, biayaAdmin: r.biayaAdmin, tanggalPencairan, diprosesOlehId: "seed-user-manajer" } });
    const jadwal = r.jadwal;
    await prisma.angsuran.createMany({ data: jadwal.map((jml, k) => { const ke = k + 1; const jt = geserBulan(tanggalPencairan, ke); const lunas = ke === 1; return { id: `demo-angsuran-${d.kode}-${ke}`, pinjamanId, angsuranKe: ke, jumlah: jml, tanggalJatuhTempo: jt, tanggalBayar: lunas ? new Date(jt.getTime() - 3 * HARI_MS) : null, status: lunas ? "LUNAS" as const : "BELUM" as const, terbayar: lunas ? jml : new Prisma.Decimal(0), kodeUnik: 100 + ((i + 1) * 137 + ke * 53) % 900 }; }) });
  }
}

// Dijalankan langsung (bukan lewat seed).
if (process.argv[1]?.endsWith("demo-tunggakan.ts")) {
  const klien = new PrismaClient();
  buatDataDemoTunggakan(klien).then(() => klien.$disconnect()).catch(async (e) => { console.error(e); await klien.$disconnect(); process.exit(1); });
}
