-- Tahap 9D: pelanggan newsletter. Diterapkan manual (prisma migrate gagal di XAMPP MariaDB):
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root buyalatter_db < prisma/sql/9d-subscriber.sql
CREATE TABLE `Subscriber` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Subscriber_email_key`(`email`),
  INDEX `Subscriber_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
