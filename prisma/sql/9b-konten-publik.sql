-- Tahap 9B: Banner, Testimoni, Mitra, Pencapaian, Keunggulan.
-- Diterapkan manual karena `prisma migrate` gagal di XAMPP MariaDB (error mysql.proc):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/9b-konten-publik.sql
CREATE TABLE `Banner` (
  `id` VARCHAR(191) NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `subjudul` VARCHAR(191) NULL,
  `gambarUrl` VARCHAR(191) NOT NULL,
  `linkTujuan` VARCHAR(191) NULL,
  `teksTombol` VARCHAR(191) NULL,
  `posisi` ENUM('HERO','FOOTER','SIDEBAR') NOT NULL DEFAULT 'HERO',
  `urutan` INT NOT NULL DEFAULT 0,
  `isAktif` BOOLEAN NOT NULL DEFAULT true,
  `tanggalMulai` DATETIME(3) NULL,
  `tanggalSelesai` DATETIME(3) NULL,
  INDEX `Banner_posisi_isAktif_urutan_idx`(`posisi`,`isAktif`,`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Testimoni` (
  `id` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `pekerjaan` VARCHAR(191) NULL,
  `kota` VARCHAR(191) NULL,
  `fotoUrl` VARCHAR(191) NULL,
  `isi` TEXT NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `isTampil` BOOLEAN NOT NULL DEFAULT true,
  INDEX `Testimoni_isTampil_idx`(`isTampil`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Mitra` (
  `id` VARCHAR(191) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `logoUrl` VARCHAR(191) NOT NULL,
  `website` VARCHAR(191) NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  INDEX `Mitra_urutan_idx`(`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Pencapaian` (
  `id` VARCHAR(191) NOT NULL,
  `tahun` INT NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `ikon` VARCHAR(191) NOT NULL DEFAULT 'trending',
  INDEX `Pencapaian_tahun_idx`(`tahun`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Keunggulan` (
  `id` VARCHAR(191) NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `ikon` VARCHAR(191) NOT NULL DEFAULT 'shield',
  `urutan` INT NOT NULL DEFAULT 0,
  INDEX `Keunggulan_urutan_idx`(`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
