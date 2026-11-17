
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

Produce preliminary AI-generated assessments, not verified market research.

RULES:
- Never invent statistics, market sizes, growth rates, citations,
  URLs, regulations, or named research sources.
- Distinguish reasonable hypotheses from established facts.
- Assess product characteristics, likely customers, competition,
  cultural fit, and export practicality.
- Use LOW, MEDIUM, or HIGH for demandLevel, competitionLevel,
  culturalFit, and exportPracticality.
- Return exactly one result per requested country.
- Preserve each supplied country code exactly.
- Set suggestedPriceMin, suggestedPriceMax, and suggestedCurrency to null.
- Keep all explanations concise and specific.

OUTPUT REQUIREMENTS:
- Summary: 30-60 words.
- targetCustomers: 20-35 words.
- marketRationale: 30-50 words.
- opportunities: exactly 2 concise items.
- risks: exactly 2 concise items.
- culturalConsiderations: exactly 2 concise items.
- Each array item must contain at least 5 characters.
- Do not repeat the same information across fields.
`;


const marketResearchTool = {
  name: "submit_market_research",
  description:
    "Submit structured market assessments for all requested target countries.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string", minLength: 30 },
      markets: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            country: { type: "string", minLength: 1 },
            countryCode: {
              type: "string",
              pattern: "^[A-Z]{2}$",
            },
            demandLevel: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
            competitionLevel: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
            },
            targetCustomers: { type: "string", minLength: 20 },
            marketRationale: { type: "string", minLength: 30 },
            opportunities: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string", minLength: 5 },
            },
            risks: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string", minLength: 5 },
            },
            culturalConsiderations: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string", minLength: 5 },
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
  stopReason: string | null;
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
    stopReason: response.stop_reason,
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
