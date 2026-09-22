import { createOpenAI } from "@ai-sdk/openai";
import librarySpec from "@/generated/spec.json";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAutofix } from "@openuidev/server/vercel";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { appTools } from "@/lib/tools";

export const runtime = "nodejs";

const apiKey = requiredEnv("THESYS_API_KEY");

const openai = createOpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey,
});

const autofix = createAutofix({
  apiKey,
  library: librarySpec,
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
    system: generateSystemPrompt({ cloud: true, library: librarySpec }),
    messages: await convertToModelMessages(messages),
    tools: appTools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
  });

  return autofix.ai
    .stream({
      stream: toUIMessageStream({ stream: result.stream }),
      signal: req.signal,
    })
    .toResponse();
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
