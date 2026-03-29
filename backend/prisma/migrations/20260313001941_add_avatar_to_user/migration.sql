-- Migration applied directly to DB; reconstructed for local history
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(191) NULL;
