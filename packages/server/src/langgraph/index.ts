import {
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "../openai/store-conversation-items.js";
import type { StoreChatCompletionHistoryOptions } from "../openai/types.js";

export type StoreLangGraphHistoryOptions = Omit<StoreChatCompletionHistoryOptions, "messages"> & {
  /** Only completed messages from the new turn, never the full replay. */
  messages: readonly BaseMessage[];
};

function toChatCompletionMessages(messages: readonly BaseMessage[]): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];
  for (const message of messages) {
    if (isHumanMessage(message)) {
      // LangChain's text/image_url content blocks use the Chat Completions shape.
      const content: Extract<ChatCompletionMessageParam, { role: "user" }>["content"] =
        typeof message.content === "string" ? message.content : [];
      if (Array.isArray(content) && Array.isArray(message.content)) {
        for (const part of message.content) {
          if (typeof part !== "object" || part === null) continue;
          const block = part;
          if (block.type === "text" && typeof block.text === "string") {
            content.push({ type: "text", text: block.text });
          } else if (block.type === "image_url") {
            const image = block["image_url"];
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
    } else if (isAIMessage(message)) {
      result.push({
        role: "assistant",
        content: message.text,
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
    } else if (isToolMessage(message) && message.tool_call_id) {
      result.push({
        role: "tool",
        tool_call_id: message.tool_call_id,
        content: message.text,
      });
    }
    // System/developer instructions and unknown message types are not history.
  }
  return result;
}

/** Convert a new LangGraph turn, including tool calls/results, into conversation items. */
export function langGraphMessagesToItems(messages: readonly BaseMessage[]) {
  return chatCompletionMessagesToItems(toChatCompletionMessages(messages));
}

/** Append a new turn to an existing conversation. Do not pass replayed history or chunks. */
export function storeLangGraphHistory(options: StoreLangGraphHistoryOptions) {
  return storeChatCompletionHistory({
    ...options,
    messages: toChatCompletionMessages(options.messages),
  });
}
