
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { productLocalizationSchema } from "@/lib/localization-schema";

export interface GenerateProductLocalizationInput {
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
}

export const MAX_OUTPUT_TOKENS = 1800;

const localizationTool = {
  name: "generate_product_localization",
  description:
    "Generate culturally appropriate and market-specific product content.",
  input_schema: {
    type: "object",
    properties: {
      localizedTitle: {
        type: "string",
      },
      localizedDescription: {
        type: "string",
      },
      culturalGuidance: {
        type: "array",
        items: { type: "string" },
      },
      seoKeywords: {
        type: "array",
        items: { type: "string" },
      },
      marketingMessages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              enum: [
                "SOCIAL_MEDIA",
                "EMAIL",
                "ADVERTISEMENT",
              ],
            },
            headline: {
              type: "string",
            },
            message: {
              type: "string",
            },
          },
          required: ["channel", "headline", "message"],
        },
      },
      faqs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
      },
    },
    required: [
      "localizedTitle",
      "localizedDescription",
      "culturalGuidance",
      "seoKeywords",
      "marketingMessages",
      "faqs",
    ],
  },
} satisfies Anthropic.Tool;

export function buildLocalizationPrompt(
  input: GenerateProductLocalizationInput,
) {
  const { product, market, locale } = input;

  const system = `
You are a cross-border e-commerce localization specialist.

Your task is to adapt product content for a specific international
market and locale.

Rules:
- Localize meaning, tone, terminology and presentation, not just words.
- Write naturally for the requested locale: ${locale}.
- Preserve the product's actual identity, materials and characteristics.
- Do not invent certifications, awards, origins, quality claims,
  customer reviews, shipping promises or legal compliance claims.
- Never use cultural stereotypes or make assumptions about all
  customers in a country.
- Base recommendations on the supplied market research.
- Keep cultural guidance practical and respectful.
- Do not invent market statistics or customer preferences.
- If a detail is unknown, do not present it as a fact.
- Keep marketing content appropriate for the target audience.
- Return concise, usable content for a small business.
`;

  const userMessage = `
LOCALIZATION REQUEST

Target market:
${market.country} (${market.countryCode})

Target locale:
${locale}

ORIGINAL PRODUCT

Business: ${product.businessName}
Business country: ${product.businessCountry}
Product: ${product.name}
Category: ${product.category}
Description: ${product.description}
Current price: ${product.price} ${product.currency}

EXISTING MARKET RESEARCH

Target customers:
${market.targetCustomers}

Market rationale:
${market.marketRationale}

Demand level: ${market.demandLevel}
Competition level: ${market.competitionLevel}

Opportunities:
${market.opportunities.join("\n")}

Risks:
${market.risks.join("\n")}

Cultural considerations:
${market.culturalConsiderations.join("\n")}

Generate:
1. A natural, localized product title.
2. A compelling but factually accurate product description.
3. Two to five practical cultural recommendations.
4. Three to ten relevant SEO keywords.
5. Two to four marketing messages using the supported channels.
6. Three to five useful customer FAQs.

Do not change the original product's identity or invent business policies.
`;

  return { system, userMessage };
}

export async function generateProductLocalization(
  input: GenerateProductLocalizationInput,
) {
  const { system, userMessage } = buildLocalizationPrompt(input);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    tools: [localizationTool],
    tool_choice: {
      type: "tool",
      name: "generate_product_localization",
    },
  });

  const toolResult = response.content.find(
    (block) => block.type === "tool_use",
  );

  if (!toolResult || toolResult.type !== "tool_use") {
    throw new Error(
      "Claude did not return structured localization content.",
    );
  }

  const content = productLocalizationSchema.parse(
    toolResult.input,
  );

  return {
    content,
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
