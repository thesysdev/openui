import { createStore } from "zustand";
import { processStreamedMessage } from "../stream/processStreamedMessage";
import { identityMessageFormat } from "../types/messageFormat";
import type { ChatProviderProps, ChatStore, Message, Thread, UserMessage } from "./types";

type StoreConfig = Omit<ChatProviderProps, "children">;

const mergeThreadList = (existing: Thread[], incoming: Thread[]): Thread[] =>
  Array.from(new Map([...existing, ...incoming].map((t) => [t.id, t])).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const createChatStore = (config: StoreConfig) => {
  const {
    apiUrl,
    threadApiUrl,
    processMessage: userProcessMessage,
    fetchThreadList: userFetchThreadList,
    createThread: userCreateThread,
    deleteThread: userDeleteThread,
    updateThread: userUpdateThread,
    loadThread: userLoadThread,
    streamProtocol,
    messageFormat = identityMessageFormat,
  } = config;

  // ── Default implementations (when threadApiUrl is provided) ──

  const fetchThreadList =
    userFetchThreadList ??
    (async (cursor?: any) => {
      if (!threadApiUrl) return { threads: [] };
      const url = cursor ? `${threadApiUrl}/get?cursor=${cursor}` : `${threadApiUrl}/get`;
      const res = await fetch(url);
      return res.json();
    });

  const createThread =
    userCreateThread ??
    (async (firstMessage: UserMessage) => {
      if (!threadApiUrl) throw new Error("threadApiUrl or createThread required");
      const res = await fetch(`${threadApiUrl}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messageFormat.toApi([firstMessage]) }),
      });
      return res.json();
    });

  const deleteThreadFn =
    userDeleteThread ??
    (async (id: string) => {
      if (!threadApiUrl) return;
      await fetch(`${threadApiUrl}/delete/${id}`, { method: "DELETE" });
    });

  const updateThreadFn =
    userUpdateThread ??
    (async (updated: Thread) => {
      if (!threadApiUrl) return updated;
      const res = await fetch(`${threadApiUrl}/update/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      return res.json();
    });

  const loadThread =
    userLoadThread ??
    (async (threadId: string): Promise<Message[]> => {
      if (!threadApiUrl) return [];
      const res = await fetch(`${threadApiUrl}/get/${threadId}`);
      const raw: unknown = await res.json();
      return messageFormat.fromApi(raw);
    });

  const sendMessage =
    userProcessMessage ??
    (async ({
      threadId,
      messages,
      abortController,
    }: {
      threadId: string;
      messages: Message[];
      abortController: AbortController;
    }) => {
      if (!apiUrl) throw new Error("apiUrl or processMessage required");
      return fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          messages: messageFormat.toApi(messages),
        }),
        signal: abortController.signal,
      });
    });

  // ── Store ──

  const store = createStore<ChatStore>((set, get) => ({
    // Thread List State
    threads: [],
    isLoadingThreads: false,
    threadListError: null,
    selectedThreadId: null,
    hasMoreThreads: false,
    _nextCursor: undefined,

    // Thread State
    messages: [],
    isRunning: false,
    isLoadingMessages: false,
    threadError: null,
    _abortController: null,

    // ── Thread List Actions ──

    loadThreads: () => {
      set({ isLoadingThreads: true, threadListError: null });
      fetchThreadList(undefined)
        .then(({ threads = [], nextCursor }) => {
          set({
            threads,
            isLoadingThreads: false,
            _nextCursor: nextCursor,
            hasMoreThreads: nextCursor !== undefined,
          });
        })
        .catch((e) => {
          set({ isLoadingThreads: false, threadListError: e });
        });
    },

    loadMoreThreads: () => {
      const cursor = get()._nextCursor;
      if (cursor === undefined) return;
      fetchThreadList(cursor)
        .then(({ threads = [], nextCursor }) => {
          set((s) => ({
            threads: mergeThreadList(s.threads, threads),
            _nextCursor: nextCursor,
            hasMoreThreads: nextCursor !== undefined,
          }));
        })
        .catch((e) => {
          set({ threadListError: e });
        });
    },

    switchToNewThread: () => {
      get().cancelMessage();
      set({ selectedThreadId: null, messages: [], threadError: null });
    },

    createThread: async (firstMessage: UserMessage) => {
      const thread = await createThread(firstMessage);
      set((s) => ({ threads: mergeThreadList(s.threads, [thread]) }));
      return thread;
    },

    selectThread: (threadId: string) => {
      get().cancelMessage();
      set({
        selectedThreadId: threadId,
        messages: [],
        isLoadingMessages: true,
        threadError: null,
      });
      loadThread(threadId)
        .then((messages) => set({ messages, isLoadingMessages: false }))
        .catch((e) => set({ threadError: e, isLoadingMessages: false }));
    },

    updateThread: (thread: Thread) => {
      const setPending = (id: string, isPending: boolean) =>
        set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)) }));
      setPending(thread.id, true);
      updateThreadFn(thread)
        .then((updated) => {
          set((s) => ({
            threads: s.threads.map((t) => (t.id === updated.id ? updated : t)),
          }));
        })
        .catch(() => setPending(thread.id, false));
    },

    deleteThread: (threadId: string) => {
      const setPending = (id: string, isPending: boolean) =>
        set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)) }));
      setPending(threadId, true);
      deleteThreadFn(threadId)
        .then(() => {
          const state = get();
          set({ threads: state.threads.filter((t) => t.id !== threadId) });
          if (state.selectedThreadId === threadId) {
            state.switchToNewThread();
          }
        })
        .catch(() => setPending(threadId, false));
    },

    // ── Thread Actions ──

    processMessage: async (message) => {
      const state = get();
      if (state.isRunning) return;

      const abortController = new AbortController();
      const optimisticMessage: UserMessage = {
        ...message,
        id: crypto.randomUUID(),
        role: "user",
      };

      set({ _abortController: abortController, isRunning: true, threadError: null });
      set((s) => ({ messages: [...s.messages, optimisticMessage] }));

      abortController.signal.addEventListener("abort", () => {
        set({ _abortController: null, isRunning: false });
      });

      try {
        let threadId = get().selectedThreadId;

        if (!threadId) {
          if (userCreateThread || threadApiUrl) {
            const created = await get().createThread(optimisticMessage);
            threadId = created.id;
            set({ selectedThreadId: threadId });
          } else {
            threadId = "ephemeral";
          }
        }

        const response = await sendMessage({
          threadId,
          messages: get().messages,
          abortController,
        });

        if (response instanceof Response && !response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const messageCountBefore = get().messages.length;

        await processStreamedMessage({
          response,
          createMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
          updateMessage: (msg) =>
            set((s) => ({
              messages: s.messages.map((m) => (m.id === msg.id ? msg : m)),
            })),
          deleteMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
          adapter: streamProtocol,
        });

        if (get().messages.length === messageCountBefore) {
          throw new Error("Failed to get a response. Please check your connection and try again.");
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error("[OpenUI] processMessage failed:", error);
          set({ threadError: error });
        }
      } finally {
        set({ _abortController: null, isRunning: false });
      }
    },

    appendMessages: (...newMessages: Message[]) => {
      set((s) => ({ messages: [...s.messages, ...newMessages] }));
    },

    updateMessage: (message: Message) => {
      set((s) => ({
        messages: s.messages.map((m) => (m.id === message.id ? message : m)),
      }));
    },

    setMessages: (messages: Message[]) => {
      set({ messages });
    },

    deleteMessage: (messageId: string) => {
      set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) }));
    },

    cancelMessage: () => {
      get()._abortController?.abort();
    },
  }));

  return store;
};
