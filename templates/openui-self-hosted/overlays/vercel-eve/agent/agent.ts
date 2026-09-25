import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Chat Completions works against any OpenAI-compatible OPENAI_BASE_URL
// (OpenRouter, vLLM, Ollama, ...); the default Responses endpoint does not.
const model = openai.chat(process.env.OPENAI_MODEL ?? "gpt-5.2");

export default defineAgent({
  model,
  build: {
    externalDependencies: ["@openuidev/lang-core"],
  },
});
