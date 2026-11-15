
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database";

// Supported country codes use ISO 3166-1 alpha-2 format.
const researchSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, "Product ID is required"),

  countries: z
    .array(
      z
        .string()
        .trim()
        .transform((value) => value.toUpperCase())
        .pipe(
          z.string().regex(
            /^[A-Z]{2}$/,
            "Each country must have a valid 2-letter country code",
          ),
        ),
    )
    .min(1, "Select at least one target country")
    .max(5, "You can compare a maximum of 5 countries")
    .refine(
      (countries) => new Set(countries).size === countries.length,
      "Duplicate countries are not allowed",
    ),
});

// POST /api/market-research
// Create a market research request for an existing product.
export async function POST(request: Request) {
  let body: unknown;

  // Parse request body.
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  // Validate request data.
  const validation = researchSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Please correct the submitted information",
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const { productId, countries } = validation.data;

    // Check whether the product exists.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        business: {
          select: {
            id: true,
            name: true,
            country: true,
            category: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Prevent research against the business's own country.
    // Country names will be mapped to ISO codes in a later step.
    const research = await prisma.marketResearch.create({
      data: {
        productId,
        requestedCountries: countries,
        status: "PENDING",
      },
      select: {
        id: true,
        productId: true,
        requestedCountries: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Market research request created successfully",
        research,
        product: {
          id: product.id,
          name: product.name,
          businessName: product.business.name,
          businessCountry: product.business.country,
          category: product.business.category,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create market research error:", error);

    return NextResponse.json(
      {
        error: "Unable to create market research request. Please try again.",
      },
      { status: 500 },
    );
  }
}
