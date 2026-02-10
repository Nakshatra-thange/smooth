import { Anthropic } from "@anthropic-ai/sdk";
// OpenAI will be added later without touching callers

import { logger } from "../utils/logger";

const AI_PROVIDER = process.env.AI_PROVIDER; // "anthropic" | "openai"
const CLAUDE_MODEL = process.env.CLAUDE_MODEL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

let anthropicClient: Anthropic | null = null;

/**
 * Initialize Anthropic client lazily
 */
const getAnthropicClient = (): Anthropic => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }

  return anthropicClient;
};

/**
 * Unified chat completion function
 * (Anthropic implemented now, OpenAI later)
 */
export const aiChat = async ({
  messages,
  tools,
}: {
  messages: any[];
  tools?: readonly any[];
}) => {
  try {
    if (AI_PROVIDER !== "anthropic") {
      throw new Error("Only Anthropic is enabled right now");
    }

    const client = getAnthropicClient();

    return await client.messages.create({
      model: CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages,
      tools: tools ? [...tools] : undefined,
    });
  } catch (error: any) {
    if (error?.status === 429) {
      logger.warn("AI rate limited", { provider: AI_PROVIDER });
    } else {
      logger.error("AI call failed", error);
    }
    throw error;
  }
};
