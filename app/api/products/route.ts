import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database";

const productSchema = z.object({
  businessId: z.string().min(1, "Business is required"),
  name: z
    .string()
    .trim()
    .min(2, "Product name must contain at least 2 characters")
    .max(120, "Product name cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  price: z
    .string()
    .regex(
      /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
      "Enter a valid price with up to 2 decimal places",
    )
    .refine((value) => Number(value) > 0, "Price must be greater than zero"),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code")
    .default("INR"),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

// GET /api/products?businessId=...
// Retrieve products belonging to a specific business.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Fetch products error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve products" },
      { status: 500 },
    );
  }
}

// POST /api/products
// Create a product for an existing business.
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const validation = productSchema.safeParse(body);

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
    const data = validation.data;

    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Selected business does not exist" },
        { status: 404 },
      );
    }

    const product = await prisma.product.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        imageUrl: data.imageUrl || null,
      },
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      { error: "Unable to save product. Please try again." },
      { status: 500 },
    );
  }
}