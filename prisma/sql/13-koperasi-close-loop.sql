-- Tahap 13: koperasi close loop (Permenkop UKM 8/2023, prinsip POJK 22/2023).
-- Diterapkan manual (XAMPP/MariaDB):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/13-koperasi-close-loop.sql
-- lalu: npx prisma generate

-- Bunga pinjaman kini disimpan PER TAHUN. Data lama (bunga flat per bulan) dikonversi: 1,5%/bulan -> 18%/tahun.
ALTER TABLE `Pinjaman`
  ADD COLUMN `metodeBunga` ENUM('FLAT','MENURUN','ANUITAS') NOT NULL DEFAULT 'FLAT',
  ADD COLUMN `biayaAdmin` DECIMAL(15,2) NOT NULL DEFAULT 0.00;
UPDATE `Pinjaman` p LEFT JOIN `Pencairan` c ON c.`pinjamanId` = p.`id`
  SET p.`bungaPersen` = p.`bungaPersen` * 12, p.`biayaAdmin` = COALESCE(c.`biayaAdmin`, 0);

-- Pengaturan: bunga per tahun, metode, biaya admin, denda baru, masa tenggang, template pengingat.
ALTER TABLE `Pengaturan`
  ADD COLUMN `bungaPinjamanPerTahun` DECIMAL(5,2) NOT NULL DEFAULT 12.00,
  ADD COLUMN `bungaSimpananPerTahun` DECIMAL(5,2) NOT NULL DEFAULT 4.00,
  ADD COLUMN `metodeBunga` ENUM('FLAT','MENURUN','ANUITAS') NOT NULL DEFAULT 'ANUITAS',
  ADD COLUMN `biayaAdminPersen` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN `masaTenggangHari` INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN `templatePengingat` TEXT NULL;
ALTER TABLE `Pengaturan` MODIFY `dendaPersenPerHari` DECIMAL(5,2) NOT NULL DEFAULT 0.05;
UPDATE `Pengaturan` SET `dendaPersenPerHari` = 0.05;
ALTER TABLE `Pengaturan` DROP COLUMN `bungaDefault`;

ALTER TABLE `Anggota` ADD COLUMN `ditutupPada` DATETIME(3) NULL;
ALTER TABLE `BerkasPrivat` MODIFY `kategori` ENUM('KTP','SWAFOTO','BUKTI_TRANSFER','BUKTI_BAYAR','PENGADUAN') NOT NULL;

CREATE TABLE `HariLibur` (
  `id` VARCHAR(191) NOT NULL,
  `tanggal` DATE NOT NULL,
  `keterangan` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `HariLibur_tanggal_key` (`tanggal`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LogPenagihan` (
  `id` VARCHAR(191) NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `angsuranId` VARCHAR(191) NULL,
  `saluran` ENUM('NOTIFIKASI','EMAIL','WHATSAPP','TELEPON') NOT NULL,
  `isiPesan` TEXT NOT NULL,
  `dikirimOlehId` VARCHAR(191) NULL,
  `waktuKirim` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `LogPenagihan_anggotaId_waktuKirim_idx` (`anggotaId`, `waktuKirim`),
  INDEX `LogPenagihan_waktuKirim_idx` (`waktuKirim`),
  PRIMARY KEY (`id`),
  CONSTRAINT `LogPenagihan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `LogPenagihan_dikirimOlehId_fkey` FOREIGN KEY (`dikirimOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PersetujuanData` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `jenis` ENUM('VERIFIKASI_IDENTITAS','PENILAIAN_KELAYAKAN','PENGIRIMAN_PENGINGAT') NOT NULL,
  `disetujui` BOOLEAN NOT NULL,
  `versiKebijakan` VARCHAR(191) NOT NULL,
  `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(191) NULL,
  INDEX `PersetujuanData_userId_jenis_idx` (`userId`, `jenis`),
  PRIMARY KEY (`id`),
  CONSTRAINT `PersetujuanData_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Pengaduan` (
  `id` VARCHAR(191) NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `pinjamanId` VARCHAR(191) NULL,
  `nomorTiket` VARCHAR(191) NOT NULL,
  `kategori` ENUM('PINJAMAN','PENAGIHAN','SIMPANAN','LAYANAN','DATA') NOT NULL,
  `isi` TEXT NOT NULL,
  `lampiranPath` VARCHAR(191) NULL,
  `status` ENUM('DITERIMA','DIPROSES','SELESAI') NOT NULL DEFAULT 'DITERIMA',
  `tanggapan` TEXT NULL,
  `ditanganiOlehId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `selesaiAt` DATETIME(3) NULL,
  UNIQUE INDEX `Pengaduan_nomorTiket_key` (`nomorTiket`),
  INDEX `Pengaduan_anggotaId_createdAt_idx` (`anggotaId`, `createdAt`),
  INDEX `Pengaduan_status_createdAt_idx` (`status`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Pengaduan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Pengaduan_pinjamanId_fkey` FOREIGN KEY (`pinjamanId`) REFERENCES `Pinjaman`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Pengaduan_ditanganiOlehId_fkey` FOREIGN KEY (`ditanganiOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
