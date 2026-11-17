
import { prisma } from "@/lib/database";
import type { BusinessCategory } from "@/app/generated/prisma/client";

export function normalizeOriginCountry(country: string): string | null {
  const normalized = country.trim().toUpperCase();

  if (["IN", "IND", "INDIA"].includes(normalized)) {
    return "IN";
  }

  return null;
}

export async function getMatchingExportRequirements({
  countryCode,
  originCountryCode,
  productCategory,
}: {
  countryCode: string;
  originCountryCode: string;
  productCategory: BusinessCategory;
}) {
  return prisma.exportRequirement.findMany({
    where: {
      countryCode: countryCode.toUpperCase(),
      originCountryCode,
      isActive: true,
      OR: [
        { productCategory: null },
        { productCategory },
      ],
    },
    orderBy: [
      { priority: "asc" },
      { category: "asc" },
      { title: "asc" },
    ],
  });
}
