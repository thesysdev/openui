import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { appTools } from "@/lib/tools";

export const runtime = "nodejs";

const openai = createOpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: requiredEnv("THESYS_API_KEY"),
});

export async function POST(req: Request) {
  const { messages, model: requestedModel } = (await req.json()) as {
    messages?: UIMessage[];
    model?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty UIMessage[]");
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return badRequest("model is not available in this agent");
  }

  const result = streamText({
    model: openai.chat(model),
    system: generateSystemPrompt({ cloud: true }),
    messages: await convertToModelMessages(messages),
    tools: appTools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
