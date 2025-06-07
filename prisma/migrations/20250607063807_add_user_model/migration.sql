/*
  Warnings:

  - You are about to drop the column `managedById` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_managedById_fkey`;

-- DropIndex
DROP INDEX `User_managedById_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `managedById`;
