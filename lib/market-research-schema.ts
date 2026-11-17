
import { z } from "zod";

const marketLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const marketAnalysisSchema = z.object({
  country: z.string().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/),

  demandLevel: marketLevelSchema,
  competitionLevel: marketLevelSchema,
  culturalFit: marketLevelSchema,
  exportPracticality: marketLevelSchema,

  targetCustomers: z.string().min(20),
  marketRationale: z.string().min(30),

  opportunities: z.array(z.string().min(5)).length(2),
  risks: z.array(z.string().min(5)).length(2),
  culturalConsiderations: z.array(z.string().min(5)).length(2),

  suggestedPriceMin: z.number().positive().nullable(),
  suggestedPriceMax: z.number().positive().nullable(),
  suggestedCurrency: z.string().length(3).nullable(),
});

export const marketResearchResponseSchema = z.object({
  summary: z.string().min(30),
  markets: z.array(marketAnalysisSchema).min(1).max(5),
});

export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>;
export type MarketResearchResponse = z.infer<
  typeof marketResearchResponseSchema
>;
