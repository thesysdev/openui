import { cloudInstructions } from "@/lib/cloud-prompt";
import { ChatOpenAI } from "@langchain/openai";
import { openUIStreamTransformer } from "@openuidev/langchain/transformer";
import { createDeepAgent, GENERAL_PURPOSE_SUBAGENT } from "deepagents";
import { createMiddleware } from "langchain";
import { z } from "zod";

import { getStockPrice, getWeather, searchWeb } from "./tools";

const MODEL = "google/gemini-3.6-flash-free";

// ChatOpenAI → POST /v1/embed/chat/completions
function cloudModel(sessionId?: string) {
  return new ChatOpenAI({
    model: MODEL,
    apiKey: process.env.THESYS_API_KEY,
    streaming: true,
    configuration: {
      baseURL: "https://api.thesys.dev/v1/embed",
      defaultHeaders: sessionId ? { "x-thesys-session-id": sessionId } : undefined,
    },
  });
}

// The route puts the chat's threadId in the run input as `sessionId`. Each model call
// sends it, so the Gateway groups the thread's turns into one session.
const sessionHeader = createMiddleware({
  name: "OpenUICloudSession",
  stateSchema: z.object({ sessionId: z.string().optional() }),
  wrapModelCall: (request, handler) => {
    const { sessionId } = request.state;
    return handler(sessionId ? { ...request, model: cloudModel(sessionId) } : request);
  },
});

const tools = [getWeather, getStockPrice, searchWeb];

export const graph = createDeepAgent({
  model: cloudModel(),
  tools,
  systemPrompt: cloudInstructions(
    [
      "You are an OpenUI assistant with weather, finance, and research tools.",
      "Use the tools when they help answer the user's request, then answer only in OpenUI Lang.",
    ].join("\n"),
  ),
  middleware: [sessionHeader],
  // The built-in general-purpose subagent with the same middleware, so the model calls of the
  // `task` tool also send the session ID.
  subagents: [{ ...GENERAL_PURPOSE_SUBAGENT, tools, middleware: [sessionHeader] }],
  streamTransformers: [openUIStreamTransformer],
});
