
import { createHash } from "node:crypto";

export const LOCALIZATION_PROMPT_VERSION = "v1";

interface LocalizationCacheInput {
  productId: string;
  product: {
    name: string;
    description: string;
    category: string;
    price: string;
    currency: string;
    businessName: string;
    businessCountry: string;
  };
  market: {
    id: string;
    country: string;
    countryCode: string;
    targetCustomers: string;
    marketRationale: string;
    demandLevel: string;
    competitionLevel: string;
    opportunities: string[];
    risks: string[];
    culturalConsiderations: string[];
  };
  locale: string;
  model: string;
}

export function generateLocalizationCacheKey(
  input: LocalizationCacheInput,
): string {
  const canonicalInput = {
    promptVersion: LOCALIZATION_PROMPT_VERSION,
    model: input.model,

    productId: input.productId,
    product: {
      name: input.product.name.trim(),
      description: input.product.description.trim(),
      category: input.product.category,
      price: input.product.price,
      currency: input.product.currency.toUpperCase(),
      businessName: input.product.businessName.trim(),
      businessCountry: input.product.businessCountry.trim(),
    },

    market: {
      id: input.market.id,
      country: input.market.country.trim(),
      countryCode: input.market.countryCode.toUpperCase(),
      targetCustomers: input.market.targetCustomers.trim(),
      marketRationale: input.market.marketRationale.trim(),
      demandLevel: input.market.demandLevel,
      competitionLevel: input.market.competitionLevel,
      opportunities: input.market.opportunities,
      risks: input.market.risks,
      culturalConsiderations:
        input.market.culturalConsiderations,
    },

    locale: input.locale.trim(),
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalInput))
    .digest("hex");
}
