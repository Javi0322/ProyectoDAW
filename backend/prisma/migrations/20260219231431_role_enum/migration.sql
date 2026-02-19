-- CreateTable
CREATE TABLE `Conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'PENDING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `assignedToId` INTEGER NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `lastMessageText` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Conversation_externalId_key`(`externalId`),
    INDEX `Conversation_status_idx`(`status`),
    INDEX `Conversation_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(191) NOT NULL,
    `direction` ENUM('IN', 'OUT') NOT NULL,
    `state` ENUM('PENDING', 'SENT', 'RECEIVED', 'READ', 'ERROR', 'DELETED') NOT NULL,
    `text` TEXT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `stateAt` DATETIME(3) NULL,
    `conversationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Message_externalId_key`(`externalId`),
    INDEX `Message_conversationId_occurredAt_idx`(`conversationId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
