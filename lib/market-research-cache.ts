
import { createHash } from "node:crypto";

export const MARKET_RESEARCH_PROMPT_VERSION = "v1";

interface MarketResearchCacheInput {
  productId: string;
  product: {
    name: string;
    description: string;
    price: string;
    currency: string;
    businessName: string;
    businessCountry: string;
    category: string;
  };
  countries: Array<{
    code: string;
    name: string;
  }>;
  model: string;
}

/**
 * Generates a deterministic cache key for market research.
 *
 * Changes to product details, target countries, model,
 * or prompt version produce a different key.
 *
 * Increment MARKET_RESEARCH_PROMPT_VERSION whenever
 * the research prompt or its expected output changes.
 */
export function generateMarketResearchCacheKey(
  input: MarketResearchCacheInput,
): string {
  const canonicalInput = {
    promptVersion: MARKET_RESEARCH_PROMPT_VERSION,
    model: input.model,
    productId: input.productId,
    product: {
      name: input.product.name.trim(),
      description: input.product.description.trim(),
      price: input.product.price,
      currency: input.product.currency.toUpperCase(),
      businessName: input.product.businessName.trim(),
      businessCountry: input.product.businessCountry.trim(),
      category: input.product.category,
    },
    countries: input.countries
      .map((country) => ({
        code: country.code.toUpperCase(),
        name: country.name,
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalInput))
    .digest("hex");
}
