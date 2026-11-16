-- CreateEnum
CREATE TYPE "BudgetReservationStatus" AS ENUM ('RESERVED', 'SETTLED', 'RELEASED');

-- CreateTable
CREATE TABLE "AiBudget" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "totalBudgetUsd" DECIMAL(12,8) NOT NULL,
    "spentUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "reservedUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBudgetReservation" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL DEFAULT 'global',
    "estimatedCostUsd" DECIMAL(12,8) NOT NULL,
    "actualCostUsd" DECIMAL(12,8),
    "status" "BudgetReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "AiBudgetReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiBudgetReservation_status_expiresAt_idx" ON "AiBudgetReservation"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "AiBudgetReservation" ADD CONSTRAINT "AiBudgetReservation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "AiBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
