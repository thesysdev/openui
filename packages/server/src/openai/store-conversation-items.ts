import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ConversationItemList } from "openai/resources/conversations/items";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { createConversations } from "../conversations";
import { createCloudApi } from "../core/http";
import { chatMessagesToItems } from "./messages";

export type StoreChatCompletionHistoryOptions = {
  apiKey: string;
  conversationId: string;
  /** Chat Completions messages for the new turn. */
  messages: ChatCompletionMessageParam[];
  /** Defaults to `https://api.thesys.dev`. */
  apiBaseUrl?: string;
  fetch?: (
    input: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
    json: () => Promise<unknown>;
  }>;
};

/**
 * Break Chat Completions messages into Conversations API items.
 *
 * @deprecated Use `openui.chat.conversations.items.create()`, which converts and stores.
 */
export function chatCompletionMessagesToItems(
  messages: ChatCompletionMessageParam[],
): ResponseInputItem[] {
  return chatMessagesToItems(messages);
}

/**
 * Add Chat Completions messages to a conversation as Conversations API items, with the
 * API key as your org. Pass only the new turn. A rejected write throws `OpenUIApiError`.
 *
 * @deprecated Use `openui.chat.conversations.items.create(conversationId, messages, { userId })`.
 */
export async function storeChatCompletionHistory(
  options: StoreChatCompletionHistoryOptions,
): Promise<ConversationItemList> {
  const conversations = createConversations(
    createCloudApi({
      apiKey: options.apiKey,
      baseUrl: options.apiBaseUrl,
      fetch: options.fetch as typeof globalThis.fetch | undefined,
    }),
  );
  const data = await conversations.items.create(
    options.conversationId,
    chatMessagesToItems(options.messages),
  );
  return {
    object: "list",
    data: data as ConversationItemList["data"],
    first_id: data[0]?.id ?? "",
    last_id: data[data.length - 1]?.id ?? "",
    has_more: false,
  };
}
