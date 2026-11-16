
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const scenario = await prisma.pricingScenario.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            name: true,
            currency: true,
          },
        },
        marketResult: {
          select: {
            country: true,
            countryCode: true,
          },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json(
        { error: "Pricing scenario not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("Fetch pricing scenario error:", error);

    return NextResponse.json(
      { error: "Unable to fetch pricing scenario." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const deleted = await prisma.pricingScenario.deleteMany({
      where: { id },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Pricing scenario not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Pricing scenario deleted successfully.",
    });
  } catch (error) {
    console.error("Delete pricing scenario error:", error);

    return NextResponse.json(
      { error: "Unable to delete pricing scenario." },
      { status: 500 },
    );
  }
}
