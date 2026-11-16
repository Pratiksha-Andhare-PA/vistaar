import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not configured");
}

export const anthropic = new Anthropic({
  apiKey,
  maxRetries: 0,
});

export const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL || "claude-haiku-5-5";