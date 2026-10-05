import { describe, expect, it, vi } from "vitest";
import type { Message, Thread, ThreadStateEntry } from "../types";
import { makeStore } from "./__helpers/makeStore";

// ── Helpers ──

const makeThread = (id: string, daysAgo = 0): Thread => ({
  id,
  title: `Thread ${id}`,
  createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
});

const makeMessage = (id: string, role: "user" | "assistant" = "user"): Message =>
  ({ id, role, content: `msg-${id}` }) as Message;

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

type Store = ReturnType<typeof makeStore>;

/** The active thread's flat state — what `useThread` shows. */
const active = (store: Store) => {
  const s = store.getState();
  return {
    messages: s.messages,
    isRunning: s.isRunning,
    isLoadingMessages: s.isLoadingMessages,
    threadError: s.threadError,
    executingToolCallIds: s.executingToolCallIds,
  };
};

/** A thread's BACKGROUND entry (undefined unless it's streaming while not active). */
const bgOf = (store: Store, id: string): ThreadStateEntry | undefined =>
  store.getState().inFlightThreads[id];

// ── Test suite ──

describe("createChatStore", () => {
  // ────────────────────────────────────────────
  // Thread List
  // ────────────────────────────────────────────

  describe("loadThreads", () => {
    it("fetches threads and sets state", async () => {
      const threads = [makeThread("t1"), makeThread("t2", 1)];
      const listThreads = vi.fn().mockResolvedValue({ threads });
      const store = makeStore({ listThreads });

      store.getState().loadThreads();
      expect(store.getState().isLoadingThreads).toBe(true);
      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threads).toHaveLength(2);
    });

    it("sets threadListError on failure", async () => {
      const error = new Error("network");
      const store = makeStore({ listThreads: vi.fn().mockRejectedValue(error) });
      store.getState().loadThreads();
      await flushPromises();
      expect(store.getState().threadListError).toBe(error);
    });
  });

  describe("loadMoreThreads", () => {
    it("appends threads using cursor", async () => {
      const listThreads = vi
        .fn()
        .mockResolvedValueOnce({ threads: [makeThread("t1")], nextCursor: "c2" })
        .mockResolvedValueOnce({ threads: [makeThread("t2", 1)] });
      const store = makeStore({ listThreads });

      store.getState().loadThreads();
      await flushPromises();
      store.getState().loadMoreThreads();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(2);
      expect(listThreads).toHaveBeenCalledWith("c2");
    });
  });

  // ────────────────────────────────────────────
  // selectThread — loads into the active (flat) fields
  // ────────────────────────────────────────────

  describe("selectThread", () => {
    it("loads the thread's messages into the active fields", async () => {
      const messages = [makeMessage("m1"), makeMessage("m2", "assistant")];
      const getMessages = vi.fn().mockResolvedValue(messages);
      const store = makeStore({ getMessages });

      store.getState().selectThread("t1");
      expect(store.getState().selectedThreadId).toBe("t1");
      expect(active(store).isLoadingMessages).toBe(true);

      await flushPromises();
      expect(active(store).messages).toEqual(messages);
      expect(active(store).isLoadingMessages).toBe(false);
      expect(getMessages).toHaveBeenCalledWith("t1");
    });

    it("discards an idle thread on switch (no background entry) and reloads on return", async () => {
      const getMessages = vi.fn().mockResolvedValue([makeMessage("stored")]);
      const store = makeStore({ getMessages });

      store.getState().selectThread("t1");
      await flushPromises();
      store.getState().selectThread("t2"); // leaving idle t1
      await flushPromises();

      expect(bgOf(store, "t1")).toBeUndefined(); // not kept in the background
      // Returning to t1 reloads it from storage (fresh, no stale in-memory copy).
      store.getState().selectThread("t1");
      await flushPromises();
      expect(getMessages).toHaveBeenCalledWith("t1");
      expect(getMessages).toHaveBeenCalledTimes(3); // t1, t2, t1 again
    });

    it("sets threadError on load failure", async () => {
      const error = new Error("load failed");
      const store = makeStore({ getMessages: vi.fn().mockRejectedValue(error) });
      store.getState().selectThread("t1");
      await flushPromises();
      expect(active(store).threadError).toBe(error);
      expect(active(store).isLoadingMessages).toBe(false);
    });
  });

  describe("switchToNewThread", () => {
    it("clears the active fields to a blank chat", () => {
      const store = makeStore();
      store.setState({ selectedThreadId: "t1", messages: [makeMessage("m1")] });

      store.getState().switchToNewThread();

      expect(store.getState().selectedThreadId).toBeNull();
      expect(active(store).messages).toEqual([]);
    });

    it("is a no-op while a new thread is being created", async () => {
      let resolveCreate!: (t: Thread) => void;
      const createThread = vi
        .fn()
        .mockImplementation(() => new Promise<Thread>((r) => (resolveCreate = r)));
      const send = vi.fn().mockImplementation(() => new Promise(() => {}));
      const store = makeStore({
        createThread,
        send,
        streamProtocol: { parse: async function* () {} },
      });

      store.getState().processMessage({ role: "user", content: "hi" });
      await flushPromises();
      expect(store.getState().isCreatingThread).toBe(true);

      store.getState().switchToNewThread(); // ignored mid-creation
      expect(active(store).isRunning).toBe(true);

      resolveCreate(makeThread("t-real"));
      await flushPromises();
      expect(store.getState().isCreatingThread).toBe(false);
    });
  });

  describe("deleteThread", () => {
    it("removes the thread from the list", async () => {
      const store = makeStore({ deleteThread: vi.fn().mockResolvedValue(undefined) });
      store.setState({ threads: [makeThread("t1"), makeThread("t2", 1)] });
      store.getState().deleteThread("t1");
      await flushPromises();
      expect(store.getState().threads.map((t) => t.id)).toEqual(["t2"]);
    });

    it("clears the active view when the deleted thread was selected", async () => {
      const store = makeStore({ deleteThread: vi.fn().mockResolvedValue(undefined) });
      store.setState({
        threads: [makeThread("t1")],
        selectedThreadId: "t1",
        messages: [makeMessage("m1")],
      });
      store.getState().deleteThread("t1");
      await flushPromises();
      expect(store.getState().selectedThreadId).toBeNull();
      expect(active(store).messages).toEqual([]);
    });

    it("aborts and drops a background streaming thread", async () => {
      let capturedSignal: AbortSignal | undefined;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {});
      });
      const store = makeStore({
        deleteThread: vi.fn().mockResolvedValue(undefined),
        send,
        streamProtocol: { parse: async function* () {} },
      });
      // Start a run on t1, switch away so it streams in the background.
      store.setState({ threads: [makeThread("t1")], selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "hi" });
      await flushPromises();
      store.getState().selectThread("t2");
      await flushPromises();
      expect(bgOf(store, "t1")?.isRunning).toBe(true);

      store.getState().deleteThread("t1");
      await flushPromises();
      expect(capturedSignal?.aborted).toBe(true);
      expect(bgOf(store, "t1")).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────
  // Message CRUD (on the active thread)
  // ────────────────────────────────────────────

  describe("message CRUD", () => {
    it("appends, replaces, updates and deletes on the active fields", () => {
      const store = makeStore();
      store.setState({ messages: [makeMessage("m1"), makeMessage("m2", "assistant")] });

      store.getState().appendMessages(makeMessage("m3"));
      expect(active(store).messages).toHaveLength(3);

      store.getState().updateMessage({ ...makeMessage("m1"), content: "edited" } as Message);
      expect((active(store).messages[0] as any).content).toBe("edited");

      store.getState().deleteMessage("m1");
      expect(active(store).messages.map((m) => m.id)).toEqual(["m2", "m3"]);

      store.getState().setMessages([makeMessage("only")]);
      expect(active(store).messages.map((m) => m.id)).toEqual(["only"]);
    });
  });

  // ────────────────────────────────────────────
  // processMessage
  // ────────────────────────────────────────────

  describe("processMessage", () => {
    it("appends the optimistic user message and calls llm.send", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(active(store).messages).toHaveLength(1);
      expect(active(store).messages[0].role).toBe("user");
      expect(active(store).isRunning).toBe(false);
      expect(send).toHaveBeenCalledOnce();
    });

    it("creates a thread when none is selected and follows into it", async () => {
      const createThread = vi.fn().mockResolvedValue(makeThread("t-auto"));
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const store = makeStore({
        createThread,
        send,
        streamProtocol: { parse: async function* () {} },
      });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(createThread).toHaveBeenCalledOnce();
      expect(store.getState().selectedThreadId).toBe("t-auto");
      expect(active(store).messages).toHaveLength(1);
      expect(store.getState().isCreatingThread).toBe(false);
    });

    it("no-ops when the active thread is already running", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1", isRunning: true });

      await store.getState().processMessage({ role: "user", content: "hello" });
      expect(send).not.toHaveBeenCalled();
    });

    it("sets threadError on failure", async () => {
      const send = vi.fn().mockRejectedValue(new Error("api down"));
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });
      expect(active(store).threadError?.message).toBe("api down");
      expect(active(store).isRunning).toBe(false);
    });
  });

  // ────────────────────────────────────────────
  // cancelMessage
  // ────────────────────────────────────────────

  describe("cancelMessage", () => {
    it("aborts the active thread's run", async () => {
      let capturedSignal: AbortSignal;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {});
      });
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });
      store.setState({ selectedThreadId: "t1" });

      store.getState().processMessage({ role: "user", content: "hi" });
      await flushPromises();
      expect(active(store).isRunning).toBe(true);

      store.getState().cancelMessage();
      await flushPromises();
      expect(active(store).isRunning).toBe(false);
      expect(capturedSignal!.aborted).toBe(true);
    });

    it("does not abort a background thread's run", async () => {
      const signals: AbortSignal[] = [];
      const send = vi.fn().mockImplementation(({ signal }) => {
        signals.push(signal);
        return new Promise(() => {});
      });
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });

      store.setState({ selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "one" });
      await flushPromises();
      store.getState().selectThread("t2"); // t1 → background
      await flushPromises();

      store.getState().cancelMessage(); // targets the active view (t2), not t1
      await flushPromises();
      expect(signals[0].aborted).toBe(false);
      expect(bgOf(store, "t1")?.isRunning).toBe(true);
    });
  });

  // ────────────────────────────────────────────
  // Background streaming across thread switches
  // ────────────────────────────────────────────

  describe("background streaming", () => {
    it("moves a streaming thread to inFlightThreads on switch, promotes it back on return", async () => {
      let capturedSignal: AbortSignal | undefined;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {});
      });
      const newMessages = [makeMessage("t2-m1")];
      const getMessages = vi.fn().mockResolvedValue(newMessages);
      const store = makeStore({
        send,
        getMessages,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(active(store).isRunning).toBe(true);

      // Switch to t2 — t1 keeps streaming in the background (not aborted).
      store.getState().selectThread("t2");
      expect(capturedSignal?.aborted).toBe(false);
      expect(bgOf(store, "t1")?.isRunning).toBe(true);
      await flushPromises();
      expect(active(store).messages).toEqual(newMessages); // t2 loaded into active

      // Switch back to t1 — promoted out of the background into the active fields (no reload).
      store.getState().selectThread("t1");
      expect(active(store).isRunning).toBe(true);
      expect(active(store).messages).toHaveLength(1); // optimistic user message
      expect(bgOf(store, "t1")).toBeUndefined();
      expect(getMessages).toHaveBeenCalledTimes(1); // only t2 was loaded
    });

    it("runs a background thread and the active thread concurrently", async () => {
      const signals: AbortSignal[] = [];
      const send = vi.fn().mockImplementation(({ signal }) => {
        signals.push(signal);
        return new Promise(() => {});
      });
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });

      store.setState({ selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "one" });
      await flushPromises();
      store.getState().selectThread("t2");
      await flushPromises();
      store.getState().processMessage({ role: "user", content: "two" });
      await flushPromises();

      expect(bgOf(store, "t1")?.isRunning).toBe(true); // background
      expect(active(store).isRunning).toBe(true); // active (t2)
      expect(send).toHaveBeenCalledTimes(2);
      expect(signals[0]).not.toBe(signals[1]);
    });

    it("drops a background run from inFlightThreads when it completes", async () => {
      let resolveSend!: (r: Response) => void;
      const send = vi
        .fn()
        .mockImplementation(() => new Promise<Response>((r) => (resolveSend = r)));
      const store = makeStore({ send, streamProtocol: { parse: async function* () {} } });

      store.setState({ selectedThreadId: "t1" });
      store.getState().processMessage({ role: "user", content: "hi" });
      await flushPromises();
      store.getState().selectThread("t2"); // t1 → background (still awaiting send)
      await flushPromises();
      expect(bgOf(store, "t1")?.isRunning).toBe(true);

      resolveSend(new Response("", { status: 200 })); // stream resolves + completes (empty)
      await flushPromises();
      expect(bgOf(store, "t1")).toBeUndefined(); // dropped on completion
    });

    it("backgrounds a draft run when the user navigates away mid-creation", async () => {
      let resolveCreate!: (t: Thread) => void;
      const createThread = vi
        .fn()
        .mockImplementation(() => new Promise<Thread>((r) => (resolveCreate = r)));
      const send = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
      const getMessages = vi.fn().mockResolvedValue([]);
      const store = makeStore({
        createThread,
        send,
        getMessages,
        streamProtocol: { parse: async function* () {} },
      });

      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(store.getState().isCreatingThread).toBe(true);

      store.getState().selectThread("saved"); // leave the draft mid-creation
      await flushPromises();

      resolveCreate(makeThread("t-real"));
      await flushPromises();

      expect(store.getState().selectedThreadId).toBe("saved"); // did not follow
      expect(bgOf(store, "t-real")?.isRunning).toBe(true); // re-keyed draft runs in background
      expect(bgOf(store, "t-real")?.messages).toHaveLength(1);
      expect(store.getState().isCreatingThread).toBe(false);
    });
  });
});
