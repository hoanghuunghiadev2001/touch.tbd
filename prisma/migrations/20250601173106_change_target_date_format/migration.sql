/*
  Warnings:

  - You are about to drop the `target` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `target` DROP FOREIGN KEY `Target_employeeId_fkey`;

-- DropTable
DROP TABLE `target`;

-- CreateTable
CREATE TABLE `MonthlyKPI` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `tripTarget` INTEGER NULL,
    `revenueTarget` INTEGER NULL,
    `amount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthlyKPI_employeeId_year_month_key`(`employeeId`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyKPI` (
    `id` VARCHAR(191) NOT NULL,
    `monthlyKPIId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `jobCode` VARCHAR(191) NULL,
    `ticketCode` VARCHAR(191) NULL,
    `tripTarget` INTEGER NULL,
    `revenueTarget` INTEGER NULL,
    `amount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyKPI` ADD CONSTRAINT `MonthlyKPI_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyKPI` ADD CONSTRAINT `DailyKPI_monthlyKPIId_fkey` FOREIGN KEY (`monthlyKPIId`) REFERENCES `MonthlyKPI`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
