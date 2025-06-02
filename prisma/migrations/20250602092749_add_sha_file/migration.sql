/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `ImportedFile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ImportedFile_fileHash_key` ON `ImportedFile`(`fileHash`);
