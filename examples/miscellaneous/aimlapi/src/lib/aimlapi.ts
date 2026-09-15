import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const AIMLAPI_BASE_URL = "https://api.aimlapi.com/v1";

/** Chat model to run; any vendor/model id from https://aimlapi.com/models. */
export const AIMLAPI_MODEL = process.env.AIMLAPI_MODEL?.trim() || "openai/gpt-5";

/**
 * AI/ML API is an OpenAI-compatible gateway serving 1,000+ models under one
 * key. The two X-AIMLAPI-* headers tell the gateway which integration the
 * traffic comes from; they are harmless elsewhere but only mean something
 * on api.aimlapi.com, so keep them with that base URL.
 */
export const aimlapi = createOpenAICompatible({
  name: "aimlapi",
  baseURL: AIMLAPI_BASE_URL,
  apiKey: process.env.AIMLAPI_API_KEY,
  headers: {
    "HTTP-Referer": "https://github.com/thesysdev/openui",
    "X-Title": "OpenUI",
    "X-AIMLAPI-Source": "agent/openui",
    "X-AIMLAPI-Partner-ID": "part_PLACEHOLDER_OPENUI",
  },
});
