import type { ConversationItemList } from "openai/resources/conversations/items";
import { postJSON, ServerClientError, type ServerClientConfig } from "../shared/client";

/** Internal Gateway wire item; adapters retain native fields where supported. */
export type ConversationItem = { type: string; [key: string]: unknown };

export interface AppendMessagesOptions {
  conversationId: string;
  signal?: AbortSignal;
}

export function invalidMessage(message: string): never {
  throw new ServerClientError(message, "unsupported_message");
}

export function jsonValue(value: unknown): string {
  try {
    const result = JSON.stringify(value);
    if (result !== undefined) return result;
  } catch {
    // Report a domain error before sending any part of the turn.
  }
  return invalidMessage("Message contains a value that cannot be stored as JSON");
}

/** Convert the whole turn before writing once; never retry a potentially committed append. */
export function createConversations<Input>(
  config: ServerClientConfig,
  convert: (input: Input) => object[],
) {
  return {
    async appendMessages(input: Input & AppendMessagesOptions): Promise<ConversationItemList> {
      input.signal?.throwIfAborted();
      if (!input.conversationId?.trim()) {
        throw new ServerClientError("conversationId is required", "invalid_input");
      }
      const items = convert(input);
      if (items.length === 0) {
        return { object: "list", data: [], first_id: "", last_id: "", has_more: false };
      }
      return (await postJSON(
        config,
        `/v1/conversations/${encodeURIComponent(input.conversationId)}/items`,
        { items },
        input.signal,
      )) as ConversationItemList;
    },
  };
}
