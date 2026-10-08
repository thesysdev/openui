import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message, Thread, UserMessage } from "../types";
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

      expect(store.getState().isLoadingThreads).toBe(false);
      store.getState().loadThreads();
      expect(store.getState().isLoadingThreads).toBe(true);

      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(listThreads).toHaveBeenCalledWith(undefined);
    });

    it("sets threadListError on failure", async () => {
      const error = new Error("network");
      const listThreads = vi.fn().mockRejectedValue(error);

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threadListError).toBe(error);
    });

    it("handles pagination cursor", async () => {
      const listThreads = vi.fn().mockResolvedValue({
        threads: [makeThread("t1")],
        nextCursor: "page2",
      });

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().hasMoreThreads).toBe(true);
      expect(listThreads).toHaveBeenCalledWith(undefined);
    });
  });

  describe("loadMoreThreads", () => {
    it("appends threads using cursor", async () => {
      const page1 = [makeThread("t1")];
      const page2 = [makeThread("t2", 1)];
      const listThreads = vi
        .fn()
        .mockResolvedValueOnce({ threads: page1, nextCursor: "c2" })
        .mockResolvedValueOnce({ threads: page2 });

      const store = makeStore({ listThreads });

      store.getState().loadThreads();
      await flushPromises();
      expect(store.getState().threads).toHaveLength(1);

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(listThreads).toHaveBeenCalledWith("c2");
    });

    it("no-ops when no more pages", async () => {
      const listThreads = vi.fn().mockResolvedValue({ threads: [makeThread("t1")] });

      const store = makeStore({ listThreads });
      store.getState().loadThreads();
      await flushPromises();

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(listThreads).toHaveBeenCalledTimes(1);
    });
  });

  describe("selectThread", () => {
    it("sets selectedThreadId, loads messages, clears previous", async () => {
      const messages: Message[] = [makeMessage("m1"), makeMessage("m2", "assistant")];
      const getMessages = vi.fn().mockResolvedValue(messages);

      const store = makeStore({ getMessages });

      store.setState({ messages: [makeMessage("old")] });

      store.getState().selectThread("t1");

      expect(store.getState().selectedThreadId).toBe("t1");
      expect(store.getState().messages).toEqual([]);
      expect(store.getState().isLoadingMessages).toBe(true);

      await flushPromises();

      expect(store.getState().messages).toEqual(messages);
      expect(store.getState().isLoadingMessages).toBe(false);
      expect(getMessages).toHaveBeenCalledWith("t1");
    });

    it("sets threadError on load failure", async () => {
      const error = new Error("load failed");
      const getMessages = vi.fn().mockRejectedValue(error);

      const store = makeStore({ getMessages });
      store.getState().selectThread("t1");
      await flushPromises();

      expect(store.getState().threadError).toBe(error);
      expect(store.getState().isLoadingMessages).toBe(false);
    });
  });

  describe("switchToNewThread", () => {
    it("clears selection, messages, and errors", () => {
      const store = makeStore();

      store.setState({
        selectedThreadId: "t1",
        messages: [makeMessage("m1")],
        threadError: new Error("old"),
      });

      store.getState().switchToNewThread();

      expect(store.getState().selectedThreadId).toBeNull();
      expect(store.getState().messages).toEqual([]);
      expect(store.getState().threadError).toBeNull();
    });
  });

  describe("createThread", () => {
    it("adds thread to list", async () => {
      const newThread = makeThread("t-new");
      const createThread = vi.fn().mockResolvedValue(newThread);

      const store = makeStore({ createThread });
      store.setState({ threads: [makeThread("t-existing")] });

      const result = await store.getState().createThread({
        id: "m1",
        role: "user",
        content: "hello",
      } as UserMessage);

      expect(result).toEqual(newThread);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().threads.map((t) => t.id)).toContain("t-new");
    });
  });

  describe("deleteThread", () => {
    it("removes thread from list", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = makeStore({ deleteThread });

      store.setState({ threads: [makeThread("t1"), makeThread("t2", 1)] });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(store.getState().threads).toHaveLength(1);
      expect(store.getState().threads[0].id).toBe("t2");
    });

    it("switches to new thread if deleted thread was selected", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = makeStore({ deleteThread });

      store.setState({
        threads: [makeThread("t1")],
        selectedThreadId: "t1",
        messages: [makeMessage("m1")],
      });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(store.getState().selectedThreadId).toBeNull();
      expect(store.getState().messages).toEqual([]);
    });

    it("sets isPending during operation", async () => {
      let resolveDelete: () => void;
      const deleteThread = vi.fn().mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolveDelete = r;
          }),
      );

      const store = makeStore({ deleteThread });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().deleteThread("t1");

      expect(store.getState().threads[0].isPending).toBe(true);

      resolveDelete!();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(0);
    });
  });

  describe("updateThread", () => {
    it("updates thread in list", async () => {
      const updated = { ...makeThread("t1"), title: "Renamed" };
      const updateThread = vi.fn().mockResolvedValue(updated);

      const store = makeStore({ updateThread });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().updateThread(updated);
      await flushPromises();

      expect(store.getState().threads[0].title).toBe("Renamed");
    });
  });

  // ────────────────────────────────────────────
  // Message CRUD
  // ────────────────────────────────────────────

  describe("message CRUD", () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
      store = makeStore();
      store.setState({ messages: [makeMessage("m1"), makeMessage("m2", "assistant")] });
    });

    it("appendMessages adds to end", () => {
      store.getState().appendMessages(makeMessage("m3"));
      expect(store.getState().messages).toHaveLength(3);
      expect(store.getState().messages[2].id).toBe("m3");
    });

    it("setMessages replaces all", () => {
      store.getState().setMessages([makeMessage("new")]);
      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].id).toBe("new");
    });

    it("updateMessage replaces by id", () => {
      const updated = { ...makeMessage("m1"), content: "edited" } as Message;
      store.getState().updateMessage(updated);
      expect((store.getState().messages[0] as any).content).toBe("edited");
    });

    it("deleteMessage removes by id", () => {
      store.getState().deleteMessage("m1");
      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].id).toBe("m2");
    });
  });

  // ────────────────────────────────────────────
  // processMessage (calls llm.send)
  // ────────────────────────────────────────────

  describe("processMessage", () => {
    it("appends optimistic user message and calls llm.send", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({
        send,
        streamProtocol: { parse: async function* () {} },
      });

      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].role).toBe("user");
      expect(store.getState().isRunning).toBe(false);
      expect(send).toHaveBeenCalledOnce();
    });

    it("creates thread when none selected", async () => {
      const newThread = makeThread("t-auto");
      const createThread = vi.fn().mockResolvedValue(newThread);
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({
        createThread,
        send,
        streamProtocol: { parse: async function* () {} },
      });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(createThread).toHaveBeenCalledOnce();
      expect(store.getState().selectedThreadId).toBe("t-auto");
    });

    it("no-ops when already running", async () => {
      const send = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = makeStore({
        send,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ isRunning: true, selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(send).not.toHaveBeenCalled();
    });

    it("sets threadError on failure", async () => {
      const send = vi.fn().mockRejectedValue(new Error("api down"));

      const store = makeStore({
        send,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().threadError).toBeInstanceOf(Error);
      expect(store.getState().threadError?.message).toBe("api down");
      expect(store.getState().isRunning).toBe(false);
    });
  });

  // ────────────────────────────────────────────
  // cancelMessage
  // ────────────────────────────────────────────

  describe("cancelMessage", () => {
    it("aborts in-flight request", async () => {
      let capturedSignal: AbortSignal;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves
      });

      const store = makeStore({
        send,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      const _promise = store.getState().processMessage({ role: "user", content: "hello" });

      await flushPromises();
      expect(store.getState().isRunning).toBe(true);

      store.getState().cancelMessage();

      await flushPromises();
      expect(store.getState().isRunning).toBe(false);
      expect(capturedSignal!.aborted).toBe(true);
    });
  });

  // ────────────────────────────────────────────
  // Thread switch during stream
  // ────────────────────────────────────────────

  describe("selectThread while streaming", () => {
    it("cancels current stream and loads new thread", async () => {
      let capturedSignal: AbortSignal;
      const send = vi.fn().mockImplementation(({ signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves
      });
      const newMessages = [makeMessage("new-m1")];
      const getMessages = vi.fn().mockResolvedValue(newMessages);

      const store = makeStore({
        send,
        getMessages,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      // Start streaming
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(store.getState().isRunning).toBe(true);

      // Switch thread mid-stream
      store.getState().selectThread("t2");

      expect(capturedSignal!.aborted).toBe(true);
      expect(store.getState().selectedThreadId).toBe("t2");
      expect(store.getState().isLoadingMessages).toBe(true);

      await flushPromises();

      expect(store.getState().messages).toEqual(newMessages);
      expect(store.getState().isLoadingMessages).toBe(false);
    });
  });
});
