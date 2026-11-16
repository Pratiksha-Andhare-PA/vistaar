
import "dotenv/config";
import { initializeAiBudget } from "../lib/ai-budget";

async function main() {
  const budget = await initializeAiBudget();

  console.log("Vistaar AI budget initialized:");
  console.log({
    totalBudgetUsd: budget.totalBudgetUsd.toString(),
    spentUsd: budget.spentUsd.toString(),
    reservedUsd: budget.reservedUsd.toString(),
    availableUsd: budget.totalBudgetUsd
      .minus(budget.spentUsd)
      .minus(budget.reservedUsd)
      .toString(),
  });
}

main()
  .catch((error) => {
    console.error("Budget initialization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/database");
    await prisma.$disconnect();
  });
