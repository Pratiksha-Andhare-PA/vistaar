
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
  buildLocalizationPrompt,
  generateProductLocalization,
  MAX_OUTPUT_TOKENS,
} from "@/lib/localization";
import { CLAUDE_MODEL } from "@/lib/anthropic";
import {
  LOCALIZATION_PROMPT_VERSION,
  generateLocalizationCacheKey,
} from "@/lib/localization-cache";

const localizationRequestSchema = z.object({
  productId: z.string().trim().min(1),
  marketResultId: z.string().trim().min(1),
  locale: z.string().trim().min(2).max(35),
});

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function normalizeLocale(locale: string): string | null {
  try {
    const parsedLocale = new Intl.Locale(locale);

    if (!parsedLocale.region || !parsedLocale.language) {
      return null;
    }

    return parsedLocale.toString();
  } catch {
    return null;
  }
}

async function findLocalizationByCacheKey(cacheKey: string) {
  return prisma.productLocalization.findUnique({
    where: { cacheKey },
    include: {
      aiUsage: true,
    },
  });
}

function respondWithExistingLocalization(
  existing: NonNullable<
    Awaited<ReturnType<typeof findLocalizationByCacheKey>>
  >,
) {
  if (existing.status === "COMPLETED") {
    return NextResponse.json(
      {
        message: "Existing localization reused successfully.",
        cached: true,
        localization: existing,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      error: "Matching localization is already in progress or requires reconciliation.",
      localizationId: existing.id,
      status: existing.status,
      message:
        "Do not submit another generation request until the existing localization has been reviewed.",
    },
    { status: 409 },
  );
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

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

    const marketResults = await prisma.marketResult.findMany({
      where: {
        research: {
          productId,
          status: "COMPLETED",
        },
      },
      orderBy: { rank: "asc" },
      include: {
        localizations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      marketResults,
      total: marketResults.length,
    });
  } catch (error) {
    console.error("Fetch localization data error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve localization data." },
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

  const validation = localizationRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid localization request.",
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { productId, marketResultId } = validation.data;
  const locale = normalizeLocale(validation.data.locale);

  if (!locale) {
    return NextResponse.json(
      {
        error:
          "Invalid locale. Include a language and region, such as en-US or ar-AE.",
      },
      { status: 422 },
    );
  }

  let localizationId: string | null = null;
  let reservationId: string | null = null;
  let claudeRequestStarted = false;
  let cacheKey: string | null = null;

  try {
    // 1. Fetch the selected market and its research relationship.
    const marketResult = await prisma.marketResult.findUnique({
      where: { id: marketResultId },
      include: {
        research: {
          select: {
            id: true,
            productId: true,
            status: true,
          },
        },
      },
    });

    if (!marketResult) {
      return NextResponse.json(
        { error: "Market research result not found." },
        { status: 404 },
      );
    }

    // 2. Verify the selected market belongs to the product.
    if (marketResult.research.productId !== productId) {
      return NextResponse.json(
        {
          error:
            "The selected market research result does not belong to this product.",
        },
        { status: 422 },
      );
    }

    if (marketResult.research.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Complete market research before generating product localization.",
        },
        { status: 422 },
      );
    }

    // 3. Verify locale and target market compatibility.
    const localeRegion = new Intl.Locale(locale).region;

    if (localeRegion !== marketResult.countryCode.toUpperCase()) {
      return NextResponse.json(
        {
          error:
            `Locale region must match the selected market (${marketResult.countryCode}).`,
        },
        { status: 422 },
      );
    }

    // 4. Fetch original product and business details.
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

    // 5. Build the exact input used by the localization helper.
    const input = {
      product: {
        name: product.name,
        description: product.description,
        category: product.business.category,
        price: product.price.toString(),
        currency: product.currency,
        businessName: product.business.name,
        businessCountry: product.business.country,
      },
      market: {
        country: marketResult.country,
        countryCode: marketResult.countryCode,
        targetCustomers: marketResult.targetCustomers,
        marketRationale: marketResult.marketRationale,
        demandLevel: marketResult.demandLevel,
        competitionLevel: marketResult.competitionLevel,
        opportunities: marketResult.opportunities,
        risks: marketResult.risks,
        culturalConsiderations:
          marketResult.culturalConsiderations,
      },
      locale,
    };

    const prompt = buildLocalizationPrompt(input);

    const promptText = `${prompt.system}\n\n${prompt.userMessage}`;

    // 6. Generate a deterministic cache key.
    cacheKey = generateLocalizationCacheKey({
      productId,
      product: input.product,
      market: {
        id: marketResult.id,
        country: marketResult.country,
        countryCode: marketResult.countryCode,
        targetCustomers: marketResult.targetCustomers,
        marketRationale: marketResult.marketRationale,
        demandLevel: marketResult.demandLevel,
        competitionLevel: marketResult.competitionLevel,
        opportunities: marketResult.opportunities,
        risks: marketResult.risks,
        culturalConsiderations:
          marketResult.culturalConsiderations,
      },
      locale,
      model: CLAUDE_MODEL,
    });

    // 7. Reuse an existing localization if available.
    const existingLocalization =
      await findLocalizationByCacheKey(cacheKey);

    if (existingLocalization) {
      return respondWithExistingLocalization(
        existingLocalization,
      );
    }

    // 8. Claim the cache key before reserving budget.
    let localization;

    try {
      localization = await prisma.productLocalization.create({
        data: {
          productId,
          marketResultId,
          country: marketResult.country,
          countryCode: marketResult.countryCode,
          locale,
          promptVersion: LOCALIZATION_PROMPT_VERSION,
          status: "PENDING",
          cacheKey,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const concurrentLocalization =
        await findLocalizationByCacheKey(cacheKey);

      if (concurrentLocalization) {
        return respondWithExistingLocalization(
          concurrentLocalization,
        );
      }

      throw error;
    }

    localizationId = localization.id;

    // 9. Reserve budget before calling Claude.
    const reservation = await reserveAiBudget({
      localizationId,
      model: CLAUDE_MODEL,
      promptText,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    reservationId = reservation.id;

    // 10. Mark localization as processing.
    await prisma.productLocalization.update({
      where: { id: localizationId },
      data: {
        status: "PROCESSING",
      },
    });

    // 11. Generate localized content.
    claudeRequestStarted = true;

    const generated = await generateProductLocalization(input);

    // 12. Record actual usage and settle the reservation.
    await recordClaudeUsageAndSettle({
      reservationId,
      localizationId,
      model: generated.model,
      operation: "product_localization",
      usage: generated.usage,
    });

    reservationId = null;

    // 13. Persist generated content.
    const completedLocalization = await prisma.productLocalization.update({
      where: { id: localizationId },
      data: {
        status: "COMPLETED",
        localizedTitle: generated.content.localizedTitle,
        localizedDescription:
          generated.content.localizedDescription,
        culturalGuidance: generated.content.culturalGuidance,
        seoKeywords: generated.content.seoKeywords,
        marketingMessages: generated.content.marketingMessages,
        faqs: generated.content.faqs,
        modelUsed: generated.model,
        completedAt: new Date(),
      },
      include: {
        aiUsage: true,
      },
    });

    // 14. Return completed localization.
    return NextResponse.json(
      {
        message: "Product localization completed successfully.",
        cached: false,
        localization: completedLocalization,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Product localization error:", error);

    let reservationReleased = !reservationId;

    // Release only when we know Claude was not called.
    if (reservationId && !claudeRequestStarted) {
      try {
        await releaseAiBudgetReservation(reservationId);
        reservationReleased = true;
      } catch (releaseError) {
        reservationReleased = false;

        console.error(
          "Unable to release localization budget reservation:",
          releaseError,
        );
      }
    }

    // Keep the cache key if Claude may have been called or
    // if reservation release could not be confirmed.
    if (localizationId) {
      try {
        await prisma.productLocalization.update({
          where: { id: localizationId },
          data: {
            status: "FAILED",
            ...(reservationReleased && !claudeRequestStarted
              ? { cacheKey: null }
              : {}),
            errorMessage:
              error instanceof Error
                ? error.message
                : "Unknown product localization error.",
          },
        });
      } catch (updateError) {
        console.error(
          "Unable to update failed localization:",
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
        error: "Product localization could not be completed.",
        localizationId,
        message:
          "Check the localization status and AI budget ledger before retrying. If a Claude request may have started, its cache key remains reserved to prevent duplicate paid requests.",
      },
      { status: 500 },
    );
  }
}
