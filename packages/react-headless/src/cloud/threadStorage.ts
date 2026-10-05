import type { ThreadStorage } from "../adapters/types";
import type { Thread } from "../store/types";
import type { Message, UserMessage } from "../types/message";
import { cloudItemsToMessages } from "./items";
import {
  cloudRequest,
  nextCursorOf,
  type CloudConversation,
  type CloudConversationItem,
  type CloudListEnvelope,
} from "./wire";

export interface CloudThreadStorageOptions {
  /** OpenUI Cloud API origin, e.g. "http://localhost:3102". */
  baseUrl: string;
  /** The token-injecting fetch from createFctFetch. */
  fetch: typeof fetch;
  /** Page size for list/items calls. */
  pageLimit?: number;
}

/** Hard stop for the items pagination loop. */
const MAX_ITEM_PAGES = 50;

function toThread(conversation: CloudConversation): Thread {
  return {
    id: conversation.id,
    title: conversation.title ?? "New conversation",
    createdAt: conversation.created_at * 1000, // unix seconds → ms
  };
}

/** Client-side title from the first user message (the API does not auto-title). */
export function deriveTitle(firstMessage: UserMessage): string {
  const content = firstMessage.content;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "text" && typeof part.text === "string" && part.text.trim() !== "") {
        text = part.text;
        break;
      }
    }
  }
  text = text.trim();
  return (text === "" ? "New conversation" : text).slice(0, 60);
}

export function cloudThreadStorage({
  baseUrl,
  fetch: fetchImpl,
  pageLimit = 100,
}: CloudThreadStorageOptions): ThreadStorage {
  const request = cloudRequest(fetchImpl, baseUrl);

  return {
    /** GET /v1/conversations?limit[&after]. Newest-first. */
    async listThreads(cursor?: string) {
      const query = new URLSearchParams({ limit: String(pageLimit) });
      if (cursor !== undefined) query.set("after", cursor);
      const res = await request(`/v1/conversations?${query.toString()}`);
      const envelope = (await res.json()) as CloudListEnvelope<CloudConversation>;
      return {
        threads: envelope.data.map(toThread),
        nextCursor: nextCursorOf(envelope),
      };
    },

    /** POST /v1/conversations {title}. No messages and no user_id — the user is
     *  bound from the token; the first message arrives later on the generation
     *  plane (conversation linkage). */
    async createThread(firstMessage: UserMessage): Promise<Thread> {
      const res = await request(`/v1/conversations`, {
        method: "POST",
        body: JSON.stringify({ title: deriveTitle(firstMessage) }),
      });
      return toThread((await res.json()) as CloudConversation);
    },

    /** GET /v1/conversations/:id/items?order=asc, paged, then mapped to Messages. */
    async getMessages(threadId: string): Promise<Message[]> {
      const items: CloudConversationItem[] = [];
      let after: string | undefined;
      for (let page = 0; page < MAX_ITEM_PAGES; page++) {
        const query = new URLSearchParams({
          order: "asc",
          limit: String(pageLimit),
        });
        if (after !== undefined) query.set("after", after);
        const res = await request(
          `/v1/conversations/${encodeURIComponent(threadId)}/items?${query.toString()}`,
        );
        const envelope = (await res.json()) as CloudListEnvelope<CloudConversationItem>;
        items.push(...envelope.data);
        after = nextCursorOf(envelope);
        if (after === undefined) break;
      }
      return cloudItemsToMessages(items);
    },

    /** POST /v1/conversations/:id {title}. */
    async updateThread(thread: Thread): Promise<Thread> {
      const res = await request(`/v1/conversations/${encodeURIComponent(thread.id)}`, {
        method: "POST",
        body: JSON.stringify({ title: thread.title }),
      });
      return toThread((await res.json()) as CloudConversation);
    },

    /** DELETE /v1/conversations/:id (soft delete). */
    async deleteThread(id: string): Promise<void> {
      await request(`/v1/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  };
}
