import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { ResponseInputItem, ResponseOutputItem } from "openai/resources/responses/responses";
import type { AppendMessagesOptions } from "../conversations/append";

/** Completions remains the default; select Responses explicitly for native items. */
export type AppendMessagesInput = AppendMessagesOptions &
  (
    | { format?: "completions"; messages: ChatCompletionMessageParam[] }
    | { format: "responses"; messages: (ResponseInputItem | ResponseOutputItem)[] }
  );

/** @deprecated Use ServerClientOptions and AppendMessagesInput instead. */
export type StoreChatCompletionHistoryOptions = {
  apiKey: string;
  conversationId: string;
  /** Chat Completions messages for the new turn. */
  messages: ChatCompletionMessageParam[];
  signal?: AbortSignal;
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
