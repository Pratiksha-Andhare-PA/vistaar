-- AlterTable
ALTER TABLE "AiBudgetReservation" ADD COLUMN     "researchId" TEXT;

-- CreateIndex
CREATE INDEX "AiBudgetReservation_researchId_idx" ON "AiBudgetReservation"("researchId");

-- AddForeignKey
ALTER TABLE "AiBudgetReservation" ADD CONSTRAINT "AiBudgetReservation_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "MarketResearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
