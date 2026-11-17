
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database";

interface RouteContext {
    params: Promise<{ id: string }>;
}

const updateStorefrontSchema = z.object({
    action: z.enum(["approve", "publish", "unpublish"]),
});

export async function PATCH(
    request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const { id } = await params;
        const body: unknown = await request.json();

        const validation = updateStorefrontSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid storefront action.",
                    details: validation.error.flatten(),
                },
                { status: 400 },
            );
        }

        const { action } = validation.data;

        const storefront = await prisma.storefront.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
            },
        });

        if (!storefront) {
            return NextResponse.json(
                { error: "Storefront not found." },
                { status: 404 },
            );
        }

        if (action === "approve") {
            if (storefront.status !== "DRAFT") {
                return NextResponse.json(
                    { error: "Only draft storefronts can be approved." },
                    { status: 400 },
                );
            }

            const updated = await prisma.storefront.updateMany({
                where: {
                    id,
                    status: "DRAFT",
                },
                data: {
                    status: "APPROVED",
                    approvedAt: new Date(),
                },
            });

            if (updated.count === 0) {
                return NextResponse.json(
                    { error: "The storefront status changed. Please refresh and try again." },
                    { status: 409 },
                );
            }
        }

        if (action === "publish") {
            if (storefront.status !== "APPROVED") {
                return NextResponse.json(
                    { error: "Only approved storefronts can be published." },
                    { status: 400 },
                );
            }

            const updated = await prisma.storefront.updateMany({
                where: {
                    id,
                    status: "APPROVED",
                },
                data: {
                    status: "PUBLISHED",
                    publishedAt: new Date(),
                    unpublishedAt: null,
                },
            });

            if (updated.count === 0) {
                return NextResponse.json(
                    { error: "The storefront status changed. Please refresh and try again." },
                    { status: 409 },
                );
            }
        }

        if (action === "unpublish") {
            if (storefront.status !== "PUBLISHED") {
                return NextResponse.json(
                    { error: "Only published storefronts can be unpublished." },
                    { status: 400 },
                );
            }

            const updated = await prisma.storefront.updateMany({
                where: {
                    id,
                    status: "PUBLISHED",
                },
                data: {
                    status: "APPROVED",
                    publishedAt: null,
                    unpublishedAt: new Date(),
                },
            });

            if (updated.count === 0) {
                return NextResponse.json(
                    { error: "The storefront status changed. Please refresh and try again." },
                    { status: 409 },
                );
            }
        }

        const updatedStorefront = await prisma.storefront.findUnique({
            where: { id },
        });

        return NextResponse.json({
            message: `Storefront ${action} action completed successfully.`,
            storefront: updatedStorefront,
        });
    } catch (error) {
        console.error("Update storefront error:", error);

        return NextResponse.json(
            { error: "Unable to update storefront." },
            { status: 500 },
        );
    }
}
