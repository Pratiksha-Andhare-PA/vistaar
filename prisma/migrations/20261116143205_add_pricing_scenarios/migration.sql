-- CreateTable
CREATE TABLE "PricingScenario" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketResultId" TEXT NOT NULL,
    "title" TEXT,
    "targetCurrency" TEXT NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "exchangeRateSource" TEXT,
    "exchangeRateDate" TIMESTAMP(3),
    "inputs" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "recommendedPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingScenario_productId_idx" ON "PricingScenario"("productId");

-- CreateIndex
CREATE INDEX "PricingScenario_marketResultId_idx" ON "PricingScenario"("marketResultId");

-- CreateIndex
CREATE INDEX "PricingScenario_createdAt_idx" ON "PricingScenario"("createdAt");

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_marketResultId_fkey" FOREIGN KEY ("marketResultId") REFERENCES "MarketResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
