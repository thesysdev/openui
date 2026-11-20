import librarySpec from "@/generated/spec.json";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { requiredEnv } from "@/lib/env";
import { storeTurn } from "@/lib/history";
import { resolveRequestedModel } from "@/lib/models";
import { appTools } from "@/lib/tools";

// The generated spec carries the library and its prompt options; generateSystemPrompt takes them separately.
const { promptOptions, ...library } = librarySpec;

export const runtime = "nodejs";

const apiKey = requiredEnv("THESYS_API_KEY");
const openai = createOpenAI({ baseURL: "https://api.thesys.dev/v1/embed", apiKey });

export async function POST(req: Request) {
  const {
    messages,
    threadId,
    model: requestedModel,
  } = (await req.json()) as {
    messages?: UIMessage[];
    threadId?: string;
    model?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty UIMessage[]");
  }

  if (typeof threadId !== "string" || !threadId.trim()) {
    return badRequest("threadId is required");
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return badRequest("model is not available in this agent");
  }

  const modelMessages = await convertToModelMessages(messages);
  const question = modelMessages.at(-1);
  if (question?.role !== "user") {
    return badRequest("messages must end with a user message");
  }

  const result = streamText({
    model: openai.chat(model),
    system: generateSystemPrompt({ cloud: true, library, promptOptions }),
    messages: modelMessages,
    tools: appTools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
    // The thread id groups the thread's turns into one session on the Gateway.
    headers: { "x-thesys-session-id": threadId },
    // Save the completed turn so OpenUI Cloud storage can reload the thread.
    // Only the new user message and this turn's replies; never the replayed history.
    onEnd: async ({ responseMessages }) => {
      try {
        await storeTurn({
          apiKey,
          conversationId: threadId,
          messages: [question, ...responseMessages],
        });
      } catch (error) {
        console.error("Failed to save the turn to OpenUI Cloud:", error);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
