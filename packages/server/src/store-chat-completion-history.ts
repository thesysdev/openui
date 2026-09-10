import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import type { ConversationItemList } from "openai/resources/conversations/items";
import type {
  EasyInputMessage,
  ResponseFunctionToolCall,
  ResponseInputItem,
  ResponseInputMessageContentList,
} from "openai/resources/responses/responses";
import type { StoreChatCompletionHistoryOptions } from "./types";

const DEFAULT_API_BASE_URL = "https://api.thesys.dev";

function userContentOf(
  content: ChatCompletionUserMessageParam["content"],
): ResponseInputMessageContentList {
  if (typeof content === "string") {
    return content ? [{ type: "input_text", text: content }] : [];
  }

  const parts: ResponseInputMessageContentList = [];
  for (const part of content) {
    if (part.type === "text" && part.text) {
      parts.push({ type: "input_text", text: part.text });
      continue;
    }
    if (part.type === "image_url" && part.image_url.url) {
      parts.push({
        type: "input_image",
        image_url: part.image_url.url,
        detail: part.image_url.detail ?? "auto",
      });
    }
  }
  return parts;
}

function assistantTextOf(content: ChatCompletionAssistantMessageParam["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("");
}

function toolOutputOf(content: ChatCompletionToolMessageParam["content"]): string {
  if (typeof content === "string") return content;
  return content.map((part) => part.text).join("");
}

/**
 * Break Chat Completions messages into Conversations API items — the same
 * sibling-item shape muse persists for Responses (`store: true`) and that
 * AgentInterface reloads via `openAIConversationMessageFormat`.
 *
 *   assistant.tool_calls[]  →  type: "function_call"  (siblings, not nested)
 *   role: "tool"            →  type: "function_call_output"
 *
 * System / developer messages are skipped (instructions, not history).
 */
export function chatCompletionMessagesToItems(
  messages: ChatCompletionMessageParam[],
): ResponseInputItem[] {
  const items: ResponseInputItem[] = [];

  for (const message of messages) {
    if (message.role === "system" || message.role === "developer") continue;

    if (message.role === "user") {
      const content = userContentOf(message.content);
      if (content.length === 0) continue;
      items.push({
        type: "message",
        role: "user",
        content,
      } satisfies EasyInputMessage);
      continue;
    }

    if (message.role === "assistant") {
      const text = assistantTextOf(message.content);
      if (text) {
        items.push({
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text }],
        } as ResponseInputItem);
      }
      for (const call of message.tool_calls ?? []) {
        if (call.type !== "function") continue;
        items.push({
          type: "function_call",
          call_id: call.id,
          name: call.function.name,
          arguments: call.function.arguments,
        } satisfies ResponseFunctionToolCall);
      }
      continue;
    }

    if (message.role === "tool") {
      items.push({
        type: "function_call_output",
        call_id: message.tool_call_id,
        output: toolOutputOf(message.content),
      } satisfies ResponseInputItem.FunctionCallOutput);
    }
  }

  return items;
}

const EMPTY_ITEM_LIST: ConversationItemList = {
  object: "list",
  data: [],
  first_id: "",
  last_id: "",
  has_more: false,
};

/**
 * POST Chat Completions messages as Conversations API items.
 *
 * Chat Completions has no `conversation` + `store: true`. Call this after a
 * turn (typically the new user message plus the assembled assistant reply)
 * so OpenUI Cloud storage can reload the thread.
 *
 * The conversation must already exist — AgentInterface's Cloud storage
 * creates it via `POST /v1/conversations`. Pass only the new turn, not the
 * full replay, or items will be duplicated.
 */
export async function storeChatCompletionHistory(
  options: StoreChatCompletionHistoryOptions,
): Promise<ConversationItemList> {
  const items = chatCompletionMessagesToItems(options.messages);
  if (items.length === 0) {
    return EMPTY_ITEM_LIST;
  }

  const base = (options.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const fetchFn = options.fetch ?? (globalThis.fetch as typeof fetch);
  const res = await fetchFn(
    `${base}/v1/conversations/${encodeURIComponent(options.conversationId)}/items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    },
  );

  if (!res.ok) {
    throw new Error(`store chat completion history failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as ConversationItemList;
}
