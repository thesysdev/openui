import librarySpec from "@/generated/spec.json";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAutofix } from "@openuidev/server/vercel";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

import {
  ConversationAccessError,
  assertConversationAccess,
  storeChatCompletionTurn,
  type CompletionUserMessage,
} from "@/lib/chat-completion-history";
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
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: UIMessage[];
    model?: unknown;
  };

  if (typeof threadId !== "string") return badRequest("threadId is required");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty UIMessage[]");
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return badRequest("model is not available in this agent");
  }

  const latest = messages.at(-1);
  if (latest?.role !== "user") return badRequest("The last message must be a user message");
  const content: Exclude<CompletionUserMessage["content"], string> = [];
  for (const part of latest.parts) {
    if (part.type === "text") content.push({ type: "text", text: part.text });
    else if (part.type === "file" && part.mediaType.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: part.url } });
    } else return badRequest("Only text and image messages are supported");
  }
  if (!content.length) return badRequest("The user message is empty");
  const user: CompletionUserMessage = { role: "user", content };
  try {
    await assertConversationAccess(threadId);
  } catch (error) {
    return Response.json(
      { error: { message: "Unable to access Cloud conversation" } },
      { status: error instanceof ConversationAccessError ? error.status : 503 },
    );
  }

  const result = streamText({
    model: openai.chat(model),
    system: generateSystemPrompt({ cloud: true, library: librarySpec }),
    messages: await convertToModelMessages(messages),
    tools: appTools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
        // Autofix repairs invalid OpenUI before finish. Hold finish until
        // persistence succeeds — onFinish callbacks swallow thrown errors.
        let failed = false;
        let finish: Extract<UIMessageChunk, { type: "finish" }> | undefined;
        for await (const chunk of autofix.ai.stream({
          stream: result.toUIMessageStream(),
          messages: [user],
          signal: req.signal,
        }).chunks) {
          if (chunk.type === "error" || chunk.type === "abort") failed = true;
          if (chunk.type === "finish") {
            finish = chunk;
            continue;
          }
          writer.write(chunk);
        }
        if (failed || req.signal.aborted) return;
        if (finish?.finishReason !== "stop") {
          throw new Error("The model did not complete the turn");
        }
        await storeChatCompletionTurn({
          conversationId: threadId,
          user,
          steps: (await result.steps).map((step) => ({
            text: step.text,
            toolCalls: step.toolCalls,
            toolResults: [
              ...step.toolResults,
              ...step.content.flatMap((part) =>
                part.type === "tool-error"
                  ? [
                      {
                        toolCallId: part.toolCallId,
                        output: {
                          error: part.error instanceof Error ? part.error.message : part.error,
                        },
                      },
                    ]
                  : [],
              ),
            ],
          })),
        });
        writer.write(finish);
      },
      onError: () =>
        "The turn could not be completed or saved. Reload the conversation before retrying.",
    }),
  });
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
