import type { Thread, UserMessage } from "../store/types";
import type { Message } from "../types/message";
import { identityMessageFormat, type MessageFormat } from "../types/messageFormat";
import type { ChatStorage } from "./types";

export interface RestStorageOptions {
  /**
   * Base URL for thread endpoints (the old `threadApiUrl`). The factory hits
   * the same conventions the legacy default used:
   *   - list:    GET    {baseUrl}/get  (·  ?cursor={cursor})
   *   - create:  POST   {baseUrl}/create
   *   - get:     GET    {baseUrl}/get/{threadId}
   *   - update:  PATCH  {baseUrl}/update/{threadId}
   *   - delete:  DELETE {baseUrl}/delete/{threadId}
   *   - message: PATCH  {baseUrl}/messages/{threadId}/{messageId}
   */
  baseUrl: string;
  /** Wire-format conversion. Defaults to identity (canonical Message). */
  messageFormat?: MessageFormat;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Override fetch implementation (for tests, custom auth wrappers, etc.). */
  fetch?: typeof fetch;
}

/**
 * Generic REST-based thread storage. Reproduces the conventions the removed
 * `threadApiUrl` prop used, so an existing backend keeps working by swapping
 * `threadApiUrl="/x"` for `storage={restStorage({ baseUrl: "/x" })}`.
 *
 * Only the `thread` channel is implemented. Pair with an `llm` adapter
 * (e.g. `fetchLLM`).
 */
export function restStorage({
  baseUrl,
  messageFormat = identityMessageFormat,
  headers,
  fetch: customFetch,
}: RestStorageOptions): ChatStorage {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);

  const request = async (url: string, init?: RequestInit): Promise<Response> => {
    const res = await fetchImpl(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...headers,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(
        `restStorage: ${init?.method ?? "GET"} ${url} failed: ${res.status} ${res.statusText}`,
      );
    }
    return res;
  };

  return {
    thread: {
      async listThreads(cursor?: string) {
        const url = cursor ? `${baseUrl}/get?cursor=${cursor}` : `${baseUrl}/get`;
        const res = await request(url);
        return res.json();
      },
      async createThread(firstMessage: UserMessage): Promise<Thread> {
        const res = await request(`${baseUrl}/create`, {
          method: "POST",
          body: JSON.stringify({ messages: messageFormat.toApi([firstMessage]) }),
        });
        return res.json();
      },
      async getMessages(threadId: string): Promise<Message[]> {
        const res = await request(`${baseUrl}/get/${threadId}`);
        const raw: unknown = await res.json();
        return messageFormat.fromApi(raw);
      },
      async updateThread(thread: Thread): Promise<Thread> {
        const res = await request(`${baseUrl}/update/${thread.id}`, {
          method: "PATCH",
          body: JSON.stringify(thread),
        });
        return res.json();
      },
      async deleteThread(id: string): Promise<void> {
        await request(`${baseUrl}/delete/${id}`, { method: "DELETE" });
      },
      async updateMessage(threadId: string, message: Message): Promise<void> {
        // Send the full toApi conversion. One AG-UI message can map to several
        // wire items (e.g. OpenAI Responses flattens text + tool calls).
        await request(
          `${baseUrl}/messages/${encodeURIComponent(threadId)}/${encodeURIComponent(message.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ messages: messageFormat.toApi([message]) }),
          },
        );
      },
    },
  };
}
