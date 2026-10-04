import {
  EventType,
  agUIAdapter,
  fetchLLM,
  type ChatLLM,
  type ChatStorage,
  type Message,
} from "@openuidev/react-headless";
import {
  createThreadStore,
  getClientStorage,
  type KVStorage,
  type ThreadStore,
} from "./thread-store";

async function persistAssistantFromStream(
  body: ReadableStream<Uint8Array>,
  threadId: string,
  messages: Message[],
  store: ThreadStore,
): Promise<void> {
  let assistant = "";

  try {
    for await (const event of agUIAdapter().parse(new Response(body))) {
      if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
        assistant += event.delta;
      }
    }
  } finally {
    // Preserve text received before a cancel or transport failure. The caller
    // intentionally swallows the tee reader's error after this checkpoint so
    // an aborted browser request cannot become an unhandled rejection.
    if (assistant) {
      store.saveMessages(threadId, [
        ...messages,
        { id: crypto.randomUUID(), role: "assistant", content: assistant } as Message,
      ]);
    }
  }
}

/**
 * Returns the two independent adapters AgentInterface needs: an AG-UI-backed
 * LLM transport and a localStorage-backed thread store.
 */
export interface CreateGrokBuildChatOptions {
  onThreadChange?: (threadId: string) => void;
  storage?: KVStorage;
  store?: ThreadStore;
}

export function createGrokBuildChatProps(options: CreateGrokBuildChatOptions = {}): {
  llm: ChatLLM;
  storage: ChatStorage;
} {
  const storage = options.storage ?? getClientStorage();
  const store = options.store ?? createThreadStore(storage);
  const llm = fetchLLM({
    url: "/api/chat",
    streamAdapter: agUIAdapter(),
  });

  // Wrap send so we can persist the user turn before the request and tee the
  // AG-UI stream for the assistant transcript. fetchLLM still owns the POST.
  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    options.onThreadChange?.(threadId);
    store.saveMessages(threadId, messages);

    const response = await llm.send({ messages, threadId, signal });
    if (!response.ok || !response.body) return response;
    const [clientBody, persistenceBody] = response.body.tee();
    void persistAssistantFromStream(persistenceBody, threadId, messages, store).catch(
      () => undefined,
    );

    return new Response(clientBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  return {
    llm: { send, streamProtocol: llm.streamProtocol },
    storage: {
      thread: {
        listThreads: () => store.fetchThreadList(),
        createThread: async (firstMessage) => {
          const thread = await store.createThread(firstMessage);
          options.onThreadChange?.(thread.id);
          return thread;
        },
        getMessages: (threadId) => {
          options.onThreadChange?.(threadId);
          return store.loadThread(threadId);
        },
        updateThread: (thread) => store.updateThread(thread),
        deleteThread: (threadId) => store.deleteThread(threadId),
      },
    },
  };
}
