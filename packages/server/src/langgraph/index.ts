import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "../openai/store-conversation-items.js";
import type { StoreChatCompletionHistoryOptions } from "../openai/types.js";

/** A completed LangChain message instance or a plain LangGraph message. */
export interface LangGraphMessage {
  type?: string;
  getType?: () => string;
  content: string | readonly unknown[];
  tool_calls?: readonly { id?: string; name: string; args: unknown }[];
  tool_call_id?: string;
}

export type StoreLangGraphHistoryOptions = Omit<StoreChatCompletionHistoryOptions, "messages"> & {
  /** Only completed messages from the new turn, never the full replay. */
  messages: readonly LangGraphMessage[];
};

function textContent(content: LangGraphMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("");
}

function toChatCompletionMessages(
  messages: readonly LangGraphMessage[],
): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];
  for (const message of messages) {
    const type = message.getType?.() ?? message.type;
    if (type === "human" || type === "user") {
      // LangChain's text/image_url content blocks use the Chat Completions shape.
      const content: Extract<ChatCompletionMessageParam, { role: "user" }>["content"] =
        typeof message.content === "string" ? message.content : [];
      if (Array.isArray(content) && Array.isArray(message.content)) {
        for (const part of message.content) {
          if (typeof part !== "object" || part === null) continue;
          const block = part as { type?: unknown; text?: unknown; image_url?: unknown };
          if (block.type === "text" && typeof block.text === "string") {
            content.push({ type: "text", text: block.text });
          } else if (block.type === "image_url") {
            const image = block.image_url;
            if (typeof image === "string") {
              content.push({ type: "image_url", image_url: { url: image } });
            } else if (
              typeof image === "object" &&
              image !== null &&
              "url" in image &&
              typeof image.url === "string"
            ) {
              const detail = "detail" in image ? image.detail : undefined;
              content.push({
                type: "image_url",
                image_url: {
                  url: image.url,
                  detail: detail === "low" || detail === "high" ? detail : "auto",
                },
              });
            }
          }
        }
      }
      result.push({ role: "user", content });
    } else if (type === "ai" || type === "assistant") {
      result.push({
        role: "assistant",
        content: textContent(message.content),
        tool_calls: (message.tool_calls ?? [])
          .filter((call) => call.id && call.name)
          .map((call) => ({
            type: "function",
            id: call.id!,
            function: {
              name: call.name,
              arguments:
                typeof call.args === "string" ? call.args : JSON.stringify(call.args ?? {}),
            },
          })),
      });
    } else if (type === "tool" && message.tool_call_id) {
      result.push({
        role: "tool",
        tool_call_id: message.tool_call_id,
        content: textContent(message.content),
      });
    }
    // System/developer instructions and unknown message types are not history.
  }
  return result;
}

/** Convert a new LangGraph turn, including tool calls/results, into conversation items. */
export function langGraphMessagesToItems(messages: readonly LangGraphMessage[]) {
  return chatCompletionMessagesToItems(toChatCompletionMessages(messages));
}

/** Append a new turn to an existing conversation. Do not pass replayed history or chunks. */
export function storeLangGraphHistory(options: StoreLangGraphHistoryOptions) {
  return storeChatCompletionHistory({
    ...options,
    messages: toChatCompletionMessages(options.messages),
  });
}
