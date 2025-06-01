/*
  Warnings:

  - You are about to drop the column `actualRevenue` on the `target` table. All the data in the column will be lost.
  - You are about to drop the column `actualTrips` on the `target` table. All the data in the column will be lost.
  - You are about to drop the column `tripTarget` on the `target` table. All the data in the column will be lost.
  - Added the required column `jobCode` to the `Target` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketCode` to the `Target` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `target` DROP FOREIGN KEY `Target_employeeId_fkey`;

-- DropIndex
DROP INDEX `Target_employeeId_targetDate_key` ON `target`;

-- AlterTable
ALTER TABLE `target` DROP COLUMN `actualRevenue`,
    DROP COLUMN `actualTrips`,
    DROP COLUMN `tripTarget`,
    ADD COLUMN `jobCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `ticketCode` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Target` ADD CONSTRAINT `Target_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
