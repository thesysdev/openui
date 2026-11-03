import { storeChatCompletionHistory } from "@openuidev/server/openai";
import type { ModelMessage } from "ai";
import { baseUrl } from "./openui";

// The Chat Completions shapes saved here (the full union lives in the `openai` package).
type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

function textOf(content: ModelMessage["content"]): string {
  if (typeof content === "string") return content;
  return content.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function outputOf(output: { type: string; value?: unknown }): string {
  if (typeof output.value === "string") return output.value;
  return JSON.stringify(output.value ?? output);
}

/** AI SDK model messages → the Chat Completions messages OpenUI Cloud stores. */
function toChatCompletionMessages(messages: ModelMessage[]): ChatMessage[] {
  return messages.flatMap((message): ChatMessage[] => {
    if (message.role === "user") return [{ role: "user", content: textOf(message.content) }];
    if (message.role === "assistant") {
      const parts = typeof message.content === "string" ? [] : message.content;
      const toolCalls = parts.flatMap((part) =>
        part.type === "tool-call"
          ? [
              {
                id: part.toolCallId,
                type: "function" as const,
                function: { name: part.toolName, arguments: JSON.stringify(part.input ?? {}) },
              },
            ]
          : [],
      );
      return [
        {
          role: "assistant",
          content: textOf(message.content),
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        },
      ];
    }
    if (message.role === "tool") {
      return message.content.flatMap((part) =>
        part.type === "tool-result"
          ? [
              {
                role: "tool" as const,
                tool_call_id: part.toolCallId,
                content: outputOf(part.output),
              },
            ]
          : [],
      );
    }
    return [];
  });
}

/**
 * Saves one turn, the new user message plus the model's replies and tool results, to the OpenUI
 * Cloud conversation, so the thread reloads with its dashboards. Never the replayed history.
 */
export async function storeTurn(conversationId: string, messages: ModelMessage[]) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");
  await storeChatCompletionHistory({
    apiKey,
    apiBaseUrl: baseUrl,
    conversationId,
    messages: toChatCompletionMessages(messages),
  });
}
