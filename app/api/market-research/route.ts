
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database";
import {
  BudgetExceededError,
  recordClaudeUsageAndSettle,
  releaseAiBudgetReservation,
  reserveAiBudget,
} from "@/lib/ai-budget";
import {
  generateMarketResearch,
  buildMarketResearchPrompt,
  MAX_OUTPUT_TOKENS,
} from "@/lib/market-research";
import { CLAUDE_MODEL } from "@/lib/anthropic";
import { marketResearchResponseSchema } from "@/lib/market-research-schema";
import { rankMarkets } from "@/lib/market-scoring";
import { generateMarketResearchCacheKey } from "@/lib/market-research-cache";

const researchSchema = z.object({
  productId: z.string().trim().min(1),
  countries: z
    .array(
      z.string().trim().transform((value) => value.toUpperCase())
        .pipe(z.string().regex(/^[A-Z]{2}$/)),
    )
    .min(1)
    .max(5)
    .refine(
      (countries) => new Set(countries).size === countries.length,
      "Duplicate countries are not allowed.",
    ),
});

const countryNames = new Intl.DisplayNames(["en"], {
  type: "region",
});

function getCountryName(code: string): string | null {
  const name = countryNames.of(code);

  if (!name || name === code || name === "Unknown Region") {
    return null;
  }

  return name;
}

function isOwnCountry(
  businessCountry: string,
  countryCode: string,
  countryName: string,
): boolean {
  const normalizedBusinessCountry = businessCountry
    .trim()
    .toLowerCase();

  return (
    normalizedBusinessCountry === countryCode.toLowerCase() ||
    normalizedBusinessCountry === countryName.toLowerCase()
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function findResearchByCacheKey(cacheKey: string) {
  return prisma.marketResearch.findUnique({
    where: { cacheKey },
    include: {
      results: {
        orderBy: { rank: "asc" },
      },
      aiUsage: true,
    },
  });
}

function respondWithExistingResearch(
  existing: NonNullable<
    Awaited<ReturnType<typeof findResearchByCacheKey>>
  >,
) {
  if (existing.status === "COMPLETED") {
    return NextResponse.json(
      {
        message: "Existing market research reused successfully.",
        cached: true,
        research: existing,
        disclaimer:
          "These are preliminary AI-generated assessments, not verified market research. Validate market demand, regulations, and export requirements independently.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      error: "Matching market research is already in progress.",
      researchId: existing.id,
      status: existing.status,
      message:
        "Wait for the existing research to finish before requesting it again.",
    },
    { status: 409 },
  );
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const researches = await prisma.marketResearch.findMany({
      where: {
        productId,
        status: "COMPLETED",
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        id: true,
        summary: true,
        recommendedCountry: true,
        recommendationReason: true,
        completedAt: true,
        results: {
          orderBy: {
            rank: "asc",
          },
          select: {
            id: true,
            country: true,
            countryCode: true,
            rank: true,
            opportunityScore: true,
            suggestedCurrency: true,
            suggestedPriceMin: true,
            suggestedPriceMax: true,
          },
        },
      },
    });

    return NextResponse.json({
      researches,
    });
  } catch (error) {
    console.error("Fetch market research error:", error);

    return NextResponse.json(
      { error: "Unable to fetch market research." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const validation = researchSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid market research request.",
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { productId, countries } = validation.data;

  let researchId: string | null = null;
  let reservationId: string | null = null;
  let claudeRequestStarted = false;

  try {
    // 1. Fetch the product and its business details.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        business: {
          select: {
            name: true,
            country: true,
            category: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    // 2. Resolve and validate target countries.
    const targetMarkets = countries.map((code) => ({
      code,
      name: getCountryName(code),
    }));

    if (targetMarkets.some((market) => !market.name)) {
      return NextResponse.json(
        { error: "One or more country codes are not supported." },
        { status: 422 },
      );
    }

    const markets = targetMarkets as Array<{
      code: string;
      name: string;
    }>;

    const ownCountry = markets.find((market) =>
      isOwnCountry(
        product.business.country,
        market.code,
        market.name,
      ),
    );

    if (ownCountry) {
      return NextResponse.json(
        {
          error: `${ownCountry.name} is the business's own country. Select an international market instead.`,
        },
        { status: 422 },
      );
    }

    // 3. Build the research input and prompt.
    const input = {
      product: {
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        currency: product.currency,
        businessName: product.business.name,
        businessCountry: product.business.country,
        category: product.business.category,
      },
      countries: markets,
    };

    const prompt = buildMarketResearchPrompt(input);

    // 4. Generate a deterministic cache key.
    const cacheKey = generateMarketResearchCacheKey({
      productId,
      product: input.product,
      countries: markets,
      model: CLAUDE_MODEL,
    });

    // 5. Return an existing result if it is already completed.
    const existingResearch = await findResearchByCacheKey(cacheKey);

    if (existingResearch) {
      return respondWithExistingResearch(existingResearch);
    }

    // 6. Claim the cache key by creating a PENDING record.
    // The unique constraint prevents concurrent duplicate requests.
    let research;

    try {
      research = await prisma.marketResearch.create({
        data: {
          productId,
          requestedCountries: countries,
          status: "PENDING",
          cacheKey,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // Another request may have claimed this cache key.
      const concurrentResearch =
        await findResearchByCacheKey(cacheKey);

      if (concurrentResearch) {
        return respondWithExistingResearch(concurrentResearch);
      }

      throw error;
    }

    const currentResearchId = research.id;
    researchId = currentResearchId;

    // 7. Reserve budget only after successfully claiming the key.
    const reservation = await reserveAiBudget({
      researchId,
      model: CLAUDE_MODEL,
      promptText: prompt.promptText,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    reservationId = reservation.id;

    // 8. Mark the research as processing.
    await prisma.marketResearch.update({
      where: { id: researchId },
      data: { status: "PROCESSING" },
    });

    // 9. Generate market research using Claude.
    claudeRequestStarted = true;

    const generated = await generateMarketResearch(input);


    // 10. Record actual usage and settle the reservation.
    await recordClaudeUsageAndSettle({
      reservationId,
      researchId,
      model: generated.model,
      operation: "market_research",
      usage: generated.usage,
    });

    reservationId = null;

    // 11. Validate Claude's structured response.
    const parsed = marketResearchResponseSchema.safeParse(
      generated.rawResult,
    );

    if (!parsed.success) {
      throw new Error(
        "Claude returned an invalid market research response.",
      );
    }

    // 12. Verify that every requested country appears exactly once.
    const returnedCodes = parsed.data.markets.map(
      (market) => market.countryCode,
    );

    const returnedSet = new Set(returnedCodes);

    if (
      returnedCodes.length !== countries.length ||
      returnedSet.size !== countries.length ||
      countries.some((code) => !returnedSet.has(code))
    ) {
      throw new Error(
        "Claude returned an incomplete or mismatched set of markets.",
      );
    }

    // 13. Rank markets using deterministic scoring.
    const rankedMarkets = rankMarkets(parsed.data.markets);
    const recommendedMarket = rankedMarkets[0];

    // 14. Persist results and complete the research.
    const completedResearch = await prisma.$transaction(
      async (tx) => {
        await tx.marketResult.createMany({
          data: rankedMarkets.map((market) => ({
            researchId: currentResearchId,
            country: market.country,
            countryCode: market.countryCode,
            rank: market.rank,
            opportunityScore: market.opportunityScore,
            scoreBreakdown: {
              demand: market.scoreBreakdown.demand,
              competition: market.scoreBreakdown.competition,
              culturalFit: market.scoreBreakdown.culturalFit,
              exportPracticality: market.scoreBreakdown.exportPracticality,
              total: market.scoreBreakdown.total,
            },
            demandLevel: market.demandLevel,
            competitionLevel: market.competitionLevel,
            targetCustomers: market.targetCustomers,
            marketRationale: market.marketRationale,
            opportunities: market.opportunities,
            risks: market.risks,
            culturalConsiderations:
              market.culturalConsiderations,
            suggestedPriceMin: market.suggestedPriceMin,
            suggestedPriceMax: market.suggestedPriceMax,
            suggestedCurrency: market.suggestedCurrency,
          })),
        });

        return tx.marketResearch.update({
          where: { id: currentResearchId },
          data: {
            status: "COMPLETED",
            summary: parsed.data.summary,
            recommendedCountry: recommendedMarket.country,
            recommendationReason:
              recommendedMarket.marketRationale,
            modelUsed: generated.model,
            completedAt: new Date(),
          },
          include: {
            results: {
              orderBy: { rank: "asc" },
            },
            aiUsage: true,
          },
        });
      },
    );

    // 15. Return the completed research.
    return NextResponse.json(
      {
        message: "Market research completed successfully.",
        cached: false,
        research: completedResearch,
        disclaimer:
          "These are preliminary AI-generated assessments, not verified market research. Validate market demand, regulations, and export requirements independently.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Market research error:", error);

    // Release only if we know the Claude request was not started.
    if (reservationId && !claudeRequestStarted) {
      try {
        await releaseAiBudgetReservation(reservationId);
      } catch (releaseError) {
        console.error(
          "Unable to release AI budget reservation:",
          releaseError,
        );
      }
    }

    // Mark failed research and release its cache key for a future retry.
    if (researchId) {
      try {
        await prisma.marketResearch.update({
          where: { id: researchId },
          data: {
            status: "FAILED",
            cacheKey: null,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Unknown market research error.",
          },
        });
      } catch (updateError) {
        console.error(
          "Unable to update failed research:",
          updateError,
        );
      }
    }

    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        error: "Market research could not be completed.",
        researchId,
        message:
          "Check the research status and AI budget ledger before retrying. An ambiguous Claude request may still have a reserved budget.",
      },
      { status: 500 },
    );
  }
}
