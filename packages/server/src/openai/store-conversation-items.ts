import { ServerClientError } from "../shared/client";
import { createServerClient } from "./client";
import { messagesToItems } from "./messages-to-items";
import type { StoreChatCompletionHistoryOptions } from "./types";

/** @deprecated Prefer createServerClient().conversations.appendMessages for persistence. */
export const chatCompletionMessagesToItems = messagesToItems;

/** @deprecated Use createServerClient().conversations.appendMessages instead. */
export async function storeChatCompletionHistory(options: StoreChatCompletionHistoryOptions) {
  try {
    return await createServerClient({
      apiKey: options.apiKey,
      apiBaseUrl: options.apiBaseUrl,
      fetch: options.fetch as typeof globalThis.fetch | undefined,
    }).conversations.appendMessages(options);
  } catch (error) {
    // Preserve the legacy helper's HTTP error message for existing callers.
    if (error instanceof ServerClientError && error.status !== undefined) {
      throw new ServerClientError(
        `store chat completion history failed: ${error.status} ${error.message}`,
        error.code,
        error.status,
      );
    }
    throw error;
  }
}
