-- AlterTable
ALTER TABLE `target` MODIFY `revenueTarget` VARCHAR(191) NOT NULL,
    MODIFY `actualRevenue` VARCHAR(191) NOT NULL DEFAULT '0';
