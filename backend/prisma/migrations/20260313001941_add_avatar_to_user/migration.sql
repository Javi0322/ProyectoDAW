-- Migration applied directly to DB; reconstructed for local history
ALTER TABLE `user` ADD COLUMN `avatarUrl` VARCHAR(191) NULL;
