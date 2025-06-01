/*
  Warnings:

  - You are about to alter the column `revenueTarget` on the `monthlykpi` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE `monthlykpi` MODIFY `revenueTarget` DECIMAL(15, 2) NULL;
