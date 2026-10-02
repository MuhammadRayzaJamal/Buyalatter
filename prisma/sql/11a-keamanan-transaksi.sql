-- Tahap 11A: keamanan dan keakuratan transaksi.
-- Diterapkan manual karena `prisma migrate dev` gagal di XAMPP MariaDB (error mysql.proc):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/11a-keamanan-transaksi.sql
-- Seluruh kolom nominal sudah DECIMAL(15,2) sejak tahap awal; persentase memakai DECIMAL(5,2).

-- 1. Peran baru
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN','MANAJER','TELLER','ANGGOTA') NOT NULL DEFAULT 'ANGGOTA';

-- 2. Soft delete
ALTER TABLE `Anggota` ADD COLUMN `deletedAt` DATETIME(3) NULL, ADD INDEX `Anggota_deletedAt_idx` (`deletedAt`);
ALTER TABLE `Galeri`  ADD COLUMN `deletedAt` DATETIME(3) NULL, ADD INDEX `Galeri_deletedAt_idx` (`deletedAt`);
ALTER TABLE `Artikel` ADD COLUMN `deletedAt` DATETIME(3) NULL, ADD INDEX `Artikel_deletedAt_idx` (`deletedAt`);
ALTER TABLE `Mitra`   ADD COLUMN `deletedAt` DATETIME(3) NULL, ADD INDEX `Mitra_deletedAt_idx` (`deletedAt`);

-- 3. Pemisahan tugas pinjaman
ALTER TABLE `Pinjaman`
  ADD COLUMN `dibuatOlehId` VARCHAR(191) NULL,
  ADD COLUMN `disetujuiOlehId` VARCHAR(191) NULL,
  ADD CONSTRAINT `Pinjaman_dibuatOlehId_fkey` FOREIGN KEY (`dibuatOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Pinjaman_disetujuiOlehId_fkey` FOREIGN KEY (`disetujuiOlehId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Batas nominal di Pengaturan
ALTER TABLE `Pengaturan`
  ADD COLUMN `batasPencairanManajer` DECIMAL(15,2) NOT NULL DEFAULT 10000000.00,
  ADD COLUMN `minPinjaman` DECIMAL(15,2) NOT NULL DEFAULT 1000000.00,
  ADD COLUMN `maksPinjaman` DECIMAL(15,2) NOT NULL DEFAULT 50000000.00,
  ADD COLUMN `minTransaksi` DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
  ADD COLUMN `maksTransaksi` DECIMAL(15,2) NOT NULL DEFAULT 100000000.00;

-- 5. Buku mutasi (append-only)
CREATE TABLE `Mutasi` (
  `id` VARCHAR(191) NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `jenis` ENUM('SIMPANAN','PENARIKAN','PENCAIRAN','ANGSURAN','DENDA','KOREKSI') NOT NULL,
  `arah` ENUM('MASUK','KELUAR') NOT NULL,
  `jumlah` DECIMAL(15,2) NOT NULL,
  `saldoSetelah` DECIMAL(15,2) NOT NULL,
  `referensiId` VARCHAR(191) NULL,
  `keterangan` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Mutasi_anggotaId_createdAt_idx` (`anggotaId`, `createdAt`),
  INDEX `Mutasi_jenis_idx` (`jenis`),
  INDEX `Mutasi_referensiId_idx` (`referensiId`),
  CONSTRAINT `Mutasi_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Audit log (append-only, tanpa foreign key)
CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `aksi` VARCHAR(191) NOT NULL,
  `entitas` VARCHAR(191) NOT NULL,
  `entitasId` VARCHAR(191) NOT NULL,
  `dataLama` JSON NULL,
  `dataBaru` JSON NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditLog_createdAt_idx` (`createdAt`),
  INDEX `AuditLog_userId_idx` (`userId`),
  INDEX `AuditLog_entitas_entitasId_idx` (`entitas`, `entitasId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Keamanan login
CREATE TABLE `LoginAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `berhasil` BOOLEAN NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `LoginAttempt_email_createdAt_idx` (`email`, `createdAt`),
  INDEX `LoginAttempt_ipAddress_createdAt_idx` (`ipAddress`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordResetToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PasswordResetToken_tokenHash_key` (`tokenHash`),
  INDEX `PasswordResetToken_userId_createdAt_idx` (`userId`, `createdAt`),
  CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. Berkas privat (file di storage/private, dilayani lewat /api/file/[id])
CREATE TABLE `BerkasPrivat` (
  `id` VARCHAR(191) NOT NULL,
  `kategori` ENUM('KTP','SWAFOTO','BUKTI_TRANSFER','BUKTI_BAYAR') NOT NULL,
  `anggotaId` VARCHAR(191) NOT NULL,
  `namaFile` VARCHAR(191) NOT NULL,
  `mime` VARCHAR(191) NOT NULL,
  `ukuran` INTEGER NOT NULL,
  `diunggahOlehId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `BerkasPrivat_anggotaId_kategori_idx` (`anggotaId`, `kategori`),
  CONSTRAINT `BerkasPrivat_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `Anggota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
