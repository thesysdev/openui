import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type StoreChatCompletionHistoryOptions = {
  apiKey: string;
  conversationId: string;
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
