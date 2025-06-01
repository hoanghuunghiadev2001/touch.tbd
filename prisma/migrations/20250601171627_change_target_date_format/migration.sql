/*
  Warnings:

  - Added the required column `tripTarget` to the `Target` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `target` ADD COLUMN `tripTarget` VARCHAR(191) NOT NULL;
