"use client";

import {
  generateId,
  getThread,
  getThreads,
  deleteThread as removeThread,
  saveThread,
  titleFromMessages,
  type Thread,
} from "@/lib/thread-store";
import type { UIMessage } from "ai";
import { useCallback, useState } from "react";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>(() => getThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(() => generateId());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshThreads = useCallback(() => {
    setThreads(getThreads());
  }, []);

  const persistMessages = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length === 0) return;
      const existing = getThread(activeThreadId);
      const now = Date.now();
      saveThread({
        id: activeThreadId,
        title: titleFromMessages(messages),
        messages,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      refreshThreads();
    },
    [activeThreadId, refreshThreads],
  );

  const createThread = useCallback(() => {
    setActiveThreadId(generateId());
  }, []);

  const switchThread = useCallback((id: string) => {
    setActiveThreadId(id);
  }, []);

  const deleteThread = useCallback(
    (id: string) => {
      removeThread(id);
      refreshThreads();
      if (id === activeThreadId) {
        setActiveThreadId(generateId());
      }
    },
    [activeThreadId, refreshThreads],
  );

  const activeThread = getThread(activeThreadId);

  return {
    threads,
    activeThreadId,
    activeThread,
    sidebarOpen,
    setSidebarOpen,
    persistMessages,
    createThread,
    switchThread,
    deleteThread,
  };
}
