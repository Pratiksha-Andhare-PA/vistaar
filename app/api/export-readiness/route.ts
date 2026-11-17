
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database";
import {
    getMatchingExportRequirements,
    normalizeOriginCountry,
} from "@/lib/export-readiness/matcher";

const createAssessmentSchema = z.object({
    productId: z.string().min(1),
    marketResultId: z.string().min(1),
});

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

        const assessments =
            await prisma.exportReadinessAssessment.findMany({
                where: { productId },
                include: {
                    business: {
                        select: { id: true, name: true },
                    },
                    product: {
                        select: { id: true, name: true },
                    },
                    marketResult: {
                        select: {
                            id: true,
                            country: true,
                            countryCode: true,
                            rank: true,
                        },
                    },
                    items: {
                        orderBy: [
                            { sortOrder: "asc" },
                            { category: "asc" },
                        ],
                    },
                },
                orderBy: { updatedAt: "desc" },
            });

        return NextResponse.json({ assessments });
    } catch (error) {
        console.error("Export readiness GET error:", error);

        return NextResponse.json(
            { error: "Failed to retrieve export readiness assessments." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    let requestedIds: {
        productId: string;
        marketResultId: string;
    } | null = null;
    try {
        const body = await request.json();
        const parsed = createAssessmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid request data.",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const { productId, marketResultId } = parsed.data;
        requestedIds = parsed.data;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                business: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found." },
                { status: 404 },
            );
        }

        const marketResult = await prisma.marketResult.findUnique({
            where: { id: marketResultId },
            include: {
                research: {
                    select: { productId: true },
                },
            },
        });

        if (!marketResult) {
            return NextResponse.json(
                { error: "Market result not found." },
                { status: 404 },
            );
        }

        // Prevent a checklist from being created for a market
        // that belongs to a different product.
        if (marketResult.research.productId !== productId) {
            return NextResponse.json(
                { error: "This market result does not belong to the selected product." },
                { status: 400 },
            );
        }

        const originCountryCode = normalizeOriginCountry(
            product.business.country,
        );

        if (!originCountryCode) {
            return NextResponse.json(
                {
                    error:
                        "Export readiness requirements are currently configured for businesses based in India only.",
                },
                { status: 400 },
            );
        }

        // Reuse an existing assessment for this product and market.
        const existing =
            await prisma.exportReadinessAssessment.findUnique({
                where: {
                    productId_marketResultId: {
                        productId,
                        marketResultId,
                    },
                },
                include: {
                    items: {
                        orderBy: [
                            { sortOrder: "asc" },
                            { category: "asc" },
                        ],
                    },
                },
            });

        if (existing) {
            return NextResponse.json(
                { assessment: existing, alreadyExists: true },
                { status: 200 },
            );
        }

        const requirements = await getMatchingExportRequirements({
            countryCode: marketResult.countryCode,
            originCountryCode,
            productCategory: product.business.category,
        });

        if (requirements.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No export requirements are currently configured for this destination and product category.",
                },
                { status: 404 },
            );
        }

        const assessment =
            await prisma.exportReadinessAssessment.create({
                data: {
                    businessId: product.businessId,
                    productId,
                    marketResultId,
                    totalItems: requirements.length,
                    completedItems: 0,
                    status: "IN_PROGRESS",
                    items: {
                        create: requirements.map((requirement, index) => ({
                            requirementId: requirement.id,
                            title: requirement.title,
                            description: requirement.description,
                            category: requirement.category,
                            priority: requirement.priority,
                            sourceName: requirement.sourceName,
                            sourceUrl: requirement.sourceUrl,
                            sourceCheckedAt: requirement.sourceCheckedAt,
                            status: "PENDING",
                            sortOrder: index,
                        })),
                    },
                },
                include: {
                    business: {
                        select: { id: true, name: true },
                    },
                    product: {
                        select: { id: true, name: true },
                    },
                    marketResult: {
                        select: {
                            id: true,
                            country: true,
                            countryCode: true,
                            rank: true,
                        },
                    },
                    items: {
                        orderBy: [
                            { sortOrder: "asc" },
                            { category: "asc" },
                        ],
                    },
                },
            });

        return NextResponse.json(
            { assessment, alreadyExists: false },
            { status: 201 },
        );
    } catch (error) {
        if (isPrismaUniqueConstraintError(error) && requestedIds) {
            const existing =
                await prisma.exportReadinessAssessment.findUnique({
                    where: {
                        productId_marketResultId: requestedIds,
                    },
                    include: { items: true },
                });

            if (existing) {
                return NextResponse.json(
                    { assessment: existing, alreadyExists: true },
                    { status: 200 },
                );
            }
        }

        console.error("Export readiness POST error:", error);

        return NextResponse.json(
            { error: "Failed to create export readiness assessment." },
            { status: 500 },
        );
    }
}
