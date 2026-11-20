import type { ChatStorage, Message } from "@openuidev/react-headless";

const VIEW_KEY = "email-chat-view";
const MESSAGES_KEY = "email-chat-messages";
const THREAD_KEY = "email-chat-thread";

export function saveView(view: "compose" | "chat") {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch { /* ignore */ }
}

export function loadView(): "compose" | "chat" {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "chat") return "chat";
  } catch { /* ignore */ }
  return "compose";
}

export function saveMessages(messages: unknown[]) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

export function loadMessages(): unknown[] | null {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function loadThreadId(): string | null {
  try {
    return localStorage.getItem(THREAD_KEY);
  } catch { /* ignore */ }
  return null;
}

/**
 * Keeps the current email's thread in this browser. A new email gets a new thread ID, and a
 * reload restores the saved messages with their thread ID, so each email is one Gateway session.
 */
export const emailStorage: ChatStorage = {
  thread: {
    async listThreads() {
      return { threads: [] };
    },
    async createThread() {
      const thread = { id: crypto.randomUUID(), title: "Email", createdAt: Date.now() };
      try {
        localStorage.setItem(THREAD_KEY, thread.id);
      } catch { /* ignore */ }
      return thread;
    },
    async getMessages(threadId) {
      return threadId === loadThreadId() ? ((loadMessages() ?? []) as Message[]) : [];
    },
    async updateThread(thread) {
      return thread;
    },
    async deleteThread() {},
  },
};

export function clearSession() {
  try {
    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(THREAD_KEY);
  } catch { /* ignore */ }
}
