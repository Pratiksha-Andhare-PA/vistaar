
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export interface GenerateMarketResearchInput {
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
}

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export const MAX_OUTPUT_TOKENS = 2500;

const SYSTEM_PROMPT = `
You are an international market research assistant helping Indian
artisans and small businesses evaluate export opportunities.

Your task is to assess the suitability of a product for the requested
international markets.

IMPORTANT RULES:
- Treat your output as preliminary AI-generated assessments, not verified market research.
- Never invent statistics, market sizes, growth rates, citations, URLs,
  government regulations, or named research sources.
- Clearly distinguish reasonable hypotheses from established facts.
- Do not claim that demand is proven without reliable evidence.
- Consider product characteristics, likely customer segments,
  competition, cultural fit, and practical export risks.
- Assess culturalFit based on local preferences, traditions,
  aesthetics, and purchasing habits.
- Assess exportPracticality based on likely logistics, regulatory
  complexity, and accessibility of the target market.
- For culturalFit and exportPracticality, return exactly LOW, MEDIUM, or HIGH.
- Do not assume every product is suitable for every market.
- Provide useful, specific explanations rather than generic advice.
- Return exactly one market result for each requested country.
- Preserve the supplied country codes.
- Do not invent local prices. Set all suggested price fields to null.
- Return concise, actionable content.
`;

const marketResearchTool = {
  name: "submit_market_research",
  description:
    "Submit structured market assessments for all requested target countries.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string" },
      markets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            country: { type: "string" },
            countryCode: { type: "string" },
            demandLevel: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
            competitionLevel: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
            targetCustomers: { type: "string" },
            marketRationale: { type: "string" },
            opportunities: {
              type: "array",
              items: { type: "string" },
            },
            risks: {
              type: "array",
              items: { type: "string" },
            },
            culturalConsiderations: {
              type: "array",
              items: { type: "string" },
            },
            suggestedPriceMin: {
              type: ["number", "null"],
            },
            suggestedPriceMax: {
              type: ["number", "null"],
            },
            suggestedCurrency: {
              type: ["string", "null"],
            },
            culturalFit: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
            exportPracticality: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
          },
          required: [
            "country",
            "countryCode",
            "demandLevel",
            "competitionLevel",
            "targetCustomers",
            "marketRationale",
            "opportunities",
            "risks",
            "culturalConsiderations",
            "suggestedPriceMin",
            "suggestedPriceMax",
            "suggestedCurrency",
            "culturalFit",
            "exportPracticality",
          ],
        },
      },
    },
    required: ["summary", "markets"],
  },
};

/**
 * Build the exact prompt used for both budget estimation
 * and the Claude request.
 */
export function buildMarketResearchPrompt(
  input: GenerateMarketResearchInput,
) {
  const userMessage = JSON.stringify({
    task: "Compare the product's potential across the requested markets.",
    product: input.product,
    targetMarkets: input.countries,
    instructions: [
      "Assess cultural fit as LOW, MEDIUM, or HIGH based on product-market compatibility.",
      "Assess export practicality as LOW, MEDIUM, or HIGH based on likely regulatory, logistics, and market-entry complexity.",
      "Do not treat these assessments as verified statistics or legal advice.",
      "Assess each country independently.",
      "Identify likely target customers.",
      "Explain opportunities and risks.",
      "Consider cultural preferences and localization.",
      "Do not fabricate supporting evidence.",
    ],
  });

  return {
    system: SYSTEM_PROMPT,
    userMessage,
    promptText: SYSTEM_PROMPT + "\n" + userMessage,
  };
}

/**
 * Call Claude and return usage even when structured output
 * is missing or invalid.
 *
 * Validation deliberately happens in the API route,
 * after usage has been recorded.
 */
export async function generateMarketResearch(
  input: GenerateMarketResearchInput,
): Promise<{
  rawResult: unknown | null;
  usage: ClaudeUsage;
  model: string;
}> {
  if (input.countries.length === 0 || input.countries.length > 5) {
    throw new Error("Select between 1 and 5 target countries.");
  }

  const prompt = buildMarketResearchPrompt(input);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    tools: [marketResearchTool],
    tool_choice: {
      type: "tool",
      name: "submit_market_research",
    },
    system: prompt.system,
    messages: [
      {
        role: "user",
        content: prompt.userMessage,
      },
    ],
  });

  const toolResult = response.content.find(
    (block) => block.type === "tool_use",
  );

  return {
    rawResult:
      toolResult?.type === "tool_use"
        ? toolResult.input
        : null,
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens:
        response.usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
    },
  };
}
