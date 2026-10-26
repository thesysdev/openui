import OpenAI from "openai";

/**
 * The model client from the environment: a Thesys key (Thesys's
 * OpenAI-compatible API) first, then an OpenAI key. Null when neither is set.
 * Each key has its own base URL variable, so a Thesys key is never sent to the
 * provider OPENAI_BASE_URL points at.
 */
export function modelClient(): { openai: OpenAI; model: string } | null {
  if (process.env.THESYS_API_KEY) {
    return {
      openai: new OpenAI({
        apiKey: process.env.THESYS_API_KEY,
        baseURL: process.env.THESYS_BASE_URL ?? "https://api.thesys.dev/v1/embed",
      }),
      model: process.env.OPENUI_MODEL ?? "openai/gpt-5.5",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      openai: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      }),
      model: process.env.OPENUI_MODEL ?? "gpt-5.5",
    };
  }
  return null;
}
