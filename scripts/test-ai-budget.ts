
import "dotenv/config";

import { prisma } from "../lib/database";
import {
  reserveAiBudget,
  settleAiBudgetReservation,
  releaseAiBudgetReservation,
} from "../lib/ai-budget";
import { calculateClaudeCostUsd } from "../lib/ai-pricing";

const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";

async function showBudget(label: string) {
  const budget = await prisma.aiBudget.findUniqueOrThrow({
    where: { id: "global" },
  });

  const available = budget.totalBudgetUsd
    .minus(budget.spentUsd)
    .minus(budget.reservedUsd);

  console.log(`\n${label}`);
  console.log({
    spent: budget.spentUsd.toString(),
    reserved: budget.reservedUsd.toString(),
    available: available.toString(),
  });
}

async function main() {
  console.log("Starting local AI budget tests.");
  console.log("No Claude API requests will be made.");

  const research = await prisma.marketResearch.findFirst({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (!research) {
    throw new Error("No market research record found for budget tests.");
  }

  await showBudget("Initial budget");

  // Test 1: Reserve funds.
  const reservation = await reserveAiBudget({
    researchId: research.id,
    model: MODEL,
    promptText: "A".repeat(1000),
    maxOutputTokens: 500,
  });

  console.log("\nReservation created:", reservation.id);
  await showBudget("After reservation");

  // Test 2: Simulate a Claude response and settle.
  const simulatedUsage = {
    inputTokens: 400,
    outputTokens: 200,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };

  const actualCost = calculateClaudeCostUsd(
    MODEL,
    simulatedUsage,
  );

  await settleAiBudgetReservation(
    reservation.id,
    actualCost,
  );

  console.log("\nSimulated actual cost:", actualCost);
  await showBudget("After settlement");

  // Test 3: Reserve funds and release them.
  const releaseReservation = await reserveAiBudget({
    researchId: research.id,
    model: MODEL,
    promptText: "B".repeat(1000),
    maxOutputTokens: 500,
  });

  await releaseAiBudgetReservation(releaseReservation.id);

  console.log("\nReleased reservation:", releaseReservation.id);
  await showBudget("After release");

  console.log("\nAll budget tests completed.");
}

main()
  .catch((error) => {
    console.error("Budget test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
