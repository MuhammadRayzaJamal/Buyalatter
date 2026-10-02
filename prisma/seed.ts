import bcrypt from "bcrypt";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, Prisma, type ArahMutasi, type JenisMutasi } from "@prisma/client";
import { susunIsiAkad } from "../src/lib/akad";
import { hitungDenda } from "../src/lib/denda";
import { alokasiPembayaran } from "../src/lib/pelunasan";
import { hitungPembagianShu } from "../src/lib/shu";
import { hitungTotalBayar, jadwalAngsuran } from "../src/lib/uang";

const prisma = new PrismaClient();

const uang = (nilai: number) => new Prisma.Decimal(nilai.toFixed(2));
type Uang = Prisma.Decimal;
type SimpananSeed = Omit<Prisma.SimpananCreateManyInput, "jumlah"> & { jumlah: Uang; id: string; tanggal: Date; keterangan: string };
type PinjamanSeed = Omit<Prisma.PinjamanCreateManyInput, "jumlah" | "totalBayar" | "bungaPersen" | "tanggalDisetujui"> & { tanggalDisetujui: Date | null; id: string; anggotaId: string; jumlah: Uang; totalBayar: Uang; bungaPersen: Uang };
type AngsuranSeed = Omit<Prisma.AngsuranCreateManyInput, "jumlah" | "denda" | "terbayar" | "tanggalJatuhTempo" | "tanggalBayar"> & { id: string; tanggalJatuhTempo: Date; tanggalBayar: Date | null; jumlah: Uang; denda: Uang; terbayar: Uang; kodeUnik: number };
const nomor3 = (index: number) => String(index + 1).padStart(3, "0");
const tanggal = (tahun: number, bulan: number, hari: number) =>
  new Date(Date.UTC(tahun, bulan - 1, hari));

const HARI_MS = 24 * 60 * 60 * 1000;
const DENDA_PERSEN_PER_HARI = 0.1;
const geserBulan = (dasar: Date, bulan: number) => {
  const hasil = new Date(dasar);
  hasil.setUTCMonth(hasil.getUTCMonth() + bulan);
  return hasil;
};
// Jatuh tempo angsuran pertama yang belum lunas untuk pinjaman DICAIRKAN, relatif terhadap hari ini
// supaya demo pengingat/denda selalu relevan: [indeks pinjaman]: selisih hari dari sekarang.
const OFFSET_HARI_TAGIHAN: Record<number, number> = { 1: -40, 6: -5, 10: 2 };

const anggotaData = [
  ["Budi Santoso", "budi.santoso@buyalatter.com", "3273010101850001", "Jl. Melati No. 12, Bandung", "081234560001", 2023, 3, 15],
  ["Siti Aminah", "siti.aminah@buyalatter.com", "3273014502900002", "Jl. Cempaka No. 8, Bandung", "081234560002", 2023, 4, 2],
  ["Andi Wijaya", "andi.wijaya@buyalatter.com", "3273021203880003", "Jl. Anggrek No. 21, Cimahi", "081234560003", 2023, 5, 10],
  ["Dewi Lestari", "dewi.lestari@buyalatter.com", "3273025507920004", "Jl. Terusan Buah Batu No. 5, Bandung", "081234560004", 2023, 6, 1],
  ["Rudi Hartono", "rudi.hartono@buyalatter.com", "3273011801800005", "Jl. Sukajadi No. 44, Bandung", "081234560005", 2023, 7, 18],
  ["Maya Sari", "maya.sari@buyalatter.com", "3273016201950006", "Jl. Kiaracondong No. 17, Bandung", "081234560006", 2023, 8, 7],
  ["Agus Setiawan", "agus.setiawan@buyalatter.com", "3273020907840007", "Jl. Leuwigajah No. 31, Cimahi", "081234560007", 2023, 9, 12],
  ["Lina Marlina", "lina.marlina@buyalatter.com", "3273015201970008", "Jl. Antapani No. 19, Bandung", "081234560008", 2023, 10, 3],
  ["Fajar Nugroho", "fajar.nugroho@buyalatter.com", "3273010702900009", "Jl. Pasteur No. 28, Bandung", "081234560009", 2023, 11, 21],
  ["Nina Kurniawati", "nina.kurniawati@buyalatter.com", "3273024606960010", "Jl. Cimindi No. 14, Cimahi", "081234560010", 2024, 1, 8],
  ["Dedi Irawan", "dedi.irawan@buyalatter.com", "3273011006820011", "Jl. Arcamanik No. 6, Bandung", "081234560011", 2024, 2, 14],
  ["Rina Oktaviani", "rina.oktaviani@buyalatter.com", "3273016508990012", "Jl. Dago No. 73, Bandung", "081234560012", 2024, 3, 4],
  ["Hendra Gunawan", "hendra.gunawan@buyalatter.com", "3273022201770013", "Jl. Baros No. 9, Cimahi", "081234560013", 2024, 4, 16],
  ["Tika Pratiwi", "tika.pratiwi@buyalatter.com", "3273015908940014", "Jl. Gedebage No. 11, Bandung", "081234560014", 2024, 5, 6],
  ["Yusuf Maulana", "yusuf.maulana@buyalatter.com", "3273010807860015", "Jl. Ujungberung No. 25, Bandung", "081234560015", 2024, 6, 20],
] as const;

const artikelData = [
  ["Rapat Anggota Tahunan BuyaLater 2026", "rapat-anggota-tahunan-buyalatter-2026", "Rapat Anggota Tahunan menjadi ruang bersama untuk mengevaluasi kinerja koperasi, menyampaikan laporan, dan menyusun rencana kerja baru.", "/images/artikel/artikel-01.jpg"],
  ["Program Simpanan Pendidikan untuk Keluarga", "program-simpanan-pendidikan-keluarga", "BuyaLater menghadirkan pilihan simpanan sukarela yang dapat membantu anggota menyiapkan kebutuhan pendidikan keluarga secara bertahap.", "/images/artikel/artikel-02.jpg"],
  ["Cara Mengajukan Pinjaman di BuyaLater", "cara-mengajukan-pinjaman-di-buyalatter", "Anggota dapat mengajukan pinjaman melalui pengurus dengan melengkapi data, jumlah kebutuhan, tenor, dan tujuan penggunaan dana.", "/images/artikel/artikel-03.jpg"],
  ["Pelatihan Pengelolaan Keuangan Rumah Tangga", "pelatihan-pengelolaan-keuangan-rumah-tangga", "Koperasi mengadakan pelatihan sederhana tentang pencatatan pemasukan, pengeluaran, dana darurat, dan kebiasaan menabung.", "/images/artikel/artikel-04.jpg"],
  ["Gotong Royong dan Bakti Sosial Anggota", "gotong-royong-dan-bakti-sosial-anggota", "Kegiatan sosial menjadi wujud semangat kebersamaan anggota untuk memberikan manfaat nyata bagi lingkungan sekitar.", "/images/artikel/artikel-05.jpg"],
  ["Transparansi dan Layanan Digital Koperasi", "transparansi-dan-layanan-digital-koperasi", "Layanan digital BuyaLater membantu anggota memantau simpanan, pinjaman, dan angsuran dengan informasi yang lebih mudah diakses.", "/images/artikel/artikel-06.jpg"],
] as const;

async function main() {
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordManajer = await bcrypt.hash("manajer123", 10);
  const passwordTeller = await bcrypt.hash("teller123", 10);
  const passwordAnggota = await bcrypt.hash("anggota123", 10);

  // Berkas privat milik anggota seed ikut dihapus dari disk (barisnya terhapus lewat cascade).
  const berkasLama = await prisma.berkasPrivat.findMany({ where: { anggotaId: { startsWith: "seed-" } } });
  for (const b of berkasLama) await unlink(path.join(process.cwd(), "storage", "private", b.kategori.toLowerCase(), b.namaFile)).catch(() => undefined);

  await prisma.$transaction(async (tx) => {
    // Buku mutasi dan audit log append-only di aplikasi; seed memakai klien mentah sehingga boleh mengosongkannya untuk data demo.
    await tx.mutasi.deleteMany({ where: { anggotaId: { startsWith: "seed-" } } });
    // SHU hasil uji lewat UI (id acak) ikut dibersihkan: penerima seed dihapus, periode seed/tahun yang bentrok dihapus.
    await tx.shuAnggota.deleteMany({ where: { OR: [{ anggotaId: { startsWith: "seed-" } }, { periodeId: { startsWith: "seed-" } }] } });
    await tx.periodeShu.deleteMany({ where: { OR: [{ id: { startsWith: "seed-" } }, { tahun: { in: [2025, 2026] } }] } });
    await tx.auditLog.deleteMany({});
    await tx.loginAttempt.deleteMany({});
    await tx.passwordResetToken.deleteMany({});
    await tx.penghargaan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.kantorCabang.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.mediaSosial.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.menuFooter.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.metodePembayaran.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.banner.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.testimoni.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.mitra.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.pencapaian.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.keunggulan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.notifikasi.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.pencairan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.angsuran.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.pinjaman.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.rekeningAnggota.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.penarikan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.simpanan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.anggota.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.user.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.rekeningKoperasi.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.galeri.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.artikel.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.pesan.deleteMany({ where: { id: { startsWith: "seed-" } } });
    await tx.pengaturan.deleteMany({ where: { id: "seed-pengaturan" } });

    await tx.user.create({
      data: {
        id: "seed-user-admin",
        nama: "Administrator BuyaLater",
        email: "admin@buyalatter.com",
        password: passwordAdmin,
        role: "ADMIN",
      },
    });
    await tx.user.create({ data: { id: "seed-user-manajer", nama: "Manajer BuyaLater", email: "manajer@buyalatter.com", password: passwordManajer, role: "MANAJER" } });
    await tx.user.create({ data: { id: "seed-user-teller", nama: "Teller BuyaLater", email: "teller@buyalatter.com", password: passwordTeller, role: "TELLER" } });

    const anggota: Awaited<ReturnType<typeof tx.anggota.create>>[] = [];
    for (const [index, data] of anggotaData.entries()) {
      const [nama, email, nik, alamat, noHp, tahun, bulan, hari] = data;
      const nomor = String(index + 1).padStart(3, "0");
      const userId = `seed-user-anggota-${nomor}`;
      const anggotaId = `seed-anggota-${nomor}`;

      await tx.user.create({
        data: {
          id: userId,
          nama,
          email,
          password: passwordAnggota,
          role: "ANGGOTA",
        },
      });

      anggota.push(
        await tx.anggota.create({
          data: {
            id: anggotaId,
            userId,
            noAnggota: `BL-${2023 + Math.floor(index / 5)}-${nomor}`,
            nik,
            alamat,
            noHp,
            tanggalMasuk: tanggal(tahun, bulan, hari),
            status: index === 14 ? "NONAKTIF" : "AKTIF",
            statusVerifikasi: "TERVERIFIKASI",
            diverifikasiPada: tanggal(tahun, bulan, hari),
          },
        }),
      );
    }

    const simpanan: SimpananSeed[] = [];
    const jumlahBulanWajib = [12, 11, 10, 9, 8, 7, 12, 10, 9, 8, 7, 6, 9, 8, 6];
    for (const [index, anggotaItem] of anggota.entries()) {
      const nomor = String(index + 1).padStart(3, "0");
      simpanan.push({
        id: `seed-simpanan-${nomor}-pokok`,
        anggotaId: anggotaItem.id,
        jenis: "POKOK" as const,
        jumlah: uang(100000),
        tanggal: tanggal(2023, 3 + (index % 6), 15),
        keterangan: "Simpanan pokok anggota",
      });

      for (let bulan = 0; bulan < jumlahBulanWajib[index]; bulan += 1) {
        simpanan.push({
          id: `seed-simpanan-${nomor}-wajib-${String(bulan + 1).padStart(2, "0")}`,
          anggotaId: anggotaItem.id,
          jenis: "WAJIB" as const,
          jumlah: uang(50000),
          tanggal: tanggal(2025, bulan + 1, 5 + (index % 5)),
          keterangan: `Simpanan wajib bulan ${bulan + 1}`,
        });
      }

      simpanan.push({
        id: `seed-simpanan-${nomor}-sukarela`,
        anggotaId: anggotaItem.id,
        jenis: "SUKARELA" as const,
        jumlah: uang(150000 + index * 25000),
        tanggal: tanggal(2025, 8 + (index % 4), 12),
        keterangan: "Simpanan sukarela anggota",
      });
    }
    await tx.simpanan.createMany({ data: simpanan });

    // Rekening bank anggota. Anggota[12] dan [13] sengaja dibiarkan tanpa rekening
    // untuk mendemokan gate "wajib rekening utama" saat mengajukan pinjaman.
    const rekeningBankNames = ["BCA", "Mandiri", "BNI", "BRI", "CIMB Niaga"] as const;
    const rekeningAnggota = [];
    for (const [index, anggotaItem] of anggota.entries()) {
      if (index === 12 || index === 13) continue;
      const nomor = String(index + 1).padStart(3, "0");
      rekeningAnggota.push({
        id: `seed-rekening-anggota-${nomor}`,
        anggotaId: anggotaItem.id,
        namaBank: rekeningBankNames[index % rekeningBankNames.length],
        noRekening: `${3800000000 + index * 1111}`,
        atasNama: anggotaData[index][0],
        isUtama: true,
        createdAt: anggotaItem.tanggalMasuk,
      });
    }
    await tx.rekeningAnggota.createMany({ data: rekeningAnggota });

    await tx.rekeningKoperasi.createMany({
      data: [
        { id: "seed-rekening-koperasi-01", namaBank: "BCA", noRekening: "5271234567", atasNama: "Koperasi BuyaLater", isAktif: true },
        { id: "seed-rekening-koperasi-02", namaBank: "Mandiri", noRekening: "1330098765432", atasNama: "Koperasi BuyaLater", isAktif: true },
      ],
    });

    const pinjamanStatus = [
      "LUNAS", "DICAIRKAN", "DIAJUKAN", "DITOLAK", "DISETUJUI",
      "LUNAS", "DICAIRKAN", "DIAJUKAN", "DITOLAK", "DISETUJUI",
      "DICAIRKAN",
    ] as const;
    const pinjaman: PinjamanSeed[] = [];
    const angsuran: AngsuranSeed[] = [];
    const pencairan = [];
    for (let index = 0; index < 11; index += 1) {
      const nomor = String(index + 1).padStart(2, "0");
      // Pinjaman index 4 sengaja di atas batas Rp 10.000.000 untuk mendemokan aturan "pencairan wajib Manajer".
      const jumlah = index === 4 ? 12000000 : 3000000 + index * 750000;
      const tenorBulan = [6, 10, 8, 12, 6, 10, 12, 8, 6, 10, 6][index];
      const bungaPersen = 1.5;
      const totalBayar = hitungTotalBayar(jumlah, bungaPersen, tenorBulan);
      const status = pinjamanStatus[index];
      const tanggalPengajuan = tanggal(2025, index + 1, 10 + (index % 10));
      const pinjamanId = `seed-pinjaman-${nomor}`;
      const sudahDicairkan = status === "DICAIRKAN" || status === "LUNAS";

      pinjaman.push({
        id: pinjamanId,
        anggotaId: anggota[index].id,
        jumlah: uang(jumlah),
        tenorBulan,
        bungaPersen: uang(bungaPersen),
        totalBayar,
        dibuatOlehId: index === 2 ? "seed-user-manajer" : `seed-user-anggota-${nomor3(index)}`,
        disetujuiOlehId: status === "DIAJUKAN" ? null : "seed-user-manajer",
        status,
        tanggalPengajuan,
        tanggalDisetujui: status === "DISETUJUI" || sudahDicairkan ? tanggal(2025, index + 1, 20) : null,
        alasan: status === "DITOLAK" ? "Dokumen pengajuan belum memenuhi persyaratan." : "Kebutuhan modal usaha anggota.",
      });

      if (sudahDicairkan) {
        const biayaAdmin = 25000;
        const sudahDibayar = status === "LUNAS" ? tenorBulan : Math.max(1, index % tenorBulan);
        const jatuhTempoBelumLunas = new Date(Date.now() + (OFFSET_HARI_TAGIHAN[index] ?? 0) * HARI_MS);
        const tanggalPencairan = status === "DICAIRKAN" ? geserBulan(jatuhTempoBelumLunas, -(sudahDibayar + 1)) : tanggal(2025, index + 1, 23);
        pencairan.push({
          id: `seed-pencairan-${nomor}`,
          pinjamanId,
          rekeningAnggotaId: `seed-rekening-anggota-${String(index + 1).padStart(3, "0")}`,
          jumlahDicairkan: uang(jumlah - biayaAdmin),
          biayaAdmin: uang(biayaAdmin),
          tanggalPencairan,
          buktiTransferUrl: null,
          diprosesOlehId: "seed-user-manajer",
          catatan: null,
        });

        const jadwal = jadwalAngsuran(totalBayar, tenorBulan);
        for (let urutan = 1; urutan <= tenorBulan; urutan += 1) {
          const jatuhTempo = geserBulan(tanggalPencairan, urutan);
          const lunas = urutan <= sudahDibayar;
          const hariLewat = Math.floor((Date.now() - jatuhTempo.getTime()) / HARI_MS) + 1;
          const terlambat = !lunas && jatuhTempo.getTime() < Date.now();
          angsuran.push({
            id: `seed-angsuran-${nomor}-${String(urutan).padStart(2, "0")}`,
            pinjamanId,
            angsuranKe: urutan,
            jumlah: jadwal[urutan - 1],
            tanggalJatuhTempo: jatuhTempo,
            tanggalBayar: lunas ? new Date(jatuhTempo.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
            denda: terlambat ? hitungDenda(jadwal[urutan - 1], DENDA_PERSEN_PER_HARI, hariLewat) : uang(0),
            status: lunas ? ("LUNAS" as const) : terlambat ? ("TERLAMBAT" as const) : ("BELUM" as const),
            kodeUnik: 100 + ((index + 3) * 137 + urutan * 53) % 900,
            terbayar: lunas ? jadwal[urutan - 1].plus(terlambat ? hitungDenda(jadwal[urutan - 1], DENDA_PERSEN_PER_HARI, hariLewat) : 0) : uang(0),
          });
        }
      }
    }
    await tx.pinjaman.createMany({ data: pinjaman });
    await tx.pencairan.createMany({ data: pencairan });
    await tx.angsuran.createMany({ data: angsuran });

    // ===== Tahap 11B: berkas contoh, KYC, akad, pembayaran, restrukturisasi, SHU =====
    const berkasPlaceholder = async (kategori: "KTP" | "SWAFOTO" | "BUKTI_BAYAR", aset: string, anggotaId: string, userId: string) => {
      const id = randomUUID(); const namaFile = `${id}.png`;
      await mkdir(path.join(process.cwd(), "storage", "private", kategori.toLowerCase()), { recursive: true });
      await copyFile(path.join(process.cwd(), "prisma", "seed-assets", `${aset}.png`), path.join(process.cwd(), "storage", "private", kategori.toLowerCase(), namaFile));
      await tx.berkasPrivat.create({ data: { id, kategori, anggotaId, namaFile, mime: "image/png", ukuran: 1, diunggahOlehId: userId } });
      return `/api/file/${id}`;
    };
    const pekerjaan = ["Pedagang", "Guru honorer", "Karyawan swasta", "Wirausaha kuliner", "Teknisi", "Perawat", "Sopir online", "Penjahit", "Staf administrasi", "Petani", "Pengrajin", "Freelancer", "Pegawai toko", "Barista", "Operator pabrik"];
    for (const [index, a] of anggota.entries()) {
      const nomor = nomor3(index); const status = index === 12 || index === 13 ? "MENUNGGU" : index === 14 ? "DITOLAK" : "DITERIMA";
      const ktp = await berkasPlaceholder("KTP", "ktp", a.id, a.userId); const selfie = await berkasPlaceholder("SWAFOTO", "swafoto", a.id, a.userId);
      await tx.verifikasiAnggota.create({ data: { id: `seed-kyc-${nomor}`, anggotaId: a.id, fotoKtpPath: ktp, swafotoKtpPath: selfie, penghasilanBulanan: uang(4000000 + index * 650000), pekerjaan: pekerjaan[index], status, alasanTolak: status === "DITOLAK" ? "Foto KTP buram dan NIK tidak terbaca." : null, diverifikasiOlehId: status === "MENUNGGU" ? null : "seed-user-manajer", tanggalVerifikasi: status === "MENUNGGU" ? null : tanggal(2023, 4, 1), createdAt: tanggal(2023, 3, 20) } });
      await tx.anggota.update({ where: { id: a.id }, data: { fotoKtp: ktp, statusVerifikasi: status === "DITERIMA" ? "TERVERIFIKASI" : status === "DITOLAK" ? "DITOLAK" : "PENDING" } });
    }

    // Akad digital: pinjaman berjalan/lunas dan satu pinjaman DISETUJUI (index 9). Index 4 (Rp 12 juta) sengaja belum berakad.
    const pengaturanSeed = { dendaPersenPerHari: DENDA_PERSEN_PER_HARI, batasDendaPersen: 10 };
    for (const pj of pinjaman) {
      const i = Number((pj.id as string).slice(-2)) - 1;
      if (!(["DICAIRKAN", "LUNAS"].includes(String(pj.status)) || i === 9)) continue;
      const a = anggota[i]; const profil = anggotaData[i];
      const isiAkad = susunIsiAkad({ pinjamanId: pj.id, anggota: { nama: profil[0], noAnggota: a.noAnggota, nik: a.nik, alamat: a.alamat }, jumlah: pj.jumlah, bungaPersen: pj.bungaPersen, tenorBulan: pj.tenorBulan, totalBayar: pj.totalBayar, tanggalPersetujuan: pj.tanggalDisetujui ?? new Date(), dendaPersenPerHari: pengaturanSeed.dendaPersenPerHari, batasDendaPersen: pengaturanSeed.batasDendaPersen });
      await tx.akadPinjaman.create({ data: { id: `seed-akad-${nomor3(i)}`, pinjamanId: pj.id, isiAkad, disetujuiPada: pj.tanggalDisetujui ?? new Date(), ipAddress: "127.0.0.1", userAgent: "Seed demo" } });
    }

    // Restrukturisasi: anggota 2 menunggak 40 hari → pengajuan perpanjangan tenor menunggu keputusan Manajer.
    await tx.restrukturisasi.create({ data: { id: "seed-restruk-01", pinjamanId: "seed-pinjaman-02", tenorLama: 10, tenorBaru: 14, alasan: "Usaha warung sepi selama dua bulan terakhir sehingga cicilan terlambat.", status: "DIAJUKAN" } });

    // Pembayaran: anggota 7 → SEBAGIAN (40% angsuran), anggota 11 → MENUNGGU verifikasi (jatuh tempo 2 hari lagi).
    const patch = (id: string, ubah: Partial<AngsuranSeed>) => { const a = angsuran.find((x) => x.id === id)!; Object.assign(a, ubah); return a; };
    const a7 = angsuran.find((x) => x.id === "seed-angsuran-07-07")!;
    const sebagian = alokasiPembayaran({ jumlah: a7.jumlah, denda: a7.denda, terbayar: 0 }, a7.jumlah.times(0.4).toDecimalPlaces(2));
    patch(a7.id, { terbayar: sebagian.diterapkan });
    const bukti7 = await berkasPlaceholder("BUKTI_BAYAR", "bukti", "seed-anggota-007", "seed-user-anggota-007");
    const a11 = angsuran.find((x) => x.id === "seed-angsuran-11-05")!;
    patch(a11.id, { status: "MENUNGGU_VERIFIKASI" });
    const bukti11 = await berkasPlaceholder("BUKTI_BAYAR", "bukti", "seed-anggota-011", "seed-user-anggota-011");
    await tx.angsuran.deleteMany({ where: { id: { in: [a7.id, a11.id] } } });
    await tx.angsuran.createMany({ data: [a7, a11] });
    const hash = (kunci: string) => createHash("sha256").update(kunci).digest("hex");
    await tx.pembayaran.create({ data: { id: "seed-pembayaran-sebagian", angsuranId: a7.id, anggotaId: "seed-anggota-007", rekeningKoperasiId: "seed-rekening-koperasi-01", jumlahBayar: sebagian.pokok, dendaDibayar: sebagian.denda, buktiBayarUrl: bukti7, tanggalBayar: new Date(Date.now() - 2 * HARI_MS), status: "SEBAGIAN", diverifikasiOlehId: "seed-user-teller", tanggalVerifikasi: new Date(Date.now() - HARI_MS), kodeUnik: a7.kodeUnik, jumlahTagihan: a7.jumlah.plus(a7.denda).plus(a7.kodeUnik), jumlahTransfer: sebagian.diterapkan, kelebihan: uang(0), hashBukti: hash("seed-bukti-sebagian") } });
    await tx.pembayaran.create({ data: { id: "seed-pembayaran-menunggu", angsuranId: a11.id, anggotaId: "seed-anggota-011", rekeningKoperasiId: "seed-rekening-koperasi-01", jumlahBayar: a11.jumlah, dendaDibayar: a11.denda, buktiBayarUrl: bukti11, status: "MENUNGGU", kodeUnik: a11.kodeUnik, jumlahTagihan: a11.jumlah.plus(a11.kodeUnik), jumlahTransfer: a11.jumlah.plus(a11.kodeUnik), hashBukti: hash("seed-bukti-menunggu") } });

    // SHU 2025 dibagikan (masuk simpanan sukarela), SHU 2026 masih DRAFT.
    const simpananShu: { id: string; anggotaId: string; jumlah: Prisma.Decimal; tanggal: Date; keterangan: string }[] = [];
    const dasarShu = (tahun: number) => {
      const akhir = new Date(Date.UTC(tahun, 11, 31, 23, 59, 59)); const awal = new Date(Date.UTC(tahun, 0, 1));
      const modal = new Map<string, Prisma.Decimal>(); const jasa = new Map<string, Prisma.Decimal>();
      for (const sp of simpanan) if (sp.tanggal <= akhir) modal.set(sp.anggotaId, (modal.get(sp.anggotaId) ?? new Prisma.Decimal(0)).plus(sp.jumlah));
      for (const a of angsuran) {
        if (a.status !== "LUNAS" || !a.tanggalBayar || a.tanggalBayar < awal || a.tanggalBayar > akhir) continue;
        const pj = pinjaman.find((x) => x.id === a.pinjamanId)!;
        const pokok = a.jumlah.times(pj.jumlah).div(pj.totalBayar); const bunga = a.jumlah.minus(pokok);
        jasa.set(pj.anggotaId, (jasa.get(pj.anggotaId) ?? new Prisma.Decimal(0)).plus(bunga));
      }
      for (const [id] of modal) if (anggota.find((x) => x.id === id)?.status !== "AKTIF") modal.delete(id);
      return { modal, jasa };
    };
    for (const [tahun, totalShu, status] of [[2025, 15000000, "DIBAGIKAN"], [2026, 25000000, "DRAFT"]] as const) {
      const { modal, jasa } = dasarShu(tahun);
      const bagian = hitungPembagianShu({ totalShu, persenJasaModal: 70, persenJasaPinjaman: 30, modal, jasa }).filter((b) => b.total.gt(0));
      const periodeId = `seed-shu-${tahun}`;
      await tx.periodeShu.create({ data: { id: periodeId, tahun, totalShu: uang(totalShu), persenJasaModal: uang(70), persenJasaPinjaman: uang(30), status, dibagikanPada: status === "DIBAGIKAN" ? tanggal(2026, 2, 15) : null } });
      await tx.shuAnggota.createMany({ data: bagian.map((b) => ({ id: `seed-shu-${tahun}-${b.anggotaId.slice(-3)}`, periodeId, anggotaId: b.anggotaId, jasaModal: b.jasaModal, jasaPinjaman: b.jasaPinjaman, total: b.total })) });
      if (status === "DIBAGIKAN") for (const b of bagian) simpananShu.push({ id: `seed-simpanan-shu-${tahun}-${b.anggotaId.slice(-3)}`, anggotaId: b.anggotaId, jumlah: b.total, tanggal: tanggal(2026, 2, 15), keterangan: `SHU tahun ${tahun}` });
    }
    await tx.simpanan.createMany({ data: simpananShu.map((x) => ({ ...x, jenis: "SUKARELA" as const })) });

    const kategori = ["Kegiatan", "Rapat", "Sosial"] as const;
    const galeri = Array.from({ length: 12 }, (_, index) => {
      const nomor = String(index + 1).padStart(2, "0");
      const kategoriItem = kategori[index % kategori.length];
      return {
        id: `seed-galeri-${nomor}`,
        judul: `${kategoriItem} BuyaLater ${2024 + (index % 3)}`,
        deskripsi: `Dokumentasi ${kategoriItem.toLowerCase()} bersama anggota BuyaLater.`,
        gambarUrl: `https://picsum.photos/seed/buyalatter-${kategoriItem.toLowerCase()}-${nomor}/1200/800`,
        kategori: kategoriItem,
        createdAt: tanggal(2024 + (index % 3), 2 + (index % 10), 8 + (index % 15)),
      };
    });
    await tx.galeri.createMany({ data: galeri });

    await tx.artikel.createMany({
      data: artikelData.map(([judul, slug, isi, gambarUrl], index) => ({
        id: `seed-artikel-${String(index + 1).padStart(2, "0")}`,
        judul,
        slug,
        isi,
        gambarUrl,
        createdAt: tanggal(2026, index + 1, 5 + index),
      })),
    });

    await tx.pengaturan.create({
      data: {
        id: "seed-pengaturan",
        bungaDefault: uang(1.5),
        simpananPokok: uang(100000),
        simpananWajib: uang(50000),
        dendaPersenPerHari: uang(DENDA_PERSEN_PER_HARI),
        batasPencairanManajer: uang(10000000),
        minPinjaman: uang(1000000),
        maksPinjaman: uang(50000000),
        minTransaksi: uang(10000),
        maksTransaksi: uang(100000000),
        minLamaAnggotaBulan: 3,
        plafonKaliSimpanan: uang(3),
        maksRasioAngsuranPersen: uang(30),
        maksHariTunggakan: 30,
        periodeTunggakanBulan: 12,
        batasDendaPersen: uang(10),
        hariPengingatSebelumJatuhTempo: 3,
        batasHariTerlambatKritis: 30,
        namaInstansi: "BuyaLater",
        deskripsiFooter: "BuyaLater adalah layanan simpan pinjam online yang membantu anggota menabung dan meminjam dengan mudah, aman, dan transparan.",
        emailCs: "halo@buyalater.id",
        teleponCs: "(021) 1234-5678",
        whatsappCs: "0812-3456-7890",
        alamatPusat: "Jl. Merdeka No. 45, Kota Contoh",
      },
    });

    const hariIni = Date.now();
    await tx.banner.createMany({
      data: [
        { id: "seed-banner-01", judul: "Pinjaman Mudah, Cicilan Ringan", subjudul: "Ajukan pinjaman online dan pantau angsuran langsung dari portal anggota.", gambarUrl: "https://picsum.photos/seed/buyalater-banner-01/1600/600", linkTujuan: "/simulasi-pinjaman", teksTombol: "Coba Simulasi", posisi: "HERO", urutan: 1, isAktif: true, tanggalMulai: new Date(hariIni - 30 * HARI_MS), tanggalSelesai: new Date(hariIni + 60 * HARI_MS) },
        { id: "seed-banner-02", judul: "Gabung Jadi Anggota BuyaLater", subjudul: "Daftar gratis, verifikasi cepat, mulai menabung hari ini.", gambarUrl: "https://picsum.photos/seed/buyalater-banner-02/1600/600", linkTujuan: "/register", teksTombol: "Daftar Sekarang", posisi: "HERO", urutan: 2, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-03", judul: "Promo Akhir Tahun (contoh berakhir)", subjudul: "Banner ini sudah lewat masa tayang sehingga tidak muncul di situs.", gambarUrl: "https://picsum.photos/seed/buyalater-banner-03/1600/600", linkTujuan: "/layanan/pinjaman", teksTombol: "Lihat Promo", posisi: "HERO", urutan: 3, isAktif: true, tanggalMulai: new Date(hariIni - 90 * HARI_MS), tanggalSelesai: new Date(hariIni - 10 * HARI_MS) },
        { id: "seed-banner-10", judul: "Promo Anggota Baru", subjudul: "Bunga spesial mulai 0,8% per bulan untuk pinjaman pertama Anda.", gambarUrl: "https://picsum.photos/seed/buyalater-promo-1/800/500", linkTujuan: "/register", teksTombol: "Daftar Sekarang", posisi: "FOOTER", urutan: 1, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-11", judul: "Pinjaman Pendidikan", subjudul: "Tahun ajaran baru? Siapkan biaya sekolah dengan cicilan ringan.", gambarUrl: "https://picsum.photos/seed/buyalater-promo-2/800/500", linkTujuan: "/layanan/pinjaman", teksTombol: "Lihat Detail", posisi: "FOOTER", urutan: 2, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-12", judul: "Rajin Menabung, Untung Berlipat", subjudul: "Simpanan sukarela dengan bagi hasil kompetitif setiap akhir tahun.", gambarUrl: "https://picsum.photos/seed/buyalater-promo-3/800/500", linkTujuan: "/layanan/simpanan", teksTombol: "Mulai Menabung", posisi: "FOOTER", urutan: 3, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-13", judul: "Hitung Dulu, Baru Pinjam", subjudul: "Coba simulasi cicilan dan temukan tenor yang paling pas.", gambarUrl: "https://picsum.photos/seed/buyalater-promo-4/800/500", linkTujuan: "/simulasi-pinjaman", teksTombol: "Coba Simulasi", posisi: "FOOTER", urutan: 4, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-20", judul: "Simulasikan cicilan Anda", subjudul: "Cek tenor yang paling pas sebelum mengajukan pinjaman.", gambarUrl: "https://picsum.photos/seed/buyalater-side-1/300/300", linkTujuan: "/simulasi-pinjaman", teksTombol: "Coba Simulasi", posisi: "SIDEBAR", urutan: 1, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
        { id: "seed-banner-21", judul: "Ajak teman bergabung", subjudul: "Semakin banyak anggota, semakin kuat koperasi kita.", gambarUrl: "https://picsum.photos/seed/buyalater-side-2/300/300", linkTujuan: "/register", teksTombol: "Bagikan", posisi: "SIDEBAR", urutan: 2, isAktif: true, tanggalMulai: null, tanggalSelesai: null },
      ],
    });
    await tx.testimoni.createMany({
      data: [
        ["Siti Rahmawati", "Pemilik Warung Makan", 5, "Modal dari BuyaLater bikin warung saya bisa tambah etalase. Cicilannya ringan dan admin-nya ramah."],
        ["Andi Pratama", "Karyawan Swasta", 5, "Pengingat jatuh temponya membantu banget, saya jadi nggak pernah telat bayar."],
        ["Dewi Lestari", "Guru Honorer", 5, "Pinjaman pendidikan untuk kuliah adik saya cair dalam sehari. Terima kasih BuyaLater!"],
        ["Budi Santoso", "Pengrajin Mebel", 5, "Semua biayanya jelas dari awal, tidak ada potongan mendadak."],
        ["Rina Marlina", "Ibu Rumah Tangga", 5, "Simpanan sukarela di sini bikin saya lebih rajin menabung."],
        ["Fajar Nugroho", "Mahasiswa", 4, "Daftarnya gampang, tampilannya juga mudah dipahami."],
      ].map(([nama, pekerjaan, rating, isi], index) => ({ id: `seed-testimoni-${index + 1}`, nama: String(nama), pekerjaan: String(pekerjaan), kota: null, fotoUrl: `https://i.pravatar.cc/150?img=${[5, 12, 47, 33, 45, 14][index]}`, isi: String(isi), rating: Number(rating), isTampil: true })),
    });
    await tx.mitra.createMany({
      data: [
        { nama: "Arunika Bank", berkas: "arunika-bank", kategori: "Bank Penyalur Dana", tahun: 2022, deskripsi: "Mitra perbankan untuk pencairan dana dan penyimpanan simpanan anggota.", tingkat: "STRATEGIS", unggulan: true, warna: "#F97316", wakil: "Ratna Kusumawardani", jabatan: "Kepala Divisi Kemitraan", kutipan: "Kami percaya BuyaLater menghadirkan akses keuangan yang sehat dan bertanggung jawab bagi masyarakat. Kolaborasi ini adalah wujud komitmen kami untuk tumbuh bersama UMKM." },
        { nama: "PayNara", berkas: "paynara", kategori: "Pembayaran Digital", tahun: 2023, deskripsi: "Memudahkan anggota membayar angsuran melalui transfer dan dompet digital.", tingkat: "STRATEGIS", unggulan: false, warna: "#7C3AED", wakil: "Dimas Prakoso", jabatan: "Head of Partnership", kutipan: "Pembayaran angsuran jadi semudah satu ketukan bagi seluruh anggota BuyaLater." },
        { nama: "Teduh Proteksi", berkas: "teduh-proteksi", kategori: "Asuransi Pinjaman", tahun: 2023, deskripsi: "Melindungi pinjaman anggota dari risiko tak terduga.", tingkat: "STRATEGIS", unggulan: false, warna: "#0D9488", wakil: "Sekar Wulandari", jabatan: "Manajer Produk", kutipan: "Perlindungan yang tepat membuat anggota meminjam dengan lebih tenang." },
        { nama: "UMKM Maju Bersama", berkas: "umkm-maju-bersama", kategori: "Komunitas Usaha", tahun: 2024, deskripsi: "Wadah pembinaan dan pendampingan usaha kecil anggota BuyaLater.", tingkat: "PENDUKUNG", unggulan: false, warna: "#DC2626", wakil: "Bambang Hermawan", jabatan: "Ketua Komunitas", kutipan: "Bersama BuyaLater, pelaku usaha kecil mendapat modal sekaligus pendampingan." },
        { nama: "Cendekia Edu", berkas: "cendekia-edu", kategori: "Mitra Pendidikan", tahun: 2024, deskripsi: "Mitra penyaluran pinjaman pendidikan untuk pelajar dan mahasiswa.", tingkat: "PENDUKUNG", unggulan: false, warna: "#2563EB", wakil: "Laras Setyaningsih", jabatan: "Direktur Program", kutipan: "Akses biaya pendidikan yang terjangkau membuka lebih banyak kesempatan belajar." },
        { nama: "Perisai Data", berkas: "perisai-data", kategori: "Keamanan Siber", tahun: 2025, deskripsi: "Menjaga keamanan data dan transaksi anggota.", tingkat: "PENDUKUNG", unggulan: false, warna: "#1A2A6C", wakil: "Yoga Aditama", jabatan: "Kepala Keamanan Informasi", kutipan: "Keamanan data anggota adalah prioritas yang kami jaga bersama setiap hari." },
      ].map((m, index) => ({ id: `seed-mitra-${index + 1}`, nama: m.nama, logoUrl: `/images/mitra/${m.berkas}.svg`, website: null, kategori: m.kategori, deskripsi: m.deskripsi, tahunBermitra: m.tahun, urutan: index + 1, tingkat: m.tingkat as "STRATEGIS" | "PENDUKUNG", isUnggulan: m.unggulan, kutipan: m.kutipan, namaPerwakilan: m.wakil, jabatanPerwakilan: m.jabatan, warnaBrand: m.warna })),
    });
    await tx.penghargaan.createMany({
      data: [
        ["Koperasi Digital Terbaik 2025", "Forum Koperasi Nusantara", 2025, "Penghargaan untuk koperasi dengan layanan digital paling inovatif.", "trophy"],
        ["Layanan Anggota Terfavorit 2025", "Komunitas Fintech Rakyat", 2025, "Dipilih langsung oleh anggota berdasarkan kepuasan layanan.", "award"],
        ["Inovasi Simpan Pinjam 2024", "Ekspo Ekonomi Kreatif", 2024, "Pengakuan atas inovasi pengajuan dan pembayaran pinjaman online.", "medal"],
        ["Zero Data Breach 3 Tahun Berturut-turut", "Audit Internal Perisai Data", 2025, "Tidak ada insiden kebocoran data selama tiga tahun berturut-turut.", "medal"],
      ].map(([judul, pemberi, tahun, deskripsi, ikon], index) => ({ id: `seed-penghargaan-${index + 1}`, judul: String(judul), pemberi: String(pemberi), tahun: Number(tahun), deskripsi: String(deskripsi), ikon: String(ikon), urutan: index + 1 })),
    });
    await tx.kantorCabang.createMany({
      data: [
        { id: "seed-kantor-1", nama: "Kantor Pusat BuyaLater", alamat: "Jl. Merdeka No. 45", kota: "Kota Contoh", telepon: "(021) 1234-5678", jamOperasional: "Senin–Jumat, 08.00–16.00 WIB", latitude: "-6.9217000", longitude: "107.6071000", isPusat: true },
        { id: "seed-kantor-2", nama: "Kantor Cabang Cimahi", alamat: "Jl. Raya Contoh No. 12", kota: "Cimahi", telepon: "(022) 6543-2100", jamOperasional: "Senin–Jumat, 08.00–15.00 WIB", latitude: "-6.8721000", longitude: "107.5425000", isPusat: false },
        { id: "seed-kantor-3", nama: "Kantor Cabang Lembang", alamat: "Jl. Kenanga No. 7", kota: "Lembang", telepon: "(022) 2786-4400", jamOperasional: "Senin–Sabtu, 09.00–14.00 WIB", latitude: "-6.8115000", longitude: "107.6180000", isPusat: false },
      ],
    });
    await tx.mediaSosial.createMany({
      data: [
        { id: "seed-sosial-1", platform: "INSTAGRAM", url: "https://www.instagram.com/buyalater", urutan: 1, isAktif: true },
        { id: "seed-sosial-2", platform: "FACEBOOK", url: "https://www.facebook.com/buyalater", urutan: 2, isAktif: true },
        { id: "seed-sosial-3", platform: "WHATSAPP", url: "https://wa.me/6281234567890", urutan: 3, isAktif: true },
        { id: "seed-sosial-4", platform: "YOUTUBE", url: "https://www.youtube.com/", urutan: 4, isAktif: true },
        { id: "seed-sosial-5", platform: "TIKTOK", url: "https://www.tiktok.com/", urutan: 5, isAktif: false },
      ],
    });
    await tx.menuFooter.createMany({
      data: [
        ["LAYANAN", "Simpanan", "/layanan/simpanan"], ["LAYANAN", "Pinjaman", "/layanan/pinjaman"], ["LAYANAN", "Simulasi Cicilan", "/simulasi-pinjaman"], ["LAYANAN", "Galeri", "/galeri"],
        ["PERUSAHAAN", "Tentang Kami", "/tentang"], ["PERUSAHAAN", "Mitra", "/mitra"], ["PERUSAHAAN", "Kantor Cabang", "/kantor-cabang"], ["PERUSAHAAN", "Berita", "/berita"],
        ["BANTUAN", "FAQ", "/faq"], ["BANTUAN", "Hubungi Kami", "/kontak"], ["BANTUAN", "Keamanan", "/keamanan"], ["BANTUAN", "Syarat & Ketentuan", "/syarat-ketentuan"], ["BANTUAN", "Kebijakan Privasi", "/kebijakan-privasi"],
      ].map(([kolom, label, href], index) => ({ id: `seed-menu-${index + 1}`, kolom: kolom as "LAYANAN" | "PERUSAHAAN" | "BANTUAN", label, href, urutan: index + 1 })),
    });
    await tx.metodePembayaran.createMany({
      data: [["Transfer Bank", "bank"], ["Virtual Account", "credit-card"], ["Dompet Digital", "wallet"], ["Tunai di Kantor", "banknote"]].map(([nama, ikon], index) => ({ id: `seed-metode-${index + 1}`, nama, ikon, urutan: index + 1 })),
    });
    await tx.pencapaian.createMany({
      data: [
        [2022, "Berdiri", "Koperasi dirintis dengan 25 anggota pertama.", "flag"],
        [2023, "Tumbuh", "Anggota mencapai 500 orang.", "users"],
        [2024, "Go Digital", "Meluncurkan platform online BuyaLater.", "smartphone"],
        [2025, "Berkembang", "Dana tersalurkan menembus Rp 5 miliar.", "trending"],
        [2026, "Terus Melayani", "Menghadirkan fitur pengingat dan pembayaran online.", "bell"],
      ].map(([tahun, judul, deskripsi, ikon], index) => ({ id: `seed-pencapaian-${index + 1}`, tahun: Number(tahun), judul: String(judul), deskripsi: String(deskripsi), ikon: String(ikon) })),
    });
    await tx.keunggulan.createMany({
      data: [
        ["Proses Cepat", "Pengajuan online dalam hitungan menit, dana cair maksimal 1x24 jam setelah disetujui.", "zap"],
        ["Bunga Ringan & Transparan", "Semua biaya ditampilkan di awal. Yang Anda lihat di simulasi, itu yang Anda bayar.", "percent"],
        ["Tenor Fleksibel", "Pilih jangka waktu 3 hingga 24 bulan sesuai kemampuan Anda.", "calendar-range"],
        ["Aman & Terlindungi", "Data pribadi Anda dienkripsi dan tidak pernah dibagikan ke pihak lain.", "shield"],
        ["Pengingat Otomatis", "Notifikasi sebelum jatuh tempo agar Anda tidak pernah telat bayar.", "bell"],
        ["Semangat Kekeluargaan", "Kami bukan sekadar pemberi pinjaman, kami tumbuh bersama anggota.", "heart-handshake"],
      ].map(([judul, deskripsi, ikon], index) => ({ id: `seed-keunggulan-${index + 1}`, judul, deskripsi, ikon, urutan: index + 1 })),
    });

    // Buku mutasi: dibangun dari data transaksi di atas, urut waktu per anggota, saldoSetelah = saldo simpanan berjalan.
    type Peristiwa = { tanggal: Date; jenis: JenisMutasi; arah: ArahMutasi; jumlah: Prisma.Decimal; referensiId: string; keterangan: string };
    const peristiwaPerAnggota = new Map<string, Peristiwa[]>();
    const tambahPeristiwa = (anggotaId: string, p: Peristiwa) => peristiwaPerAnggota.set(anggotaId, [...(peristiwaPerAnggota.get(anggotaId) ?? []), p]);
    for (const item of simpanan) tambahPeristiwa(item.anggotaId, { tanggal: item.tanggal, jenis: "SIMPANAN", arah: "MASUK", jumlah: item.jumlah, referensiId: item.id, keterangan: item.keterangan });
    for (const item of pencairan) {
      const pj = pinjaman.find((x) => x.id === item.pinjamanId)!;
      tambahPeristiwa(pj.anggotaId, { tanggal: item.tanggalPencairan, jenis: "PENCAIRAN", arah: "KELUAR", jumlah: item.jumlahDicairkan, referensiId: item.id, keterangan: "Pencairan pinjaman" });
    }
    for (const item of angsuran) {
      if (item.status !== "LUNAS") continue;
      const pj = pinjaman.find((x) => x.id === item.pinjamanId)!;
      tambahPeristiwa(pj.anggotaId, { tanggal: item.tanggalBayar!, jenis: "ANGSURAN", arah: "MASUK", jumlah: item.jumlah, referensiId: item.id, keterangan: `Angsuran ke-${item.angsuranKe}` });
    }
    for (const item of simpananShu) tambahPeristiwa(item.anggotaId, { tanggal: item.tanggal, jenis: "SIMPANAN", arah: "MASUK", jumlah: item.jumlah, referensiId: item.id, keterangan: item.keterangan });
    if (sebagian.denda.gt(0)) tambahPeristiwa("seed-anggota-007", { tanggal: new Date(Date.now() - HARI_MS), jenis: "DENDA", arah: "MASUK", jumlah: sebagian.denda, referensiId: "seed-pembayaran-sebagian", keterangan: "Denda angsuran ke-7 (transfer)" });
    tambahPeristiwa("seed-anggota-007", { tanggal: new Date(Date.now() - HARI_MS), jenis: "ANGSURAN", arah: "MASUK", jumlah: sebagian.pokok, referensiId: "seed-pembayaran-sebagian", keterangan: "Angsuran ke-7 (transfer, sebagian)" });
    const barisMutasi = [];
    for (const [anggotaId, daftar] of peristiwaPerAnggota) {
      let saldo = new Prisma.Decimal(0);
      daftar.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
      for (const [urutan, p] of daftar.entries()) {
        if (p.jenis === "SIMPANAN") saldo = saldo.plus(p.jumlah);
        barisMutasi.push({ id: `seed-mutasi-${anggotaId.slice(-3)}-${String(urutan + 1).padStart(3, "0")}`, anggotaId, jenis: p.jenis, arah: p.arah, jumlah: p.jumlah, saldoSetelah: saldo, referensiId: p.referensiId, keterangan: p.keterangan, createdAt: p.tanggal });
      }
    }
    await tx.mutasi.createMany({ data: barisMutasi });

    // Contoh jejak audit agar halaman /admin/audit-log tidak kosong.
    await tx.auditLog.createMany({
      data: pencairan.slice(0, 3).flatMap((c, i) => [
        { userId: "seed-user-manajer", aksi: "UPDATE", entitas: "Pinjaman", entitasId: c.pinjamanId, dataLama: { status: "DIAJUKAN" }, dataBaru: { status: "DISETUJUI", disetujuiOlehId: "seed-user-manajer" }, ipAddress: "127.0.0.1", createdAt: new Date(Date.now() - (i + 2) * HARI_MS) },
        { userId: "seed-user-manajer", aksi: "CREATE", entitas: "Pencairan", entitasId: c.id, dataLama: Prisma.JsonNull, dataBaru: { jumlahDicairkan: c.jumlahDicairkan.toString(), biayaAdmin: c.biayaAdmin.toString() }, ipAddress: "127.0.0.1", createdAt: new Date(Date.now() - (i + 1) * HARI_MS) },
      ]),
    });

    const kemarin = new Date(Date.now() - HARI_MS);
    await tx.notifikasi.createMany({
      data: [
        { id: "seed-notifikasi-01", userId: "seed-user-anggota-002", tipe: "TERLAMBAT", judul: "Angsuran ke-2 terlambat 40 hari", pesan: "Denda berjalan sudah dihitung otomatis. Segera lakukan pembayaran.", link: "/anggota/pinjaman/seed-pinjaman-02", angsuranId: "seed-angsuran-02-02", emailStatus: "TIDAK_DIKONFIGURASI", createdAt: kemarin },
        { id: "seed-notifikasi-02", userId: "seed-user-anggota-007", tipe: "TERLAMBAT", judul: "Angsuran ke-7 terlambat 5 hari", pesan: "Denda berjalan sudah dihitung otomatis. Segera lakukan pembayaran.", link: "/anggota/pinjaman/seed-pinjaman-07", angsuranId: "seed-angsuran-07-07", emailStatus: "TIDAK_DIKONFIGURASI", createdAt: kemarin },
        { id: "seed-notifikasi-03", userId: "seed-user-anggota-011", tipe: "PENGINGAT", judul: "Angsuran ke-5 segera jatuh tempo", pesan: "Jatuh tempo dalam 3 hari. Segera lakukan pembayaran.", link: "/anggota/pinjaman/seed-pinjaman-11", angsuranId: "seed-angsuran-11-05", emailStatus: "TIDAK_DIKONFIGURASI", createdAt: kemarin },
        { id: "seed-notifikasi-04", userId: "seed-user-anggota-001", tipe: "INFO", judul: "Selamat datang di BuyaLater", pesan: "Akun kamu sudah aktif. Lengkapi profil dan rekening bank untuk mulai mengajukan pinjaman.", link: "/anggota/profil", sudahDibaca: true, createdAt: kemarin },
      ],
    });
  });

  console.log("Seed BuyaLater berhasil dibuat.");
  console.log("Admin: admin@buyalatter.com / admin123");
  console.log("Manajer: manajer@buyalatter.com / manajer123");
  console.log("Teller: teller@buyalatter.com / teller123");
  console.log("Anggota: 15 akun / password anggota123");
}

main()
  .catch((error) => {
    console.error("Seed BuyaLater gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });