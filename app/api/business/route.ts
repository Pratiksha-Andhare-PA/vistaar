
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database";

const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name must contain at least 2 characters").max(120),
  businessType: z.enum([
    "INDIVIDUAL",
    "REGISTERED_BUSINESS",
    "COOPERATIVE",
    "ARTISAN_GROUP",
  ]),
  category: z.enum([
    "HANDLOOM",
    "JEWELLERY",
    "HANDICRAFTS",
    "APPAREL",
    "HOME_DECOR",
    "ORGANIC_PRODUCTS",
    "OTHER",
  ]),
  country: z.string().trim().min(2, "Enter a valid country").max(80),
  city: z.string().trim().min(2, "Enter a valid city").max(100),
  description: z.string().trim().min(20, "Description must contain at least 20 characters").max(2000),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().max(30).optional(),
  website: z.string().trim().url("Enter a valid URL including https://").optional().or(z.literal("")),
});

// GET /api/business - Retrieve registered businesses
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Fetch business error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve businesses" },
      { status: 500 }
    );
  }
}

// POST /api/business - Create a business profile
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const validation = businessSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Please correct the submitted information",
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  try {
    const data = validation.data;

    const business = await prisma.business.create({
      data: {
        name: data.name,
        businessType: data.businessType,
        category: data.category,
        country: data.country,
        city: data.city,
        description: data.description,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
      },
    });

    return NextResponse.json(
      {
        message: "Business profile created successfully",
        business,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create business error:", error);

    return NextResponse.json(
      { error: "Unable to save business profile. Please try again." },
      { status: 500 }
    );
  }
}
