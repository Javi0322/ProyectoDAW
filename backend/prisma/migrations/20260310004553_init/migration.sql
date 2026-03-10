-- CreateTable
CREATE TABLE `ConversationUserState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lastReadAt` DATETIME(3) NULL,

    INDEX `ConversationUserState_userId_idx`(`userId`),
    UNIQUE INDEX `ConversationUserState_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Conversation_lastMessageAt_idx` ON `Conversation`(`lastMessageAt`);

-- AddForeignKey
ALTER TABLE `ConversationUserState` ADD CONSTRAINT `ConversationUserState_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationUserState` ADD CONSTRAINT `ConversationUserState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
