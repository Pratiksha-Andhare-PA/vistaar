
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/database";

interface RouteContext {
    params: Promise<{ slug: string }>;
}

export async function GET(
    _request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const { slug } = await params;

        const storefront = await prisma.storefront.findFirst({
            where: {
                slug,
                status: "PUBLISHED",
            },
            select: {
                slug: true,
                locale: true,
                country: true,
                countryCode: true,

                productName: true,
                localizedTitle: true,
                localizedDescription: true,
                imageUrl: true,

                businessName: true,
                businessDescription: true,
                businessCity: true,
                businessCountry: true,

                currency: true,
                price: true,

                seoKeywords: true,
                culturalGuidance: true,
                marketingMessages: true,
                faqs: true,

                publishedAt: true,
            },
        });

        if (!storefront) {
            return NextResponse.json(
                { error: "Storefront not found or not publicly available." },
                { status: 404 },
            );
        }

        return NextResponse.json({ storefront });
    } catch (error) {
        console.error("Public storefront GET error:", error);

        return NextResponse.json(
            { error: "Unable to retrieve storefront." },
            { status: 500 },
        );
    }
}
