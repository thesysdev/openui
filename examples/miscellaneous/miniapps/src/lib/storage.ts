import type { Artifact, ChatStorage, Message, Thread } from "@openuidev/react-ui";
import { miniAppsIn } from "./miniapp";

const KEY = "openui-miniapps-v1";
interface Workspace {
  threads: Thread[];
  messages: Record<string, Message[]>;
  artifacts: Record<string, Artifact>;
  states: Record<string, Record<string, unknown>>;
}

function read(): Workspace {
  const value = localStorage.getItem(KEY);
  return value ? JSON.parse(value) : { threads: [], messages: {}, artifacts: {}, states: {} };
}
function write(workspace: Workspace) {
  localStorage.setItem(KEY, JSON.stringify(workspace));
}

// An interrupted stream must not become a saved app or a permanent loading preview.
export function completedMessages(messages: Message[]): Message[] {
  const resultIds = new Set(messages.filter((m) => m.role === "tool").map((m) => m.toolCallId));
  return messages.flatMap((message): Message[] => {
    if (message.role !== "assistant") return [message];
    const toolCalls = message.toolCalls?.filter((call) => resultIds.has(call.id));
    if (!message.content && !toolCalls?.length) return [];
    return toolCalls?.length === message.toolCalls?.length
      ? [message]
      : [{ ...message, toolCalls }];
  });
}

export async function saveMessages(threadId: string, messages: Message[]) {
  const completed = completedMessages(messages);
  const workspace = read();
  workspace.messages[threadId] = completed;
  for (const app of miniAppsIn(completed)) {
    const current = workspace.artifacts[app.id]?.content as { version: number } | undefined;
    if (!current || app.version >= current.version) {
      workspace.artifacts[app.id] = {
        id: app.id,
        title: app.name,
        type: "miniapp",
        threadId,
        updatedAt: app.updatedAt,
        content: app,
      };
    }
  }
  write(workspace);
}

export function readAppState(id: string): Record<string, unknown> {
  return typeof window === "undefined" ? {} : (read().states[id] ?? {});
}
export function saveAppState(id: string, state: Record<string, unknown>) {
  const workspace = read();
  workspace.states[id] = state;
  write(workspace);
}

export const storage: ChatStorage = {
  thread: {
    async listThreads() {
      return { threads: read().threads };
    },
    async createThread(firstMessage) {
      const workspace = read();
      const thread: Thread = {
        id: crypto.randomUUID(),
        title:
          typeof firstMessage.content === "string" ? firstMessage.content.slice(0, 60) : "New chat",
        createdAt: new Date().toISOString(),
      };
      workspace.threads.unshift(thread);
      workspace.messages[thread.id] = [firstMessage];
      write(workspace);
      return thread;
    },
    async getMessages(id) {
      return read().messages[id] ?? [];
    },
    async updateThread(thread) {
      const workspace = read();
      workspace.threads = workspace.threads.map((item) => (item.id === thread.id ? thread : item));
      write(workspace);
      return thread;
    },
    async deleteThread(id) {
      const workspace = read();
      workspace.threads = workspace.threads.filter((item) => item.id !== id);
      delete workspace.messages[id];
      for (const app of Object.values(workspace.artifacts)) {
        if (app.threadId === id) {
          delete workspace.artifacts[app.id];
          delete workspace.states[app.id];
        }
      }
      write(workspace);
    },
  },
  artifact: {
    async list(params = {}) {
      const all = Object.values(read().artifacts)
        .filter(
          (app) =>
            (!params.name || app.title.toLowerCase().includes(params.name.toLowerCase())) &&
            (!params.type?.length || params.type.includes(app.type)),
        )
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      const offset = Number(params.cursor ?? 0);
      const limit = params.limit ?? 20;
      return {
        artifacts: all
          .slice(offset, offset + limit)
          .map(({ id, title, type, threadId, updatedAt }) => ({
            id,
            title,
            type,
            threadId,
            updatedAt,
          })),
        nextCursor: offset + limit < all.length ? String(offset + limit) : undefined,
      };
    },
    async get(id) {
      const app = read().artifacts[id];
      if (!app) throw new Error("This MiniApp is no longer available.");
      return app;
    },
    async update({ id, content }) {
      const workspace = read();
      const current = workspace.artifacts[id];
      if (!current) throw new Error("This MiniApp is no longer available.");
      const app = { ...current, content, updatedAt: new Date().toISOString() };
      workspace.artifacts[id] = app;
      write(workspace);
      return app;
    },
  },
};
