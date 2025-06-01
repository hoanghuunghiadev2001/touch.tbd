/*
  Warnings:

  - You are about to drop the column `month` on the `target` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `target` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,targetDate]` on the table `Target` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `targetDate` to the `Target` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `target` DROP FOREIGN KEY `Target_employeeId_fkey`;

-- DropIndex
DROP INDEX `Target_employeeId_month_year_key` ON `target`;

-- AlterTable
ALTER TABLE `target` DROP COLUMN `month`,
    DROP COLUMN `year`,
    ADD COLUMN `targetDate` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Target_employeeId_targetDate_key` ON `Target`(`employeeId`, `targetDate`);

-- AddForeignKey
ALTER TABLE `Target` ADD CONSTRAINT `Target_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
