import { openAIConversationMessageFormat } from "../stream/formats/openai-conversation-message-format";
import type { Message } from "../types/message";
import type { CloudConversationItem } from "./wire";

/**
 * Convert /v1 conversation items to AG-UI Message[]. Each item is normalized
 * into the OpenAI ConversationItem shape that openAIConversationMessageFormat
 * .fromApi expects, then delegated — the grouping logic (function_call →
 * assistant toolCalls, function_call_output → ToolMessage) stays in the SDK.
 *
 * Normalizations:
 *  - message content: assistant outputs arrive as part arrays; user inputs
 *    arrive as a plain string → wrap strings as a single text part.
 *  - function_call / function_call_output: a malformed row (missing the
 *    top-level call_id/name/output) is skipped so it can't crash fromApi.
 *  - other item types are skipped.
 */
function normalizeItem(item: CloudConversationItem): Record<string, unknown> | null {
  switch (item.type) {
    case "message": {
      const content = item.content;
      const parts = Array.isArray(content)
        ? content
        : [
            {
              type: item.role === "assistant" ? "output_text" : "input_text",
              text: typeof content === "string" ? content : "",
            },
          ];
      return {
        id: item.id,
        type: "message",
        role: item.role ?? "user",
        status: item.status ?? "completed",
        content: parts,
      };
    }

    case "function_call": {
      if (typeof item.call_id !== "string" || typeof item.name !== "string") return null;
      return {
        id: item.id,
        type: "function_call",
        call_id: item.call_id,
        name: item.name,
        arguments:
          typeof item.arguments === "string"
            ? item.arguments
            : JSON.stringify(item.arguments ?? {}),
      };
    }

    case "function_call_output": {
      if (typeof item.call_id !== "string" || item.output === undefined) return null;
      return {
        id: item.id,
        type: "function_call_output",
        call_id: item.call_id,
        output: item.output,
      };
    }

    default:
      return null;
  }
}

export function cloudItemsToMessages(items: CloudConversationItem[]): Message[] {
  const normalized = items
    .map(normalizeItem)
    .filter((i): i is Record<string, unknown> => i !== null);
  return openAIConversationMessageFormat.fromApi(normalized);
}
