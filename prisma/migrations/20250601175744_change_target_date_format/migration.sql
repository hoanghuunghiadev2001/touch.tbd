/*
  Warnings:

  - You are about to drop the column `revenueTarget` on the `dailykpi` table. All the data in the column will be lost.
  - You are about to drop the column `tripTarget` on the `dailykpi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `dailykpi` DROP COLUMN `revenueTarget`,
    DROP COLUMN `tripTarget`;
