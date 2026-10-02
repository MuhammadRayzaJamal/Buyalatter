-- Tahap 9E: detail mitra (kategori, deskripsi, tahun bermitra).
-- Diterapkan manual karena `prisma migrate dev` gagal di XAMPP MariaDB (error mysql.proc):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/9e-mitra-detail.sql
ALTER TABLE `Mitra`
  ADD COLUMN `kategori` VARCHAR(191) NULL,
  ADD COLUMN `deskripsi` TEXT NULL,
  ADD COLUMN `tahunBermitra` INT NULL;
