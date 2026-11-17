-- CreateEnum
CREATE TYPE "ExportRequirementCategory" AS ENUM ('BUSINESS_REGISTRATION', 'EXPORT_REGISTRATION', 'PRODUCT_CLASSIFICATION', 'PRODUCT_COMPLIANCE', 'DOCUMENTATION', 'CUSTOMS', 'PACKAGING_LABELING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "ExportRequirementPriority" AS ENUM ('REQUIRED', 'RECOMMENDED', 'INFORMATIONAL');

-- CreateEnum
CREATE TYPE "ExportChecklistStatus" AS ENUM ('PENDING', 'COMPLETED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ExportAssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "ExportRequirement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExportRequirementCategory" NOT NULL,
    "priority" "ExportRequirementPriority" NOT NULL,
    "countryCode" TEXT NOT NULL,
    "originCountryCode" TEXT NOT NULL DEFAULT 'IN',
    "productCategory" "BusinessCategory",
    "applicability" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceCheckedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportReadinessAssessment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketResultId" TEXT NOT NULL,
    "status" "ExportAssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportReadinessAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportReadinessItem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "requirementId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExportRequirementCategory" NOT NULL,
    "priority" "ExportRequirementPriority" NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "sourceCheckedAt" TIMESTAMP(3),
    "status" "ExportChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportReadinessItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportRequirement_countryCode_productCategory_isActive_idx" ON "ExportRequirement"("countryCode", "productCategory", "isActive");

-- CreateIndex
CREATE INDEX "ExportRequirement_category_idx" ON "ExportRequirement"("category");

-- CreateIndex
CREATE INDEX "ExportReadinessAssessment_businessId_idx" ON "ExportReadinessAssessment"("businessId");

-- CreateIndex
CREATE INDEX "ExportReadinessAssessment_marketResultId_idx" ON "ExportReadinessAssessment"("marketResultId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportReadinessAssessment_productId_marketResultId_key" ON "ExportReadinessAssessment"("productId", "marketResultId");

-- CreateIndex
CREATE INDEX "ExportReadinessItem_assessmentId_category_idx" ON "ExportReadinessItem"("assessmentId", "category");

-- CreateIndex
CREATE INDEX "ExportReadinessItem_status_idx" ON "ExportReadinessItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExportReadinessItem_assessmentId_requirementId_key" ON "ExportReadinessItem"("assessmentId", "requirementId");

-- AddForeignKey
ALTER TABLE "ExportReadinessAssessment" ADD CONSTRAINT "ExportReadinessAssessment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportReadinessAssessment" ADD CONSTRAINT "ExportReadinessAssessment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportReadinessAssessment" ADD CONSTRAINT "ExportReadinessAssessment_marketResultId_fkey" FOREIGN KEY ("marketResultId") REFERENCES "MarketResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportReadinessItem" ADD CONSTRAINT "ExportReadinessItem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ExportReadinessAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportReadinessItem" ADD CONSTRAINT "ExportReadinessItem_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ExportRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
