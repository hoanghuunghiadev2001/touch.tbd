/*
  Warnings:

  - You are about to alter the column `amount` on the `dailykpi` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE `dailykpi` MODIFY `amount` DECIMAL(15, 2) NULL;
