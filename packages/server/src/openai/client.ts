import type { ConversationItemList } from "openai/resources/conversations/items";
import { postJSON, resolveClientOptions, type ServerClientOptions } from "../shared/client";
import { createClientAutofix } from "../shared/client-autofix";
import { openAIAdapter } from "./adapter";
import { messagesToItems } from "./messages-to-items";
import type { AppendMessagesInput } from "./types";

/** Configure OpenAI-format Autofix and conversation persistence. */
export function createServerClient(options: ServerClientOptions = {}) {
  const config = resolveClientOptions(options);
  return {
    autofix: {
      completions: createClientAutofix(config, openAIAdapter),
    },
    conversations: {
      /** Append only the new turn. Currently accepts Chat Completions messages. */
      async appendMessages({
        conversationId,
        messages,
        signal,
      }: AppendMessagesInput): Promise<ConversationItemList> {
        signal?.throwIfAborted();
        const items = messagesToItems(messages);
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
    },
  };
}

export type ServerClient = ReturnType<typeof createServerClient>;
