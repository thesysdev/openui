import { cloudInstructions } from "@/lib/cloud-prompt";
import { ChatOpenAI } from "@langchain/openai";
import { openUIStreamTransformer } from "@openuidev/langchain/transformer";
import { createDeepAgent } from "deepagents";

import { getStockPrice, getWeather, searchWeb } from "./tools";

const MODEL = "google/gemini-3.6-flash-free";

// ChatOpenAI → POST /v1/embed/chat/completions
const model = new ChatOpenAI({
  model: MODEL,
  apiKey: process.env.THESYS_API_KEY,
  streaming: true,
  configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
});

export const graph = createDeepAgent({
  model,
  tools: [getWeather, getStockPrice, searchWeb],
  systemPrompt: cloudInstructions(
    [
      "You are an OpenUI assistant with weather, finance, and research tools.",
      "Use the tools when they help answer the user's request, then answer only in OpenUI Lang.",
    ].join("\n"),
  ),
  streamTransformers: [openUIStreamTransformer],
});
