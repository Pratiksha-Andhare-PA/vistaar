
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/database";
import { calculateClaudeCostUsd } from "@/lib/ai-pricing";

const BUDGET_ID = "global";
const BUDGET_LOCK_ID = 748291;

const RESERVATION_DURATION_MS = 60 * 60 * 1000;

export class BudgetExceededError extends Error {
  constructor(message = "Vistaar AI budget limit reached.") {
    super(message);
    this.name = "BudgetExceededError";
  }
}

/**
 * Initialize the project budget once.
 * Calling this again will NOT reset existing spending.
 */
export async function initializeAiBudget() {
  return prisma.aiBudget.upsert({
    where: { id: BUDGET_ID },
    create: {
      id: BUDGET_ID,
      totalBudgetUsd: new Prisma.Decimal("100"),
      spentUsd: new Prisma.Decimal("0"),
      reservedUsd: new Prisma.Decimal("0"),
    },
    update: {},
  });
}

/**
 * Conservative prompt estimate:
 * approximately one token per two characters.
 *
 * This is a safety estimate, not an exact tokenizer.
 */
export function estimateInputTokens(text: string): number {
  return Math.ceil(text.length / 2);
}

/**
 * Reserve enough budget for the estimated prompt and
 * the maximum possible output before calling Claude.
 */
export async function reserveAiBudget(input: {
  researchId: string;
  model: string;
  promptText: string;
  maxOutputTokens: number;
}) {
  if (
    !Number.isInteger(input.maxOutputTokens) ||
    input.maxOutputTokens <= 0
  ) {
    throw new Error("Invalid maximum output token count.");
  }

  const estimatedInputTokens = estimateInputTokens(
    input.promptText,
  );

  // Add a 25% safety margin to the estimated cost.
  const estimatedCost = calculateClaudeCostUsd(input.model, {
    inputTokens: estimatedInputTokens,
    outputTokens: input.maxOutputTokens,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  });

  const reservationAmount = new Prisma.Decimal(
    (estimatedCost * 1.25).toFixed(8),
  );

  return prisma.$transaction(async (tx) => {
    // Serialize all budget reservations and settlements.
    await tx.$queryRaw`
      WITH lock_acquired AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(${BUDGET_LOCK_ID})
      )
      SELECT 1::int AS locked
      FROM lock_acquired
    `;

    const budget = await tx.aiBudget.findUnique({
      where: { id: BUDGET_ID },
    });

    if (!budget) {
      throw new Error(
        "AI budget is not initialized. Initialize it before making Claude requests.",
      );
    }

    const available = budget.totalBudgetUsd
      .minus(budget.spentUsd)
      .minus(budget.reservedUsd);

    if (available.lessThan(reservationAmount)) {
      throw new BudgetExceededError(
        `Insufficient AI budget. Available: $${available.toFixed(8)}, required reservation: $${reservationAmount.toFixed(8)}.`,
      );
    }

    const expiresAt = new Date(
      Date.now() + RESERVATION_DURATION_MS,
    );

    const reservation = await tx.aiBudgetReservation.create({
      data: {
        budgetId: BUDGET_ID,
        researchId: input.researchId,
        estimatedCostUsd: reservationAmount,
        expiresAt,
      },
    });

    await tx.aiBudget.update({
      where: { id: BUDGET_ID },
      data: {
        reservedUsd: {
          increment: reservationAmount,
        },
      },
    });

    return reservation;
  });
}

/**
 * Settle a reservation using the actual API usage.
 */
export async function settleAiBudgetReservation(
  reservationId: string,
  actualCostUsd: number,
) {
  if (!Number.isFinite(actualCostUsd) || actualCostUsd < 0) {
    throw new Error("Invalid actual Claude API cost.");
  }

  const actualCost = new Prisma.Decimal(
    actualCostUsd.toFixed(8),
  );

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      WITH lock_acquired AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(${BUDGET_LOCK_ID})
      )
      SELECT 1::int AS locked
      FROM lock_acquired
    `;

    const reservation =
      await tx.aiBudgetReservation.findUnique({
        where: { id: reservationId },
      });

    if (!reservation) {
      throw new Error("Budget reservation not found.");
    }

    if (reservation.status !== "RESERVED") {
      throw new Error(
        "This budget reservation has already been processed.",
      );
    }

    await tx.aiBudget.update({
      where: { id: reservation.budgetId },
      data: {
        reservedUsd: {
          decrement: reservation.estimatedCostUsd,
        },
        spentUsd: {
          increment: actualCost,
        },
      },
    });

    return tx.aiBudgetReservation.update({
      where: { id: reservationId },
      data: {
        actualCostUsd: actualCost,
        status: "SETTLED",
        settledAt: new Date(),
      },
    });
  });
}

/**
 * Release a reservation only when we know the Claude
 * request was not accepted and no charge was incurred.
 */
export async function releaseAiBudgetReservation(
  reservationId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      WITH lock_acquired AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(${BUDGET_LOCK_ID})
      )
      SELECT 1::int AS locked
      FROM lock_acquired
    `;

    const reservation =
      await tx.aiBudgetReservation.findUnique({
        where: { id: reservationId },
      });

    if (!reservation) {
      throw new Error("Budget reservation not found.");
    }

    if (reservation.status !== "RESERVED") {
      throw new Error(
        "Only an active reservation can be released.",
      );
    }

    await tx.aiBudget.update({
      where: { id: reservation.budgetId },
      data: {
        reservedUsd: {
          decrement: reservation.estimatedCostUsd,
        },
      },
    });

    return tx.aiBudgetReservation.update({
      where: { id: reservationId },
      data: {
        status: "RELEASED",
        settledAt: new Date(),
      },
    });
  });
}

export interface RecordClaudeUsageInput {
  reservationId: string;
  researchId: string;
  model: string;
  operation: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
}

/**
 * Atomically records actual Claude usage and settles
 * the corresponding budget reservation.
 *
 * Both operations succeed or roll back together.
 */
export async function recordClaudeUsageAndSettle(
  input: RecordClaudeUsageInput,
) {
  const actualCostUsd = calculateClaudeCostUsd(
    input.model,
    input.usage,
  );

  const actualCost = new Prisma.Decimal(
    actualCostUsd.toFixed(8),
  );

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      WITH lock_acquired AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(${BUDGET_LOCK_ID})
      )
      SELECT 1::int AS locked
      FROM lock_acquired
    `;

    const reservation =
      await tx.aiBudgetReservation.findUnique({
        where: { id: input.reservationId },
      });

    if (!reservation) {
      throw new Error("Budget reservation not found.");
    }

    if (reservation.status !== "RESERVED") {
      throw new Error(
        "This budget reservation has already been processed.",
      );
    }

    // Ensure this reservation belongs to the supplied research.
    if (reservation.researchId !== input.researchId) {
      throw new Error(
        "Budget reservation does not belong to this market research record.",
      );
    }

    const research = await tx.marketResearch.findUnique({
      where: { id: input.researchId },
      select: { id: true },
    });

    if (!research) {
      throw new Error("Market research record not found.");
    }

    // Record the actual API usage.
    const usageRecord = await tx.aiUsage.create({
      data: {
        researchId: input.researchId,
        provider: "anthropic",
        model: input.model,
        operation: input.operation,
        inputTokens: input.usage.inputTokens,
        outputTokens: input.usage.outputTokens,
        cacheReadInputTokens:
          input.usage.cacheReadInputTokens,
        cacheCreationInputTokens:
          input.usage.cacheCreationInputTokens,
        estimatedCostUsd: actualCost,
      },
    });

    // Release the reservation and record actual spending.
    await tx.aiBudget.update({
      where: { id: reservation.budgetId },
      data: {
        reservedUsd: {
          decrement: reservation.estimatedCostUsd,
        },
        spentUsd: {
          increment: actualCost,
        },
      },
    });

    const settledReservation =
      await tx.aiBudgetReservation.update({
        where: { id: input.reservationId },
        data: {
          actualCostUsd: actualCost,
          status: "SETTLED",
          settledAt: new Date(),
        },
      });

    return {
      usageRecord,
      reservation: settledReservation,
      actualCostUsd,
    };
  });
}
