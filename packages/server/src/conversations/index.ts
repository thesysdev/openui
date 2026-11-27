import { actAs } from "../core/act-as";
import { invalidInput, invalidResponse } from "../core/errors";
import { isRecord } from "../core/guards";
import type { CloudApi } from "../core/http";
import { idPath, queryNumber, requireId, toList } from "../core/resource";
import type { ConversationItemConverter } from "./converter";
import type {
  CloudConversation,
  ConversationItem,
  ConversationItems,
  ConversationMetadata,
  Conversations,
  MessageConversations,
} from "./types";

/** A conversation as OpenUI Cloud sends it: snake_case, times in unix seconds. */
interface WireConversation {
  id: string;
  title?: string;
  metadata?: ConversationMetadata;
  user_id?: string;
  app_id?: string;
  created_at: number;
}

function toConversation(row: unknown): CloudConversation {
  if (!isRecord(row) || typeof row["id"] !== "string") throw invalidResponse();
  const wire = row as unknown as WireConversation;
  return {
    id: wire.id,
    ...(wire.title !== undefined && { title: wire.title }),
    ...(wire.metadata !== undefined && { metadata: wire.metadata }),
    ...(wire.user_id !== undefined && { userId: wire.user_id }),
    ...(wire.app_id !== undefined && { appId: wire.app_id }),
    createdAt: wire.created_at * 1000,
  };
}

// Items keep OpenAI's shape, so one read back can be added to a conversation again as is.
function toItem(row: unknown): ConversationItem {
  if (!isRecord(row) || typeof row["id"] !== "string" || typeof row["type"] !== "string") {
    throw invalidResponse();
  }
  return row as unknown as ConversationItem;
}

const conversationPath = (id: unknown, suffix = "") => idPath("conversations", id, suffix);

function itemPath(id: unknown, itemId: unknown): string {
  return conversationPath(id, `/items/${encodeURIComponent(requireId(itemId, "itemId"))}`);
}

function createItems(api: CloudApi): ConversationItems {
  return {
    async list(id, params = {}) {
      const { limit, after, before, order } = params;
      const page = await api.send("GET", conversationPath(id, "/items"), {
        query: { limit: queryNumber(limit), after, before, order },
        signal: params.signal,
      });
      return toList(page, toItem);
    },

    async create(id, items, options) {
      if (!Array.isArray(items)) invalidInput("items must be an array");
      // Checked first, so a bad id fails even with no items.
      const path = conversationPath(id, "/items");
      if (items.length === 0) return [];
      const page = await api.send("POST", path, { body: { items }, signal: options?.signal });
      return toList(page, toItem).data;
    },

    async get(id, itemId, options) {
      return toItem(await api.send("GET", itemPath(id, itemId), { signal: options?.signal }));
    },

    async update(id, itemId, { content, status }, options) {
      const body = { content, status };
      return toItem(
        await api.send("POST", itemPath(id, itemId), { body, signal: options?.signal }),
      );
    },
  };
}

/** The conversations behind `openui.conversations`. */
export function createConversations(api: CloudApi): Conversations {
  return {
    async list(params = {}) {
      const { userId, limit, after, before } = params;
      // A filter on the owner: OpenUI Cloud lists their conversations in every app.
      const { user_id } = actAs(api, { userId });
      const page = await api.send("GET", "/v1/conversations", {
        query: { user_id, limit: queryNumber(limit), after, before },
        signal: params.signal,
      });
      return toList(page, toConversation);
    },

    // An owner, so the user's frontend token can read it too: without one, only the API key can.
    async create({ title, metadata } = {}, options) {
      if (options?.userId === undefined) {
        invalidInput(
          "userId is required: the conversation is that user's, for their frontend token",
        );
      }
      // The owner and the client's app go in the body: the API key names them on create.
      const body = { title, metadata, ...actAs(api, { userId: options.userId }) };
      return toConversation(
        await api.send("POST", "/v1/conversations", { body, signal: options.signal }),
      );
    },

    async get(id, options) {
      return toConversation(
        await api.send("GET", conversationPath(id), { signal: options?.signal }),
      );
    },

    async update(id, { title, metadata }, options) {
      const body = { title, metadata };
      return toConversation(
        await api.send("POST", conversationPath(id), { body, signal: options?.signal }),
      );
    },

    async delete(id, options) {
      await api.send("DELETE", conversationPath(id), { signal: options?.signal });
    },

    items: createItems(api),
  };
}

/** `conversations`, with items taken and read back as one SDK's messages, through `converter`. */
export function withMessages<Input, Output>(
  conversations: Conversations,
  converter: ConversationItemConverter<Input, Output>,
): MessageConversations<Input, Output> {
  const { items, ...rest } = conversations;
  return {
    ...rest,
    items: {
      async create(id, messages, options) {
        if (!Array.isArray(messages)) invalidInput("messages must be an array");
        return items.create(id, converter.toItems(messages), options);
      },

      // Every page, since a reply's text and its tool calls can sit on either side of one.
      async list(id, options = {}) {
        const thread: ConversationItem[] = [];
        let after: string | undefined;
        do {
          const page = await items.list(id, { ...options, order: "asc", limit: 100, after });
          thread.push(...page.data);
          after = page.hasMore ? page.lastId : undefined;
        } while (after);
        return converter.fromItems(thread);
      },
    },
  };
}
