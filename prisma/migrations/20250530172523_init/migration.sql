/*
  Warnings:

  - Added the required column `name_month_year` to the `KPI` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `kpi` ADD COLUMN `name_month_year` VARCHAR(191) NOT NULL;
