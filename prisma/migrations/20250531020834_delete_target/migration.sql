/*
  Warnings:

  - You are about to drop the `performance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `performance` DROP FOREIGN KEY `Performance_employeeId_fkey`;

-- AlterTable
ALTER TABLE `target` ADD COLUMN `actualRevenue` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `actualTrips` INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `performance`;
