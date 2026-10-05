import type { ConversationItemList } from "openai/resources/conversations/items";
import { postJSON, type ClientConfig } from "../shared/client";
import { chatCompletionMessagesToItems } from "./store-conversation-items";
import type { AppendMessagesInput } from "./types";

/** Existing Completions persistence, bound to the shared connection. */
export function createCompletionsConversations(config: ClientConfig) {
  return {
    /** Append only the new turn. Currently accepts Chat Completions messages. */
    async appendMessages({
      conversationId,
      messages,
      signal,
    }: AppendMessagesInput): Promise<ConversationItemList> {
      signal?.throwIfAborted();
      const items = chatCompletionMessagesToItems(messages);
      if (items.length === 0) {
        return { object: "list", data: [], first_id: "", last_id: "", has_more: false };
      }
      return (await postJSON(
        config,
        `/v1/conversations/${encodeURIComponent(conversationId)}/items`,
        { items },
        signal,
      )) as ConversationItemList;
    },
  };
}
