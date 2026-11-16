-- AlterTable
ALTER TABLE "AiBudgetReservation" ADD COLUMN     "localizationId" TEXT;

-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "localizationId" TEXT;

-- CreateTable
CREATE TABLE "ProductLocalization" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketResultId" TEXT NOT NULL,
    "cacheKey" TEXT,
    "status" "ResearchStatus" NOT NULL DEFAULT 'PENDING',
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "localizedTitle" TEXT,
    "localizedDescription" TEXT,
    "culturalGuidance" TEXT[],
    "seoKeywords" TEXT[],
    "marketingMessages" JSONB,
    "faqs" JSONB,
    "modelUsed" TEXT,
    "promptVersion" TEXT NOT NULL,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocalization_cacheKey_key" ON "ProductLocalization"("cacheKey");

-- CreateIndex
CREATE INDEX "ProductLocalization_productId_idx" ON "ProductLocalization"("productId");

-- CreateIndex
CREATE INDEX "ProductLocalization_marketResultId_idx" ON "ProductLocalization"("marketResultId");

-- CreateIndex
CREATE INDEX "ProductLocalization_status_idx" ON "ProductLocalization"("status");

-- CreateIndex
CREATE INDEX "ProductLocalization_createdAt_idx" ON "ProductLocalization"("createdAt");

-- CreateIndex
CREATE INDEX "AiBudgetReservation_localizationId_idx" ON "AiBudgetReservation"("localizationId");

-- CreateIndex
CREATE INDEX "AiUsage_localizationId_idx" ON "AiUsage"("localizationId");

-- AddForeignKey
ALTER TABLE "ProductLocalization" ADD CONSTRAINT "ProductLocalization_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocalization" ADD CONSTRAINT "ProductLocalization_marketResultId_fkey" FOREIGN KEY ("marketResultId") REFERENCES "MarketResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_localizationId_fkey" FOREIGN KEY ("localizationId") REFERENCES "ProductLocalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBudgetReservation" ADD CONSTRAINT "AiBudgetReservation_localizationId_fkey" FOREIGN KEY ("localizationId") REFERENCES "ProductLocalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
