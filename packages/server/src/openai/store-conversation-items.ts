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
import { THESYS_API_BASE_URL } from "../shared/constants.js";
import type { StoreChatCompletionHistoryOptions } from "./types.js";

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
 * The tool calls and tool results to store: each is kept only with its pair,
 * a result in the tool messages right after its call's assistant message.
 * A run stopped mid tool call leaves calls without results, and model APIs
 * reject every later request in a thread that has one.
 */
function pairedToolCalls(messages: ChatCompletionMessageParam[]): Set<object> {
  const paired = new Set<object>();
  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;
    const open = new Map(
      (message.tool_calls ?? [])
        .filter((call) => call.type === "function" && call.id && call.function.name)
        .map((call) => [call.id, call]),
    );
    for (const next of messages.slice(index + 1)) {
      if (next.role !== "tool") break;
      const call = open.get(next.tool_call_id);
      if (!call) continue;
      open.delete(next.tool_call_id);
      paired.add(call);
      paired.add(next);
    }
  });
  return paired;
}

/**
 * Break Chat Completions messages into Conversations API items.
 * Pass the new turn, not the full replay, or items will be duplicated.
 * System / developer messages are skipped (instructions, not history), and so
 * are tool calls without a result and results without a call.
 */
export function chatCompletionMessagesToItems(
  messages: ChatCompletionMessageParam[],
): ResponseInputItem[] {
  const items: ResponseInputItem[] = [];
  const paired = pairedToolCalls(messages);

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
        if (call.type !== "function" || !paired.has(call)) continue;
        items.push({
          type: "function_call",
          call_id: call.id,
          name: call.function.name,
          arguments: call.function.arguments?.trim() ? call.function.arguments : "{}",
        } satisfies ResponseFunctionToolCall);
      }
      continue;
    }

    if (message.role === "tool") {
      if (!paired.has(message)) continue;
      items.push({
        type: "function_call_output",
        call_id: message.tool_call_id,
        output: toolOutputOf(message.content) || "{}",
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
 * Call this after a turn (typically the new user message plus
 * the assembled assistant reply) so OpenUI Cloud storage can
 * reload the thread.
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

  const base = (options.apiBaseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, "");
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
