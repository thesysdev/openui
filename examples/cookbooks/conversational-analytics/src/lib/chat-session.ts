import {
  fetchLLM,
  identityMessageFormat,
  openAIResponsesAdapter,
  type ChatStorage,
  type Message,
  type Thread,
} from "@openuidev/react-headless";
import { exampleProgram } from "./example-program";
import type { Filters } from "./filters";

export const exampleThreadId = "retail-example";
export const exampleMessageId = "retail-example-dashboard";

// One mounted app owns this session. Reloading clears conversations and filters.
export function createChatSession() {
  const threads = new Map<string, Thread>();
  const messagesByThread = new Map<string, Message[]>();
  const filters = new Map<string, Filters>();
  function ensureExample() {
    if (threads.has(exampleThreadId)) return;
    threads.set(exampleThreadId, { id: exampleThreadId, title: "Example dashboard", createdAt: 0 });
    messagesByThread.set(exampleThreadId, [
      { id: exampleMessageId, role: "assistant", content: exampleProgram },
    ]);
  }
  ensureExample();
  const storage: ChatStorage = {
    thread: {
      async listThreads() {
        return { threads: [...threads.values()].reverse() };
      },
      async createThread(firstMessage) {
        const thread = {
          id: crypto.randomUUID(),
          title:
            typeof firstMessage.content === "string"
              ? firstMessage.content.slice(0, 60)
              : "Retail question",
          createdAt: new Date().toISOString(),
        };
        threads.set(thread.id, thread);
        messagesByThread.set(thread.id, [firstMessage]);
        return thread;
      },
      async getMessages(id) {
        return messagesByThread.get(id) ?? [];
      },
      async updateThread(thread) {
        threads.set(thread.id, thread);
        return thread;
      },
      async deleteThread(id) {
        for (const message of messagesByThread.get(id) ?? []) filters.delete(message.id);
        messagesByThread.delete(id);
        threads.delete(id);
      },
    },
  };
  const llm = fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: {
      ...identityMessageFormat,
      toApi: (messages) =>
        messages
          .filter(
            (message) =>
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string" &&
              message.content.trim().length > 0,
          )
          .slice(-12)
          .map((message) => ({
            role: message.role,
            content: message.content,
            ...(message.role === "assistant" && filters.has(message.id)
              ? { filters: filters.get(message.id) }
              : {}),
          })),
    },
  });
  return {
    storage,
    llm,
    filters,
    ensureExample,
    saveMessages(id: string, messages: Message[]) {
      if (threads.has(id)) messagesByThread.set(id, messages);
    },
  };
}
export type ChatSession = ReturnType<typeof createChatSession>;
