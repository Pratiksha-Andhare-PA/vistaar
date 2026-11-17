
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database";

const createStorefrontSchema = z.object({
    productId: z.string().min(1),
    marketResultId: z.string().min(1),
    localizationId: z.string().min(1),
    pricingScenarioId: z.string().min(1),
    locale: z.string().min(2).max(20),
});

function slugify(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

function isPrismaUniqueConstraintError(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
    );
}

export async function GET(request: NextRequest) {
    try {
        const productId = request.nextUrl.searchParams.get("productId");

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

        const storefronts = await prisma.storefront.findMany({
            where: { productId },
            include: {
                marketResult: {
                    select: {
                        country: true,
                        countryCode: true,
                    },
                },
                localization: {
                    select: {
                        locale: true,
                        localizedTitle: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ storefronts });
    } catch (error) {
        console.error("Storefront GET error:", error);

        return NextResponse.json(
            { error: "Unable to retrieve storefronts." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();
        const validation = createStorefrontSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid storefront details.",
                    details: validation.error.flatten(),
                },
                { status: 400 },
            );
        }

        const {
            productId,
            marketResultId,
            localizationId,
            pricingScenarioId,
            locale,
        } = validation.data;

        // Fetch all selected records.
        const [product, marketResult, localization, pricingScenario] =
            await Promise.all([
                prisma.product.findUnique({
                    where: { id: productId },
                    include: {
                        business: {
                            select: {
                                name: true,
                                description: true,
                                city: true,
                                country: true,
                            },
                        },
                    },
                }),
                prisma.marketResult.findUnique({
                    where: { id: marketResultId },
                    select: {
                        id: true,
                        country: true,
                        countryCode: true,
                        research: {
                            select: { productId: true },
                        },
                    },
                }),
                prisma.productLocalization.findUnique({
                    where: { id: localizationId },
                }),
                prisma.pricingScenario.findUnique({
                    where: { id: pricingScenarioId },
                }),
            ]);

        if (!product) {
            return NextResponse.json(
                { error: "Product not found." },
                { status: 404 },
            );
        }

        if (!marketResult) {
            return NextResponse.json(
                { error: "Market result not found." },
                { status: 404 },
            );
        }

        if (!localization) {
            return NextResponse.json(
                { error: "Localization not found." },
                { status: 404 },
            );
        }

        if (!pricingScenario) {
            return NextResponse.json(
                { error: "Pricing scenario not found." },
                { status: 404 },
            );
        }

        // Ensure the selected market belongs to this product.
        if (marketResult.research.productId !== productId) {
            return NextResponse.json(
                { error: "The selected market does not belong to this product." },
                { status: 400 },
            );
        }

        // Ensure localization belongs to the selected product and market.
        if (
            localization.productId !== productId ||
            localization.marketResultId !== marketResultId
        ) {
            return NextResponse.json(
                {
                    error: "The selected localization does not match this product and market.",
                },
                { status: 400 },
            );
        }

        if (localization.status !== "COMPLETED") {
            return NextResponse.json(
                { error: "Only completed localizations can be used." },
                { status: 400 },
            );
        }

        if (
            !localization.localizedTitle?.trim() ||
            !localization.localizedDescription?.trim()
        ) {
            return NextResponse.json(
                {
                    error: "The selected localization is missing its title or description. Please generate the localization again.",
                },
                { status: 400 },
            );
        }

        if (localization.locale !== locale) {
            return NextResponse.json(
                { error: "The selected locale does not match the localization." },
                { status: 400 },
            );
        }

        // Ensure pricing belongs to the same product and market.
        if (
            pricingScenario.productId !== productId ||
            pricingScenario.marketResultId !== marketResultId
        ) {
            return NextResponse.json(
                {
                    error: "The selected pricing scenario does not match this product and market.",
                },
                { status: 400 },
            );
        }

        // Prevent duplicate storefronts for the same product, market and locale.
        const existing = await prisma.storefront.findUnique({
            where: {
                productId_marketResultId_locale: {
                    productId,
                    marketResultId,
                    locale,
                },
            },
            select: { id: true, slug: true },
        });

        if (existing) {
            return NextResponse.json(
                {
                    error: "A storefront already exists for this product, market and locale.",
                    storefront: existing,
                },
                { status: 409 },
            );
        }

        const baseSlug =
            slugify(product.name) ||
            "storefront";

        const slug = `${baseSlug}-${marketResult.countryCode.toLowerCase()}-${randomUUID().slice(0, 8)}`;

        // Save a snapshot. No AI generation or external API calls are made.
        const storefront = await prisma.storefront.create({
            data: {
                slug,
                status: "DRAFT",

                productId,
                marketResultId,
                localizationId,
                pricingScenarioId,

                locale,
                country: marketResult.country,
                countryCode: marketResult.countryCode,

                productName: product.name,
                localizedTitle: localization.localizedTitle,
                localizedDescription: localization.localizedDescription,
                imageUrl: product.imageUrl,

                businessName: product.business.name,
                businessDescription: product.business.description || "",
                businessCity: product.business.city || "",
                businessCountry: product.business.country,

                currency: pricingScenario.targetCurrency,
                price: pricingScenario.recommendedPrice,

                seoKeywords: localization.seoKeywords,
                culturalGuidance: localization.culturalGuidance,
                marketingMessages:
                    localization.marketingMessages ?? undefined,
                faqs: localization.faqs ?? undefined,
            },
            include: {
                marketResult: {
                    select: {
                        country: true,
                        countryCode: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                message: "Storefront draft created successfully.",
                storefront,
            },
            { status: 201 },
        );
    } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
            return NextResponse.json(
                {
                    error: "A storefront already exists with these details.",
                },
                { status: 409 },
            );
        }

        console.error("Storefront POST error:", error);

        return NextResponse.json(
            { error: "Unable to create storefront." },
            { status: 500 },
        );
    }
}
