-- Tahap 10A: detail mitra, penghargaan, kantor cabang, media sosial, menu footer, metode pembayaran, pengaturan situs.
-- Diterapkan manual karena `prisma migrate dev` gagal di XAMPP MariaDB (error mysql.proc):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/10a-mitra-footer-kantor.sql
ALTER TABLE `Mitra`
  ADD COLUMN `tingkat` ENUM('STRATEGIS','PENDUKUNG') NOT NULL DEFAULT 'PENDUKUNG',
  ADD COLUMN `isUnggulan` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `kutipan` TEXT NULL,
  ADD COLUMN `namaPerwakilan` VARCHAR(191) NULL,
  ADD COLUMN `jabatanPerwakilan` VARCHAR(191) NULL,
  ADD COLUMN `warnaBrand` VARCHAR(191) NULL;

ALTER TABLE `Pengaturan`
  ADD COLUMN `namaInstansi` VARCHAR(191) NOT NULL DEFAULT 'BuyaLater',
  ADD COLUMN `deskripsiFooter` TEXT NULL,
  ADD COLUMN `emailCs` VARCHAR(191) NULL,
  ADD COLUMN `teleponCs` VARCHAR(191) NULL,
  ADD COLUMN `whatsappCs` VARCHAR(191) NULL,
  ADD COLUMN `alamatPusat` VARCHAR(191) NULL;

CREATE TABLE `Penghargaan` (
  `id` VARCHAR(191) NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `pemberi` VARCHAR(191) NOT NULL,
  `tahun` INT NOT NULL,
  `deskripsi` TEXT NULL,
  `ikon` VARCHAR(191) NOT NULL DEFAULT 'award',
  `urutan` INT NOT NULL DEFAULT 0,
  INDEX `Penghargaan_tahun_idx`(`tahun`),
  INDEX `Penghargaan_urutan_idx`(`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `KantorCabang` (
  `id` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `alamat` VARCHAR(191) NOT NULL,
  `kota` VARCHAR(191) NOT NULL,
  `telepon` VARCHAR(191) NULL,
  `jamOperasional` VARCHAR(191) NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `isPusat` BOOLEAN NOT NULL DEFAULT false,
  INDEX `KantorCabang_isPusat_idx`(`isPusat`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MediaSosial` (
  `id` VARCHAR(191) NOT NULL,
  `platform` ENUM('INSTAGRAM','FACEBOOK','YOUTUBE','TIKTOK','WHATSAPP') NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  `isAktif` BOOLEAN NOT NULL DEFAULT true,
  INDEX `MediaSosial_isAktif_urutan_idx`(`isAktif`,`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MenuFooter` (
  `id` VARCHAR(191) NOT NULL,
  `kolom` ENUM('LAYANAN','PERUSAHAAN','BANTUAN') NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `href` VARCHAR(191) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  INDEX `MenuFooter_kolom_urutan_idx`(`kolom`,`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MetodePembayaran` (
  `id` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `ikon` VARCHAR(191) NOT NULL DEFAULT 'bank',
  `urutan` INT NOT NULL DEFAULT 0,
  INDEX `MetodePembayaran_urutan_idx`(`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
