
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database";

const updateItemSchema = z.object({
    status: z.enum(["PENDING", "COMPLETED", "NOT_APPLICABLE"]).optional(),
    notes: z.string().max(5000).nullable().optional(),
}).refine(
    (data) => data.status !== undefined || data.notes !== undefined,
    { message: "At least one field must be provided." },
);

type RouteContext = {
    params: Promise<{
        id: string;
        itemId: string;
    }>;
};

export async function PATCH(
    request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const { id, itemId } = await params;
        const body = await request.json();

        const parsed = updateItemSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid request data.",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const existingItem = await prisma.exportReadinessItem.findFirst({
            where: {
                id: itemId,
                assessmentId: id,
            },
            select: {
                id: true,
            },
        });

        if (!existingItem) {
            return NextResponse.json(
                { error: "Checklist item not found." },
                { status: 404 },
            );
        }

        const { status, notes } = parsed.data;

        const completedAt =
            status === undefined
                ? undefined
                : status === "PENDING"
                    ? null
                    : new Date();

        const result = await prisma.$transaction(async (tx) => {
            await tx.exportReadinessItem.update({
                where: { id: itemId },
                data: {
                    ...(status !== undefined && {
                        status,
                        completedAt,
                    }),
                    ...(notes !== undefined && { notes }),
                },
            });

            const items = await tx.exportReadinessItem.findMany({
                where: { assessmentId: id },
                select: { status: true },
            });

            const totalItems = items.length;
            const completedItems = items.filter(
                (item) =>
                    item.status === "COMPLETED" ||
                    item.status === "NOT_APPLICABLE",
            ).length;

            const assessmentStatus =
                totalItems > 0 && completedItems === totalItems
                    ? "COMPLETED"
                    : "IN_PROGRESS";

            const assessment =
                await tx.exportReadinessAssessment.update({
                    where: { id },
                    data: {
                        totalItems,
                        completedItems,
                        status: assessmentStatus,
                    },
                    include: {
                        business: true,
                        product: true,
                        marketResult: true,
                        items: {
                            orderBy: [
                                { sortOrder: "asc" },
                                { category: "asc" },
                            ],
                        },
                    },
                });

            return assessment;
        });

        return NextResponse.json({
            message: "Checklist item updated successfully.",
            assessment: result,
        });
    } catch (error) {
        console.error("Export readiness item PATCH error:", error);

        return NextResponse.json(
            { error: "Failed to update checklist item." },
            { status: 500 },
        );
    }
}
