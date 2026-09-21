import type { ChatCompletionUserMessageParam } from "openai/resources/chat/completions";
import type { HistoryStep, StoreHistoryTransport } from "./persist-turn";
import { storeHistoryTurn } from "./persist-turn";

export type AiSdkUserMessage = {
  role: string;
  parts: Array<{
    type: string;
    text?: string;
    mediaType?: string;
    url?: string;
  }>;
};

export type AiSdkHistoryStep = {
  text?: string;
  toolCalls?: { toolCallId: string; toolName: string; input: unknown }[];
  toolResults?: { toolCallId: string; output: unknown }[];
  content?: Array<{
    type: string;
    toolCallId?: string;
    error?: unknown;
  }>;
};

export type StoreAiSdkHistoryOptions = StoreHistoryTransport & {
  user: AiSdkUserMessage;
  steps: Iterable<AiSdkHistoryStep>;
};

/** Convert an AI SDK user UIMessage into a Chat Completions user message. */
export function aiSdkUserMessage(user: AiSdkUserMessage): ChatCompletionUserMessageParam {
  if (user.role !== "user") {
    throw new Error("The last message must be a user message");
  }

  const content: Exclude<ChatCompletionUserMessageParam["content"], string> = [];
  for (const part of user.parts) {
    if (part.type === "text") {
      content.push({ type: "text", text: part.text ?? "" });
      continue;
    }
    if (part.type === "file" && part.mediaType?.startsWith("image/") && part.url) {
      content.push({ type: "image_url", image_url: { url: part.url } });
      continue;
    }
    throw new Error("Only text and image messages are supported");
  }
  if (!content.length) {
    throw new Error("The user message is empty");
  }
  return { role: "user", content };
}

function aiSdkStepToHistory(step: AiSdkHistoryStep): HistoryStep {
  return {
    text: step.text,
    toolCalls: step.toolCalls,
    toolResults: [
      ...(step.toolResults ?? []),
      ...(step.content ?? []).flatMap((part) =>
        part.type === "tool-error" && part.toolCallId
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
  };
}

/**
 * Persist an AI SDK turn as Conversations API items.
 * Pass the latest user UIMessage and `result.steps` after the turn completes.
 */
export function storeAiSdkHistory(options: StoreAiSdkHistoryOptions) {
  return storeHistoryTurn({
    apiKey: options.apiKey,
    conversationId: options.conversationId,
    apiBaseUrl: options.apiBaseUrl,
    fetch: options.fetch,
    user: aiSdkUserMessage(options.user),
    steps: [...options.steps].map(aiSdkStepToHistory),
  });
}
