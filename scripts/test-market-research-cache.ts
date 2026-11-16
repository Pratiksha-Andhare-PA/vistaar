import assert from "node:assert/strict";
import {
  generateMarketResearchCacheKey,
} from "../lib/market-research-cache";

const baseInput = {
  productId: "product-123",
  product: {
    name: "Kanjeevaram Saree",
    description: "Red Golden Zari Kanjivaram Silk Saree",
    price: "2499",
    currency: "inr",
    businessName: "Shree Handloom Creations",
    businessCountry: "India",
    category: "Textiles",
  },
  countries: [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "AE", name: "United Arab Emirates" },
  ],
  model: "claude-haiku-5-5",
};

function key(input: typeof baseInput) {
  return generateMarketResearchCacheKey(input);
}

function main() {
  const originalKey = key(baseInput);

  // Identical inputs must produce identical keys.
  assert.equal(key(baseInput), originalKey);

  // Country selection order must not affect the key.
  assert.equal(
    key({
      ...baseInput,
      countries: [...baseInput.countries].reverse(),
    }),
    originalKey,
  );

  // Currency casing and surrounding product-name whitespace are normalized.
  assert.equal(
    key({
      ...baseInput,
      product: {
        ...baseInput.product,
        name: "  Kanjeevaram Saree  ",
        currency: "INR",
      },
    }),
    originalKey,
  );

  // Meaningful input changes must produce different keys.
  assert.notEqual(
    key({
      ...baseInput,
      product: {
        ...baseInput.product,
        price: "2999",
      },
    }),
    originalKey,
  );

  assert.notEqual(
    key({
      ...baseInput,
      model: "different-model",
    }),
    originalKey,
  );

  assert.notEqual(
    key({
      ...baseInput,
      countries: baseInput.countries.slice(0, 2),
    }),
    originalKey,
  );

  console.log("Market research cache-key tests passed.");
  console.log("Deterministic key:", originalKey);
}

main();
