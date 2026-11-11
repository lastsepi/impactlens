/*
  Warnings:

  - A unique constraint covering the columns `[storageKey]` on the table `SourceFile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SourceFile" ADD COLUMN     "storageKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SourceFile_storageKey_key" ON "SourceFile"("storageKey");
