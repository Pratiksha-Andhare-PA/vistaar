-- CreateEnum
CREATE TYPE "StorefrontStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Storefront" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "StorefrontStatus" NOT NULL DEFAULT 'DRAFT',
    "productId" TEXT NOT NULL,
    "marketResultId" TEXT NOT NULL,
    "localizationId" TEXT NOT NULL,
    "pricingScenarioId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "localizedTitle" TEXT NOT NULL,
    "localizedDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT NOT NULL,
    "businessCity" TEXT NOT NULL,
    "businessCountry" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "seoKeywords" TEXT[],
    "culturalGuidance" TEXT[],
    "marketingMessages" JSONB,
    "faqs" JSONB,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storefront_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Storefront_slug_key" ON "Storefront"("slug");

-- CreateIndex
CREATE INDEX "Storefront_status_idx" ON "Storefront"("status");

-- CreateIndex
CREATE INDEX "Storefront_createdAt_idx" ON "Storefront"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Storefront_productId_marketResultId_locale_key" ON "Storefront"("productId", "marketResultId", "locale");

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_marketResultId_fkey" FOREIGN KEY ("marketResultId") REFERENCES "MarketResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_localizationId_fkey" FOREIGN KEY ("localizationId") REFERENCES "ProductLocalization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_pricingScenarioId_fkey" FOREIGN KEY ("pricingScenarioId") REFERENCES "PricingScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
