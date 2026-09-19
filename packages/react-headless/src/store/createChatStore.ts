import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ChatLLM, ChatStorage } from "../adapters/types";
import { processStreamedMessage } from "../stream/processStreamedMessage";
import type { ChatStore, Message, Thread, ThreadStateEntry, UserMessage } from "./types";

export interface CreateChatStoreConfig {
  storage: ChatStorage;
  llm: ChatLLM;
}

/** Key for a brand-new chat's run before its thread has a real id (see the re-key in `processMessage`). */
const DRAFT_KEY = "__draft__";

const mergeThreadList = (existing: Thread[], incoming: Thread[]): Thread[] =>
  Array.from(new Map([...existing, ...incoming].map((t) => [t.id, t])).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

/** Reset the flat active-thread fields to empty (fresh/blank view). */
const emptyActive = () => ({
  messages: [] as Message[],
  isRunning: false,
  isLoadingMessages: false,
  threadError: null,
  executingToolCallIds: new Set<string>(),
  _abortController: null,
});

// Takes the ref itself and reads `current` at call time, so the caller
// (ChatProvider) can refresh `llm` by mutating or replacing `current`.
export const createChatStore = (configRef: React.RefObject<CreateChatStoreConfig>) => {
  const { storage } = configRef.current;
  const { thread: threadStorage } = storage;

  const store = createStore<ChatStore>()(
    subscribeWithSelector((set, get) => {
      /** Snapshot the flat active-thread fields as a background {@link ThreadStateEntry}. */
      const snapshotActive = (s: ChatStore): ThreadStateEntry => ({
        messages: s.messages,
        isRunning: s.isRunning,
        isLoadingMessages: s.isLoadingMessages,
        threadError: s.threadError,
        executingToolCallIds: s.executingToolCallIds,
        abortController: s._abortController,
      });

      /** Turn a background entry into a flat active-fields patch (`abortController` → `_abortController`). */
      const activeFrom = (e: ThreadStateEntry) => ({
        messages: e.messages,
        isRunning: e.isRunning,
        isLoadingMessages: e.isLoadingMessages,
        threadError: e.threadError,
        executingToolCallIds: e.executingToolCallIds,
        _abortController: e.abortController,
      });

      /** Read a running thread's live state wherever it lives (active flat fields or the background map). */
      const readRun = (s: ChatStore, key: string): ThreadStateEntry | undefined =>
        key === (s.selectedThreadId ?? DRAFT_KEY) ? snapshotActive(s) : s.inFlightThreads[key];

      /**
       * Route a run's write to wherever its thread currently lives: the flat active
       * fields if it's the on-screen thread, else its `inFlightThreads[key]` entry.
       * A run that gets backgrounded mid-flight (user switched away) keeps writing to
       * the map; guarded so a dropped background thread swallows late callbacks.
       */
      const writeRun = (
        key: string,
        fn: (cur: ThreadStateEntry) => Partial<ThreadStateEntry> | null,
      ) =>
        set((s) => {
          if (key === (s.selectedThreadId ?? DRAFT_KEY)) {
            const patch = fn(snapshotActive(s));
            if (!patch) return s;
            const { abortController, ...rest } = patch;
            return "abortController" in patch
              ? { ...rest, _abortController: abortController }
              : rest;
          }
          const cur = s.inFlightThreads[key];
          if (!cur) return s; // dropped background thread — ignore late writes
          const patch = fn(cur);
          if (!patch) return s;
          return { inFlightThreads: { ...s.inFlightThreads, [key]: { ...cur, ...patch } } };
        });

      /** Move the current active thread into the background map (used when switching away mid-stream). */
      const backgroundActive = (key: string) =>
        set((s) => ({ inFlightThreads: { ...s.inFlightThreads, [key]: snapshotActive(s) } }));

      /** Remove a thread's background entry. */
      const dropInFlight = (key: string) =>
        set((s) => {
          if (!(key in s.inFlightThreads)) return s;
          const next = { ...s.inFlightThreads };
          delete next[key];
          return { inFlightThreads: next };
        });

      return {
        // ── Thread List State ──
        threads: [],
        isLoadingThreads: false,
        threadListError: null,
        selectedThreadId: null,
        hasMoreThreads: false,
        isCreatingThread: false,
        _nextCursor: undefined,

        // ── Active Thread State (flat, like the single-thread store) ──
        ...emptyActive(),

        // ── Background streaming threads (NOT the active one) ──
        inFlightThreads: {},

        // ── Thread List Actions ──

        loadThreads: () => {
          set({ isLoadingThreads: true, threadListError: null });
          threadStorage
            .listThreads(undefined)
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
          threadStorage
            .listThreads(cursor)
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
          // Guard the create window — a draft still becoming a real thread owns the
          // flat fields; resetting now would collide with its re-key.
          if (get().isCreatingThread) return;
          const s = get();
          // A still-streaming active thread keeps running in the background; an idle
          // one is simply discarded (no stale cache).
          if (s.isRunning) backgroundActive(s.selectedThreadId ?? DRAFT_KEY);
          set({ selectedThreadId: null, ...emptyActive() });
        },

        createThread: async (firstMessage: UserMessage) => {
          const thread = await threadStorage.createThread(firstMessage);
          set((s) => ({ threads: mergeThreadList(s.threads, [thread]) }));
          return thread;
        },

        selectThread: (threadId: string) => {
          const s = get();
          const leftKey = s.selectedThreadId ?? DRAFT_KEY;
          if (leftKey === threadId) return; // re-selecting the active thread — no-op

          // Keep the thread we're leaving alive in the background only if it's still
          // streaming; otherwise let it go (it will reload from storage on return).
          if (s.isRunning) backgroundActive(leftKey);

          set({ selectedThreadId: threadId });

          // If the target is streaming in the background, promote it into the flat
          // active fields (live — no reload).
          const bg = get().inFlightThreads[threadId];
          if (bg) {
            set((st) => {
              const next = { ...st.inFlightThreads };
              delete next[threadId];
              return { ...activeFrom(bg), inFlightThreads: next };
            });
            return;
          }

          // Otherwise load a fresh copy from storage.
          set({ ...emptyActive(), isLoadingMessages: true });
          threadStorage
            .getMessages(threadId)
            .then((messages) => {
              if ((get().selectedThreadId ?? DRAFT_KEY) !== threadId) return; // navigated away
              set({ messages, isLoadingMessages: false });
            })
            .catch((e) => {
              if ((get().selectedThreadId ?? DRAFT_KEY) !== threadId) return;
              set({ threadError: e, isLoadingMessages: false });
            });
        },

        updateThread: (thread: Thread) => {
          const setPending = (id: string, isPending: boolean) =>
            set((s) => ({
              threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)),
            }));
          setPending(thread.id, true);
          threadStorage
            .updateThread(thread)
            .then((updated) => {
              set((s) => ({
                threads: s.threads.map((t) => (t.id === updated.id ? updated : t)),
              }));
            })
            .catch(() => setPending(thread.id, false));
        },

        deleteThread: (threadId: string) => {
          const setPending = (id: string, isPending: boolean) =>
            set((s) => ({
              threads: s.threads.map((t) => (t.id === id ? { ...t, isPending } : t)),
            }));
          setPending(threadId, true);
          threadStorage
            .deleteThread(threadId)
            .then(() => {
              const state = get();
              const isActive = state.selectedThreadId === threadId;
              // Abort its run whether it's the active thread or a background stream.
              if (isActive) state._abortController?.abort();
              else state.inFlightThreads[threadId]?.abortController?.abort();
              dropInFlight(threadId);
              set((s) => ({ threads: s.threads.filter((t) => t.id !== threadId) }));
              // If we deleted the active thread, clear the flat fields to a blank chat
              // (don't background it — it's gone).
              if (isActive) set({ selectedThreadId: null, ...emptyActive() });
            })
            .catch(() => setPending(threadId, false));
        },

        // ── Thread Actions ──

        processMessage: async (message) => {
          // A run only ever starts on the active thread; block if it's already running.
          if (get().isRunning) return;

          const isNewChat = !get().selectedThreadId;
          // The run's key — a mutable local so post-re-key callbacks target the real id.
          let runKey = get().selectedThreadId ?? DRAFT_KEY;
          const abortController = new AbortController();
          const optimisticMessage: UserMessage = {
            ...message,
            id: crypto.randomUUID(),
            role: "user",
          };

          // Start the run on the active (flat) fields.
          set((s) => ({
            messages: [...s.messages, optimisticMessage],
            isRunning: true,
            threadError: null,
            executingToolCallIds: new Set<string>(),
            _abortController: abortController,
            ...(isNewChat ? { isCreatingThread: true } : null),
          }));

          // On abort, flip the run off wherever it now lives.
          abortController.signal.addEventListener("abort", () => {
            writeRun(runKey, () => ({ isRunning: false, abortController: null }));
          });

          try {
            if (isNewChat) {
              try {
                const created = await get().createThread(optimisticMessage);
                // Re-key the draft to its real id. Two cases:
                //  A) still on the draft (flat active) → just relabel selectedThreadId.
                //  B) navigated away mid-creation → the draft was moved to
                //     inFlightThreads[DRAFT_KEY]; re-key it there (stays background).
                set((s) => {
                  if (DRAFT_KEY in s.inFlightThreads) {
                    const draft = s.inFlightThreads[DRAFT_KEY]!;
                    const next = { ...s.inFlightThreads };
                    delete next[DRAFT_KEY];
                    next[created.id] = draft;
                    return { inFlightThreads: next };
                  }
                  return s.selectedThreadId === null ? { selectedThreadId: created.id } : s;
                });
                runKey = created.id;
              } finally {
                set({ isCreatingThread: false });
              }
            }

            const response = await configRef.current.llm.send({
              threadId: runKey,
              messages: readRun(get(), runKey)?.messages ?? [],
              signal: abortController.signal,
            });

            if (response instanceof Response && !response.ok) {
              throw new Error(`Request failed: ${response.status} ${response.statusText}`);
            }

            await processStreamedMessage({
              response,
              createMessage: (msg) =>
                writeRun(runKey, (cur) => ({ messages: [...cur.messages, msg] })),
              updateMessage: (msg) =>
                writeRun(runKey, (cur) => ({
                  messages: cur.messages.map((m) => (m.id === msg.id ? msg : m)),
                })),
              // Keep the Set reference stable (return null) when membership is
              // unchanged so `useToolActivities` doesn't re-run needlessly.
              markToolExecuting: (id) =>
                writeRun(runKey, (cur) =>
                  cur.executingToolCallIds.has(id)
                    ? null
                    : { executingToolCallIds: new Set(cur.executingToolCallIds).add(id) },
                ),
              clearToolExecuting: (id) =>
                writeRun(runKey, (cur) => {
                  if (!cur.executingToolCallIds.has(id)) return null;
                  const next = new Set(cur.executingToolCallIds);
                  next.delete(id);
                  return { executingToolCallIds: next };
                }),
              adapter: configRef.current.llm.streamProtocol,
            });
          } catch (e) {
            if (!abortController.signal.aborted) {
              writeRun(runKey, () => ({
                threadError: e instanceof Error ? e : new Error(String(e)),
              }));
            }
          } finally {
            writeRun(runKey, () => ({
              isRunning: false,
              abortController: null,
              executingToolCallIds: new Set<string>(),
            }));
            // If the run finished on a BACKGROUND thread, drop it — it's no longer
            // active or streaming, so a return trip reloads it fresh from storage.
            if (runKey !== (get().selectedThreadId ?? DRAFT_KEY)) dropInFlight(runKey);
          }
        },

        appendMessages: (...newMessages: Message[]) =>
          set((s) => ({ messages: [...s.messages, ...newMessages] })),

        updateMessage: (message: Message) =>
          set((s) => ({ messages: s.messages.map((m) => (m.id === message.id ? message : m)) })),

        setMessages: (messages: Message[]) => set({ messages }),

        deleteMessage: (messageId: string) =>
          set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) })),

        cancelMessage: () => {
          get()._abortController?.abort();
        },
      };
    }),
  );

  return store;
};
