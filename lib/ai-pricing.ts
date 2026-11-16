
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

interface ModelPricing {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheRead: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-haiku-5-5": {
    input: 0.10,
    output: 0.50,
    cacheWrite5m: 0.125,
    cacheRead: 0.01,
  },
};

export function calculateClaudeCostUsd(
  model: string,
  usage: TokenUsage,
): number {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    throw new Error(`Pricing not configured for model: ${model}`);
  }

  const fields: (keyof TokenUsage)[] = [
    "inputTokens",
    "outputTokens",
    "cacheReadInputTokens",
    "cacheCreationInputTokens",
  ];

  for (const field of fields) {
    const value = usage[field];

    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Invalid token usage: ${field}`);
    }
  }

  const cost =
    (usage.inputTokens * pricing.input +
      usage.outputTokens * pricing.output +
      usage.cacheCreationInputTokens * pricing.cacheWrite5m +
      usage.cacheReadInputTokens * pricing.cacheRead) /
    1_000_000;

  return Number(cost.toFixed(8));
}
