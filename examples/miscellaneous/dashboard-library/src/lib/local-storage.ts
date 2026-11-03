import {
  processStreamedMessage,
  type ChatLLM,
  type ChatStorage,
  type Message,
  type Thread,
  type UserMessage,
} from "@openuidev/react-headless";

export function localStorageChat(
  llm: ChatLLM,
  key: string,
): { llm: ChatLLM; storage: ChatStorage } {
  const threadsKey = `${key}:threads`;
  const messagesKey = (threadId: string) => `${key}:messages:${threadId}`;

  const read = <T>(itemKey: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(itemKey);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (itemKey: string, value: unknown) => {
    try {
      localStorage.setItem(itemKey, JSON.stringify(value));
    } catch {}
  };
  const threads = () => read<Thread[]>(threadsKey, []);

  const send: ChatLLM["send"] = async (params) => {
    write(messagesKey(params.threadId), params.messages);
    const response = await llm.send(params);
    if (!response.ok || !response.body) return response;

    const [forChat, forStorage] = response.body.tee();
    const reply = new Map<string, Message>();
    const keep = (message: Message) => reply.set(message.id, message);
    processStreamedMessage({
      response: new Response(forStorage, response),
      createMessage: keep,
      updateMessage: keep,
      adapter: llm.streamProtocol,
    })
      .catch(() => {})
      .finally(() => write(messagesKey(params.threadId), [...params.messages, ...reply.values()]));

    return new Response(forChat, response);
  };

  return {
    llm: { ...llm, send },
    storage: {
      thread: {
        async listThreads() {
          return { threads: threads() };
        },
        async createThread(firstMessage: UserMessage) {
          const text = typeof firstMessage.content === "string" ? firstMessage.content.trim() : "";
          const thread: Thread = {
            id: crypto.randomUUID(),
            title: text.slice(0, 60) || "New chat",
            createdAt: Date.now(),
          };
          write(threadsKey, [thread, ...threads()]);
          return thread;
        },
        async getMessages(threadId: string) {
          return read<Message[]>(messagesKey(threadId), []);
        },
        async updateThread(thread: Thread) {
          write(
            threadsKey,
            threads().map((t) => (t.id === thread.id ? thread : t)),
          );
          return thread;
        },
        async deleteThread(id: string) {
          write(
            threadsKey,
            threads().filter((t) => t.id !== id),
          );
          try {
            localStorage.removeItem(messagesKey(id));
          } catch {}
        },
      },
    },
  };
}
