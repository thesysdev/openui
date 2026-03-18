import type { UIMessage } from "ai";

export interface Thread {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "vercel-ai-chat-threads";

function readAll(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(threads: Thread[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function getThreads(): Thread[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getThread(id: string): Thread | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function saveThread(thread: Thread) {
  const threads = readAll();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    threads[idx] = thread;
  } else {
    threads.push(thread);
  }
  writeAll(threads);
}

export function deleteThread(id: string) {
  writeAll(readAll().filter((t) => t.id !== id));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function titleFromMessages(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  const text = first.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");
  return text.length > 40 ? text.slice(0, 40) + "..." : text || "New Chat";
}
