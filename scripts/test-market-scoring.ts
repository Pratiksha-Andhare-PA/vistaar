
import assert from "node:assert/strict";
import {
  calculateMarketScore,
  rankMarkets,
} from "../lib/market-scoring";
import type { MarketAnalysis } from "../lib/market-research-schema";

const createMarket = (
  country: string,
  countryCode: string,
  demandLevel: "LOW" | "MEDIUM" | "HIGH",
  competitionLevel: "LOW" | "MEDIUM" | "HIGH",
  culturalFit: "LOW" | "MEDIUM" | "HIGH",
  exportPracticality: "LOW" | "MEDIUM" | "HIGH",
): MarketAnalysis => ({
  country,
  countryCode,
  demandLevel,
  competitionLevel,
  culturalFit,
  exportPracticality,
  targetCustomers: "Customers interested in premium handcrafted products.",
  marketRationale: "The market may offer opportunities for differentiated artisan products.",
  opportunities: ["Growing interest in handcrafted products", "Potential premium positioning"],
  risks: ["Import requirements need verification", "Customer preferences require validation"],
  culturalConsiderations: ["Adapt product storytelling to local preferences", "Use locally appropriate imagery"],
  suggestedPriceMin: null,
  suggestedPriceMax: null,
  suggestedCurrency: null,
});

async function main() {
  const marketA = createMarket(
    "United States", "US", "HIGH", "MEDIUM", "HIGH", "MEDIUM",
  );

  const marketB = createMarket(
    "United Kingdom", "GB", "MEDIUM", "LOW", "MEDIUM", "HIGH",
  );

  const marketC = createMarket(
    "United Arab Emirates", "AE", "LOW", "HIGH", "LOW", "LOW",
  );

  const scoreA = calculateMarketScore(marketA);
  const scoreB = calculateMarketScore(marketB);
  const scoreC = calculateMarketScore(marketC);

  assert.equal(scoreA.opportunityScore, 80);
  assert.equal(scoreB.opportunityScore, 70);
  assert.equal(scoreC.opportunityScore, 0);

  const ranked = rankMarkets([marketC, marketA, marketB]);

  assert.deepEqual(
    ranked.map((market) => market.countryCode),
    ["US", "GB", "AE"],
  );

  assert.deepEqual(
    ranked.map((market) => market.rank),
    [1, 2, 3],
  );

  console.log("Market scoring tests passed.");
  console.table(
    ranked.map((market) => ({
      country: market.country,
      score: market.opportunityScore,
      rank: market.rank,
      demand: market.scoreBreakdown.demand,
      competition: market.scoreBreakdown.competition,
      culturalFit: market.scoreBreakdown.culturalFit,
      exportPracticality: market.scoreBreakdown.exportPracticality,
    })),
  );
}

main().catch((error) => {
  console.error("Market scoring tests failed:", error);
  process.exitCode = 1;
});
