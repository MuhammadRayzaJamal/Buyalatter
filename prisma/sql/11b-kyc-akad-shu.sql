-- Tahap 11B: KYC, kelayakan, akad digital, kode unik pembayaran, restrukturisasi, SHU.
-- Diterapkan manual (XAMPP/MariaDB):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/11b-kyc-akad-shu.sql
ALTER TABLE `Pembayaran` MODIFY `status` ENUM('MENUNGGU','DITERIMA','DITOLAK','SEBAGIAN') NOT NULL DEFAULT 'MENUNGGU';

ALTER TABLE `Angsuran`
  ADD COLUMN `kodeUnik` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `terbayar` DECIMAL(15,2) NOT NULL DEFAULT 0.00;
-- Angsuran yang sudah ada diberi kode unik 3 digit (100-999).
UPDATE `Angsuran` SET `kodeUnik` = FLOOR(100 + RAND() * 900) WHERE `kodeUnik` = 0;

ALTER TABLE `Pembayaran`
  ADD COLUMN `kodeUnik` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `jumlahTagihan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `jumlahTransfer` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `kelebihan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `hashBukti` VARCHAR(191) NULL,
  ADD COLUMN `isPelunasan` BOOLEAN NOT NULL DEFAULT false,
  ADD UNIQUE INDEX `Pembayaran_hashBukti_key` (`hashBukti`);

ALTER TABLE `Pengaturan`
  ADD COLUMN `minLamaAnggotaBulan` INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN `plafonKaliSimpanan` DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  ADD COLUMN `maksRasioAngsuranPersen` DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN `maksHariTunggakan` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `periodeTunggakanBulan` INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN `batasDendaPersen` DECIMAL(5,2) NOT NULL DEFAULT 10.00;

CREATE TABLE `VerifikasiAnggota` (
  `id` VARCHAR(191) NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `fotoKtpPath` VARCHAR(191) NOT NULL,
  `swafotoKtpPath` VARCHAR(191) NOT NULL,
  `penghasilanBulanan` DECIMAL(15,2) NOT NULL,
  `pekerjaan` VARCHAR(191) NOT NULL,
  `status` ENUM('MENUNGGU','DITERIMA','DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
  `alasanTolak` VARCHAR(191) NULL,
  `diverifikasiOlehId` VARCHAR(191) NULL,
  `tanggalVerifikasi` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `VerifikasiAnggota_anggotaId_createdAt_idx` (`anggotaId`, `createdAt`),
  INDEX `VerifikasiAnggota_status_idx` (`status`),
  CONSTRAINT `VerifikasiAnggota_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `VerifikasiAnggota_diverifikasiOlehId_fkey` FOREIGN KEY (`diverifikasiOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AkadPinjaman` (
  `id` VARCHAR(191) NOT NULL,
  `pinjamanId` VARCHAR(191) NOT NULL,
  `isiAkad` LONGTEXT NOT NULL,
  `disetujuiPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AkadPinjaman_pinjamanId_key` (`pinjamanId`),
  CONSTRAINT `AkadPinjaman_pinjamanId_fkey` FOREIGN KEY (`pinjamanId`) REFERENCES `Pinjaman`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Restrukturisasi` (
  `id` VARCHAR(191) NOT NULL,
  `pinjamanId` VARCHAR(191) NOT NULL,
  `tenorLama` INTEGER NOT NULL,
  `tenorBaru` INTEGER NOT NULL,
  `alasan` VARCHAR(191) NOT NULL,
  `status` ENUM('DIAJUKAN','DISETUJUI','DITOLAK') NOT NULL DEFAULT 'DIAJUKAN',
  `diprosesOlehId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diprosesPada` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Restrukturisasi_pinjamanId_status_idx` (`pinjamanId`, `status`),
  INDEX `Restrukturisasi_status_idx` (`status`),
  CONSTRAINT `Restrukturisasi_pinjamanId_fkey` FOREIGN KEY (`pinjamanId`) REFERENCES `Pinjaman`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Restrukturisasi_diprosesOlehId_fkey` FOREIGN KEY (`diprosesOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PeriodeShu` (
  `id` VARCHAR(191) NOT NULL,
  `tahun` INTEGER NOT NULL,
  `totalShu` DECIMAL(15,2) NOT NULL,
  `persenJasaModal` DECIMAL(5,2) NOT NULL,
  `persenJasaPinjaman` DECIMAL(5,2) NOT NULL,
  `status` ENUM('DRAFT','DIBAGIKAN') NOT NULL DEFAULT 'DRAFT',
  `dibagikanPada` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PeriodeShu_tahun_key` (`tahun`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ShuAnggota` (
  `id` VARCHAR(191) NOT NULL,
  `periodeId` VARCHAR(191) NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `jasaModal` DECIMAL(15,2) NOT NULL,
  `jasaPinjaman` DECIMAL(15,2) NOT NULL,
  `total` DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ShuAnggota_periodeId_anggotaId_key` (`periodeId`, `anggotaId`),
  INDEX `ShuAnggota_anggotaId_idx` (`anggotaId`),
  CONSTRAINT `ShuAnggota_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodeShu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShuAnggota_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
