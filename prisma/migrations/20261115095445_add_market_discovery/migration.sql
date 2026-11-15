-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "MarketResearch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "ResearchStatus" NOT NULL DEFAULT 'PENDING',
    "requestedCountries" TEXT[],
    "summary" TEXT,
    "recommendedCountry" TEXT,
    "recommendationReason" TEXT,
    "modelUsed" TEXT,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketResult" (
    "id" TEXT NOT NULL,
    "researchId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "competitionLevel" TEXT NOT NULL,
    "targetCustomers" TEXT NOT NULL,
    "marketRationale" TEXT NOT NULL,
    "opportunities" TEXT[],
    "risks" TEXT[],
    "culturalConsiderations" TEXT[],
    "suggestedPriceMin" DECIMAL(12,2),
    "suggestedPriceMax" DECIMAL(12,2),
    "suggestedCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEvidence" (
    "id" TEXT NOT NULL,
    "marketResultId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "url" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "sourceType" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketResearch_productId_idx" ON "MarketResearch"("productId");

-- CreateIndex
CREATE INDEX "MarketResearch_status_idx" ON "MarketResearch"("status");

-- CreateIndex
CREATE INDEX "MarketResearch_createdAt_idx" ON "MarketResearch"("createdAt");

-- CreateIndex
CREATE INDEX "MarketResult_researchId_idx" ON "MarketResult"("researchId");

-- CreateIndex
CREATE INDEX "MarketResult_opportunityScore_idx" ON "MarketResult"("opportunityScore");

-- CreateIndex
CREATE UNIQUE INDEX "MarketResult_researchId_countryCode_key" ON "MarketResult"("researchId", "countryCode");

-- CreateIndex
CREATE INDEX "MarketEvidence_marketResultId_idx" ON "MarketEvidence"("marketResultId");

-- AddForeignKey
ALTER TABLE "MarketResearch" ADD CONSTRAINT "MarketResearch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketResult" ADD CONSTRAINT "MarketResult_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "MarketResearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvidence" ADD CONSTRAINT "MarketEvidence_marketResultId_fkey" FOREIGN KEY ("marketResultId") REFERENCES "MarketResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
