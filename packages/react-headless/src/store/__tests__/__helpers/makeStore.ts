import { vi } from "vitest";
import type { ChatLLM, ChatStorage, ThreadStorage } from "../../../adapters/types";
import { createChatStore } from "../../createChatStore";

export interface MakeStoreOverrides extends Partial<ThreadStorage> {
  send?: ChatLLM["send"];
  streamProtocol?: ChatLLM["streamProtocol"];
}

/**
 * Build a chat store with mocked storage + LLM adapters. Per-field overrides
 * for any storage method or `llm.send`/`llm.streamProtocol`. Anything not
 * overridden gets a vi.fn() mock with a sensible default return.
 */
export function makeStore(overrides: MakeStoreOverrides = {}) {
  const { send, streamProtocol, ...threadOverrides } = overrides;

  const storage: ChatStorage = {
    thread: {
      listThreads: vi.fn().mockResolvedValue({ threads: [] }),
      createThread: vi.fn().mockResolvedValue({
        id: "new",
        title: "New",
        createdAt: new Date().toISOString(),
      }),
      getMessages: vi.fn().mockResolvedValue([]),
      updateThread: vi.fn(async (t) => t),
      cacheMessages: vi.fn().mockResolvedValue(undefined),
      deleteThread: vi.fn().mockResolvedValue(undefined),
      ...threadOverrides,
    },
  };

  const llm: ChatLLM = {
    send: send ?? vi.fn().mockResolvedValue(new Response("", { status: 200 })),
    streamProtocol: streamProtocol ?? { parse: async function* () {} },
  };

  return createChatStore({ current: { storage, llm } });
}
