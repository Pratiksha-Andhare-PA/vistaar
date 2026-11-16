
import type { MarketAnalysis } from "@/lib/market-research-schema";

type MarketLevel = "LOW" | "MEDIUM" | "HIGH";

interface ScoreBreakdown {
  demand: number;
  competition: number;
  culturalFit: number;
  exportPracticality: number;
  total: number;
}

export interface ScoredMarket extends MarketAnalysis {
  opportunityScore: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface RankedMarket extends ScoredMarket {
  rank: number;
}

const SCORE_WEIGHTS: Record<
  "demand" | "competition" | "culturalFit" | "exportPracticality",
  Record<MarketLevel, number>
> = {
  demand: {
    LOW: 0,
    MEDIUM: 20,
    HIGH: 40,
  },
  competition: {
    LOW: 25,
    MEDIUM: 12,
    HIGH: 0,
  },
  culturalFit: {
    LOW: 0,
    MEDIUM: 10,
    HIGH: 20,
  },
  exportPracticality: {
    LOW: 0,
    MEDIUM: 8,
    HIGH: 15,
  },
};

export function calculateMarketScore(
  market: MarketAnalysis,
): ScoredMarket {
  const scoreBreakdown: ScoreBreakdown = {
    demand: SCORE_WEIGHTS.demand[market.demandLevel],
    competition: SCORE_WEIGHTS.competition[market.competitionLevel],
    culturalFit: SCORE_WEIGHTS.culturalFit[market.culturalFit],
    exportPracticality:
      SCORE_WEIGHTS.exportPracticality[market.exportPracticality],
    total: 0,
  };

  scoreBreakdown.total =
    scoreBreakdown.demand +
    scoreBreakdown.competition +
    scoreBreakdown.culturalFit +
    scoreBreakdown.exportPracticality;

  return {
    ...market,
    opportunityScore: scoreBreakdown.total,
    scoreBreakdown,
  };
}

/**
 * Scores and ranks markets from highest to lowest.
 * Country code provides a stable tie-breaker.
 */
export function rankMarkets(
  markets: MarketAnalysis[],
): RankedMarket[] {
  return markets
    .map(calculateMarketScore)
    .sort(
      (a, b) =>
        b.opportunityScore - a.opportunityScore ||
        a.countryCode.localeCompare(b.countryCode),
    )
    .map((market, index) => ({
      ...market,
      rank: index + 1,
    }));
}
