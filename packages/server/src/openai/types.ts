import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface AppendMessagesInput {
  conversationId: string;
  /** Chat Completions messages for the new turn, not the full conversation replay. */
  messages: ChatCompletionMessageParam[];
  signal?: AbortSignal;
}

/** @deprecated Use ClientOptions and AppendMessagesInput instead. */
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
