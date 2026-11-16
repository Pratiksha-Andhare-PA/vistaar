/*
  Warnings:

  - A unique constraint covering the columns `[cacheKey]` on the table `MarketResearch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MarketResearch" ADD COLUMN     "cacheKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MarketResearch_cacheKey_key" ON "MarketResearch"("cacheKey");
