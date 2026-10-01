import type { ChatStorage, Message, Thread } from "@openuidev/react-headless";
import { messageText } from "./messages";

/*
 * Local thread storage for the Radio chat. OpenUI's ChatProvider keeps threads in
 * memory unless it's given a storage, so this one keeps them in localStorage: the
 * thread list under one key and each thread's messages under its own.
 * The provider never writes messages back, so <PersistThread> saves them.
 */

const THREADS_KEY = "f1-radio:threads";
const messagesKey = (id: string) => `f1-radio:messages:${id}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Full or blocked storage: the chat still works, it just won't survive a reload.
  }
}

const readThreads = () => read<Thread[]>(THREADS_KEY, []);
const newestFirst = (threads: Thread[]) =>
  [...threads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const hasThread = (id: string) => readThreads().some((t) => t.id === id);

export function saveMessages(threadId: string, messages: Message[]) {
  if (hasThread(threadId)) write(messagesKey(threadId), messages);
}

export const localThreadStorage: ChatStorage = {
  thread: {
    async listThreads() {
      return { threads: newestFirst(readThreads()) };
    },
    async createThread(firstMessage) {
      const thread: Thread = {
        id: crypto.randomUUID(),
        title: messageText(firstMessage.content).trim() || "New radio",
        createdAt: new Date().toISOString(),
      };
      write(THREADS_KEY, [thread, ...readThreads()]);
      write(messagesKey(thread.id), [firstMessage]);
      return thread;
    },
    async getMessages(threadId) {
      return read<Message[]>(messagesKey(threadId), []);
    },
    async updateThread(thread) {
      write(THREADS_KEY, readThreads().map((t) => (t.id === thread.id ? thread : t)));
      return thread;
    },
    async deleteThread(id) {
      write(THREADS_KEY, readThreads().filter((t) => t.id !== id));
      try {
        window.localStorage.removeItem(messagesKey(id));
      } catch {}
    },
  },
};

/** The reader's latest questions across their threads, newest first. */
export function recentQuestions(limit = 8): string[] {
  const out: string[] = [];
  for (const thread of newestFirst(readThreads())) {
    const asked = read<Message[]>(messagesKey(thread.id), [])
      .filter((m) => m.role === "user")
      .map((m) => messageText(m.content).trim())
      .filter(Boolean)
      .reverse();
    for (const q of asked) if (!out.includes(q) && out.length < limit) out.push(q.slice(0, 600));
    if (out.length >= limit) break;
  }
  return out;
}
