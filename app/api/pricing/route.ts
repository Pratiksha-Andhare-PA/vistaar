
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateGlobalPrice } from "@/lib/pricing/pricing-calculator";
import { createPricingScenarioSchema } from "@/lib/pricing/pricing-schema";

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();

        const validation = createPricingScenarioSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid pricing scenario.",
                    details: validation.error.flatten(),
                },
                { status: 400 },
            );
        }

        const data = validation.data;

        // Fetch the product and market independently.
        const [product, marketResult] = await Promise.all([
            prisma.product.findUnique({
                where: { id: data.productId },
                select: {
                    id: true,
                    currency: true,
                },
            }),
            prisma.marketResult.findUnique({
                where: { id: data.marketResultId },
                select: {
                    id: true,
                    country: true,
                    countryCode: true,
                    research: {
                        select: {
                            productId: true,
                        },
                    },
                },
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
                { error: "Market research result not found." },
                { status: 404 },
            );
        }

        // A market result must belong to the selected product.
        if (marketResult.research.productId !== product.id) {
            return NextResponse.json(
                {
                    error: "The selected market does not belong to this product.",
                },
                { status: 400 },
            );
        }

        // Calculate on the server; never trust a client-calculated price.
        const result = calculateGlobalPrice(data.inputs);

        const scenario = await prisma.pricingScenario.create({
            data: {
                productId: product.id,
                marketResultId: marketResult.id,
                title: data.title || null,
                targetCurrency: data.targetCurrency,
                exchangeRate: data.inputs.exchangeRate,
                exchangeRateSource: data.exchangeRateSource || null,
                exchangeRateDate: data.exchangeRateDate
                    ? new Date(data.exchangeRateDate)
                    : null,
                inputs: {
                    ...data.inputs,
                },
                result: {
                    ...result,
                },
                recommendedPrice: result.recommendedPrice,
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
                message: "Pricing scenario saved successfully.",
                scenario,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Create pricing scenario error:", error);

        return NextResponse.json(
            { error: "Unable to create pricing scenario." },
            { status: 500 },
        );
    }
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

        const scenarios = await prisma.pricingScenario.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
            include: {
                marketResult: {
                    select: {
                        country: true,
                        countryCode: true,
                    },
                },
            },
        });

        return NextResponse.json({ scenarios });
    } catch (error) {
        console.error("Fetch pricing scenarios error:", error);

        return NextResponse.json(
            { error: "Unable to fetch pricing scenarios." },
            { status: 500 },
        );
    }
}
