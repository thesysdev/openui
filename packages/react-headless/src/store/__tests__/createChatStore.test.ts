import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChatStore } from "../createChatStore";
import type { Message, Thread, UserMessage } from "../types";

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
      const fetchThreadList = vi.fn().mockResolvedValue({ threads });

      const store = createChatStore({ fetchThreadList, processMessage: vi.fn() });

      expect(store.getState().isLoadingThreads).toBe(false);
      store.getState().loadThreads();
      expect(store.getState().isLoadingThreads).toBe(true);

      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(fetchThreadList).toHaveBeenCalledWith(undefined);
    });

    it("sets threadListError on failure", async () => {
      const error = new Error("network");
      const fetchThreadList = vi.fn().mockRejectedValue(error);

      const store = createChatStore({ fetchThreadList, processMessage: vi.fn() });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().isLoadingThreads).toBe(false);
      expect(store.getState().threadListError).toBe(error);
    });

    it("handles pagination cursor", async () => {
      const fetchThreadList = vi.fn().mockResolvedValue({
        threads: [makeThread("t1")],
        nextCursor: "page2",
      });

      const store = createChatStore({ fetchThreadList, processMessage: vi.fn() });
      store.getState().loadThreads();
      await flushPromises();

      expect(store.getState().hasMoreThreads).toBe(true);
      expect(fetchThreadList).toHaveBeenCalledWith(undefined);
    });
  });

  describe("loadMoreThreads", () => {
    it("appends threads using cursor", async () => {
      const page1 = [makeThread("t1")];
      const page2 = [makeThread("t2", 1)];
      const fetchThreadList = vi
        .fn()
        .mockResolvedValueOnce({ threads: page1, nextCursor: "c2" })
        .mockResolvedValueOnce({ threads: page2 });

      const store = createChatStore({ fetchThreadList, processMessage: vi.fn() });

      store.getState().loadThreads();
      await flushPromises();
      expect(store.getState().threads).toHaveLength(1);

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().hasMoreThreads).toBe(false);
      expect(fetchThreadList).toHaveBeenCalledWith("c2");
    });

    it("no-ops when no more pages", async () => {
      const fetchThreadList = vi.fn().mockResolvedValue({ threads: [makeThread("t1")] });

      const store = createChatStore({ fetchThreadList, processMessage: vi.fn() });
      store.getState().loadThreads();
      await flushPromises();

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(fetchThreadList).toHaveBeenCalledTimes(1);
    });
  });

  describe("selectThread", () => {
    it("sets selectedThreadId, loads messages, clears previous", async () => {
      const messages: Message[] = [makeMessage("m1"), makeMessage("m2", "assistant")];
      const loadThread = vi.fn().mockResolvedValue(messages);

      const store = createChatStore({ loadThread, processMessage: vi.fn() });

      store.setState({ messages: [makeMessage("old")] });

      store.getState().selectThread("t1");

      expect(store.getState().selectedThreadId).toBe("t1");
      expect(store.getState().messages).toEqual([]);
      expect(store.getState().isLoadingMessages).toBe(true);

      await flushPromises();

      expect(store.getState().messages).toEqual(messages);
      expect(store.getState().isLoadingMessages).toBe(false);
      expect(loadThread).toHaveBeenCalledWith("t1");
    });

    it("sets threadError on load failure", async () => {
      const error = new Error("load failed");
      const loadThread = vi.fn().mockRejectedValue(error);

      const store = createChatStore({ loadThread, processMessage: vi.fn() });
      store.getState().selectThread("t1");
      await flushPromises();

      expect(store.getState().threadError).toBe(error);
      expect(store.getState().isLoadingMessages).toBe(false);
    });
  });

  describe("switchToNewThread", () => {
    it("clears selection, messages, and errors", () => {
      const store = createChatStore({ processMessage: vi.fn() });

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

      const store = createChatStore({ createThread, processMessage: vi.fn() });
      store.setState({ threads: [makeThread("t-existing")] });

      const result = await store.getState().createThread({
        id: "m1",
        role: "user",
        content: "hello",
      } as UserMessage);

      expect(result).toEqual(newThread);
      expect(store.getState().threads).toHaveLength(2);
      expect(store.getState().threads.map((t: Thread) => t.id)).toContain("t-new");
    });
  });

  describe("deleteThread", () => {
    it("removes thread from list", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = createChatStore({ deleteThread, processMessage: vi.fn() });

      store.setState({ threads: [makeThread("t1"), makeThread("t2", 1)] });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(store.getState().threads).toHaveLength(1);
      expect(store.getState().threads[0].id).toBe("t2");
    });

    it("switches to new thread if deleted thread was selected", async () => {
      const deleteThread = vi.fn().mockResolvedValue(undefined);
      const store = createChatStore({ deleteThread, processMessage: vi.fn() });

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

      const store = createChatStore({ deleteThread, processMessage: vi.fn() });
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

      const store = createChatStore({ updateThread, processMessage: vi.fn() });
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
    let store: ReturnType<typeof createChatStore>;

    beforeEach(() => {
      store = createChatStore({ processMessage: vi.fn() });
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
  // processMessage
  // ────────────────────────────────────────────

  describe("processMessage", () => {
    it("appends optimistic user message and calls processMessage", async () => {
      const processMessage = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = createChatStore({
        processMessage,
        streamProtocol: { parse: async function* () {} },
      });

      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].role).toBe("user");
      expect(store.getState().isRunning).toBe(false);
      expect(processMessage).toHaveBeenCalledOnce();
    });

    it("creates thread when none selected", async () => {
      const newThread = makeThread("t-auto");
      const createThread = vi.fn().mockResolvedValue(newThread);
      const processMessage = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = createChatStore({
        createThread,
        processMessage,
        streamProtocol: { parse: async function* () {} },
      });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(createThread).toHaveBeenCalledOnce();
      expect(store.getState().selectedThreadId).toBe("t-auto");
    });

    it("no-ops when already running", async () => {
      const processMessage = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

      const store = createChatStore({
        processMessage,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ isRunning: true, selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(processMessage).not.toHaveBeenCalled();
    });

    it("sets threadError on failure", async () => {
      const processMessage = vi.fn().mockRejectedValue(new Error("api down"));

      const store = createChatStore({
        processMessage,
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
      let capturedAbort: AbortController;
      const processMessage = vi.fn().mockImplementation(
        ({ abortController }: { abortController: AbortController }) => {
          capturedAbort = abortController;
          return new Promise(() => {}); // never resolves
        },
      );

      const store = createChatStore({
        processMessage,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      store.getState().processMessage({ role: "user", content: "hello" });

      await flushPromises();
      expect(store.getState().isRunning).toBe(true);

      store.getState().cancelMessage();

      await flushPromises();
      expect(store.getState().isRunning).toBe(false);
      expect(capturedAbort!.signal.aborted).toBe(true);
    });
  });

  // ────────────────────────────────────────────
  // apiUrl (default fetch-based processMessage)
  // ────────────────────────────────────────────

  describe("apiUrl", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
    });

    it("sends POST to apiUrl with threadId and messages", async () => {
      const sseBody = `data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", delta: "hi" })}\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(sseBody));
          c.close();
        },
      });
      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/chat");
      expect(opts.method).toBe("POST");

      const body = JSON.parse(opts.body);
      expect(body.threadId).toBe("t1");
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe("user");
    });

    it("passes abortController.signal to fetch", async () => {
      fetchSpy.mockImplementation(() => new Promise(() => {}));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      store.getState().processMessage({ role: "user", content: "hi" });
      await flushPromises();

      const [, opts] = fetchSpy.mock.calls[0];
      expect(opts.signal).toBeInstanceOf(AbortSignal);
    });

    it("streams response via processStreamedMessage", async () => {
      const sseBody = `data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", delta: "response text" })}\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(sseBody));
          c.close();
        },
      });
      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(2);
      expect(store.getState().messages[0].role).toBe("user");
      expect(store.getState().messages[1].role).toBe("assistant");
      expect((store.getState().messages[1] as any).content).toBe("response text");
    });

    it("handles SSE events split across arbitrary chunks", async () => {
      const encoder = new TextEncoder();

      const part1 = "data: {\"type\": \"TEXT_MESSAGE_CONTENT\", \"delta\": \"split";
      const part2 = " over chunks\"}\n\n";
      const done = "data: [DONE]\n\n";

      const stream = new ReadableStream({
        start(c) {
          c.enqueue(encoder.encode(part1));
          c.enqueue(encoder.encode(part2));
          c.enqueue(encoder.encode(done));
          c.close();
        },
      });

      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(2);
      expect((store.getState().messages[1] as any).content).toBe("split over chunks");
    });

    it("supports CRLF + multi-line data fields", async () => {
      const encoder = new TextEncoder();

      // SSE spec: multiple `data:` lines are joined with `\n`.
      // Newlines between JSON tokens are valid whitespace.
      const sse =
        "data: {\"type\":\"TEXT_MESSAGE_CONTENT\",\r\n" +
        "data: \"delta\":\"multiline\"}\r\n" +
        "\r\n" +
        "data: [DONE]\r\n\r\n";

      const stream = new ReadableStream({
        start(c) {
          c.enqueue(encoder.encode(sse));
          c.close();
        },
      });

      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(2);
      expect((store.getState().messages[1] as any).content).toBe("multiline");
    });

    it("skips malformed events and continues streaming", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const encoder = new TextEncoder();

      const sse =
        "data: {\"type\":\"TEXT_MESSAGE_CONTENT\",\"delta\":\"ok\"}\n\n" +
        // malformed JSON
        "data: {\"type\":\"TEXT_MESSAGE_CONTENT\",\"delta\":\"bad\"\n\n" +
        "data: {\"type\":\"TEXT_MESSAGE_CONTENT\",\"delta\":\"still ok\"}\n\n" +
        "data: [DONE]\n\n";

      const stream = new ReadableStream({
        start(c) {
          c.enqueue(encoder.encode(sse));
          c.close();
        },
      });

      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().messages).toHaveLength(2);
      expect((store.getState().messages[1] as any).content).toBe("okstill ok");

      warnSpy.mockRestore();
    });

    it("throws when neither apiUrl nor processMessage provided", async () => {
      const store = createChatStore({});
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(store.getState().threadError).toBeInstanceOf(Error);
      expect(store.getState().threadError?.message).toContain("apiUrl or processMessage required");
    });

    it("applies messageFormat.toApi to outbound messages", async () => {
      const sseBody = `data: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(sseBody));
          c.close();
        },
      });
      fetchSpy.mockResolvedValue(new Response(stream));

      const toApi = vi.fn((msgs: Message[]) => msgs.map((m) => ({ custom: m.id })));

      const store = createChatStore({
        apiUrl: "/api/chat",
        messageFormat: { toApi, fromApi: (d) => d as Message[] },
      });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hi" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.messages[0]).toHaveProperty("custom");
      expect(toApi).toHaveBeenCalled();
    });

    it("uses ephemeral threadId when no thread selected and no createThread", async () => {
      const sseBody = `data: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(sseBody));
          c.close();
        },
      });
      fetchSpy.mockResolvedValue(new Response(stream));

      const store = createChatStore({ apiUrl: "/api/chat" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.threadId).toBe("ephemeral");
    });
  });

  // ────────────────────────────────────────────
  // threadApiUrl (default fetch-based thread ops)
  // ────────────────────────────────────────────

  describe("threadApiUrl", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
    });

    it("loadThreads fetches from threadApiUrl/get", async () => {
      const threads = [makeThread("t1"), makeThread("t2", 1)];
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({ threads })));

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });
      store.getState().loadThreads();
      await flushPromises();

      expect(fetchSpy).toHaveBeenCalledWith("/api/threads/get");
      expect(store.getState().threads).toHaveLength(2);
    });

    it("loadMoreThreads passes cursor as query param", async () => {
      fetchSpy
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ threads: [makeThread("t1")], nextCursor: "abc" })),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ threads: [makeThread("t2", 1)] })));

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });
      store.getState().loadThreads();
      await flushPromises();

      store.getState().loadMoreThreads();
      await flushPromises();

      expect(fetchSpy).toHaveBeenCalledWith("/api/threads/get?cursor=abc");
      expect(store.getState().threads).toHaveLength(2);
    });

    it("createThread POSTs to threadApiUrl/create", async () => {
      const thread = makeThread("t-new");
      fetchSpy.mockResolvedValue(new Response(JSON.stringify(thread)));

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });

      const result = await store.getState().createThread({
        id: "m1",
        role: "user",
        content: "hello",
      } as UserMessage);

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/threads/create");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toHaveProperty("messages");
      expect(result.id).toBe("t-new");
    });

    it("deleteThread DELETEs threadApiUrl/delete/:id", async () => {
      fetchSpy.mockResolvedValue(new Response(""));

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().deleteThread("t1");
      await flushPromises();

      expect(fetchSpy).toHaveBeenCalledWith("/api/threads/delete/t1", { method: "DELETE" });
      expect(store.getState().threads).toHaveLength(0);
    });

    it("updateThread PATCHes threadApiUrl/update/:id", async () => {
      const updated = { ...makeThread("t1"), title: "Renamed" };
      fetchSpy.mockResolvedValue(new Response(JSON.stringify(updated)));

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });
      store.setState({ threads: [makeThread("t1")] });

      store.getState().updateThread(updated);
      await flushPromises();

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/threads/update/t1");
      expect(opts.method).toBe("PATCH");
      expect(store.getState().threads[0]!.title).toBe("Renamed");
    });

    it("selectThread GETs threadApiUrl/get/:id and applies messageFormat.fromApi", async () => {
      const rawMessages = [{ custom: "data" }];
      const parsed: Message[] = [makeMessage("m1")];
      const fromApi = vi.fn().mockReturnValue(parsed);

      fetchSpy.mockResolvedValue(new Response(JSON.stringify(rawMessages)));

      const store = createChatStore({
        threadApiUrl: "/api/threads",
        apiUrl: "/api/chat",
        messageFormat: { toApi: (m) => m, fromApi },
      });

      store.getState().selectThread("t1");
      await flushPromises();

      expect(fetchSpy).toHaveBeenCalledWith("/api/threads/get/t1");
      expect(fromApi).toHaveBeenCalledWith(rawMessages);
      expect(store.getState().messages).toEqual(parsed);
    });

    it("processMessage auto-creates thread via threadApiUrl when none selected", async () => {
      const thread = makeThread("t-auto");
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(thread))).mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              c.close();
            },
          }),
        ),
      );

      const store = createChatStore({ threadApiUrl: "/api/threads", apiUrl: "/api/chat" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(fetchSpy.mock.calls[0][0]).toBe("/api/threads/create");
      expect(store.getState().selectedThreadId).toBe("t-auto");
    });
  });

  // ────────────────────────────────────────────
  // messageFormat round-tripping
  // ────────────────────────────────────────────

  describe("messageFormat", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
    });

    const doneStream = () =>
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          c.close();
        },
      });

    const customFormat = {
      toApi: (msgs: Message[]) => msgs.map((m) => ({ r: m.role, c: (m as any).content })),
      fromApi: (data: unknown) =>
        (data as Array<{ r: string; c: string }>).map((d, i) => ({
          id: `parsed-${i}`,
          role: d.r,
          content: d.c,
        })) as Message[],
    };

    it("toApi is applied when sending messages via apiUrl", async () => {
      fetchSpy.mockResolvedValue(new Response(doneStream()));

      const toApi = vi.fn((msgs: Message[]) =>
        msgs.map((m) => ({ custom_role: m.role, custom_content: (m as any).content })),
      );

      const store = createChatStore({
        apiUrl: "/api/chat",
        messageFormat: { toApi, fromApi: (d) => d as Message[] },
      });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "hello" });

      expect(toApi).toHaveBeenCalled();
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.messages[0]).toEqual({ custom_role: "user", custom_content: "hello" });
      expect(body.messages[0]).not.toHaveProperty("id");
    });

    it("fromApi is applied when loading thread via threadApiUrl", async () => {
      const serverPayload = [
        { r: "user", c: "hi" },
        { r: "assistant", c: "hello" },
      ];
      fetchSpy.mockResolvedValue(new Response(JSON.stringify(serverPayload)));

      const fromApi = vi.fn(customFormat.fromApi);

      const store = createChatStore({
        apiUrl: "/api/chat",
        threadApiUrl: "/api/threads",
        messageFormat: { toApi: (m) => m, fromApi },
      });

      store.getState().selectThread("t1");
      await flushPromises();

      expect(fromApi).toHaveBeenCalledWith(serverPayload);
      expect(store.getState().messages).toHaveLength(2);
      expect(store.getState().messages[0].role).toBe("user");
      expect((store.getState().messages[0] as any).content).toBe("hi");
      expect(store.getState().messages[1].role).toBe("assistant");
      expect((store.getState().messages[1] as any).content).toBe("hello");
    });

    it("toApi is applied when creating thread via threadApiUrl", async () => {
      const thread = makeThread("t-new");
      fetchSpy.mockResolvedValue(new Response(JSON.stringify(thread)));

      const toApi = vi.fn((msgs: Message[]) =>
        msgs.map((m) => ({ r: m.role, c: (m as any).content })),
      );

      const store = createChatStore({
        apiUrl: "/api/chat",
        threadApiUrl: "/api/threads",
        messageFormat: { toApi, fromApi: (d) => d as Message[] },
      });

      await store.getState().createThread({
        id: "m1",
        role: "user",
        content: "hello",
      } as UserMessage);

      expect(toApi).toHaveBeenCalled();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/threads/create");
      const body = JSON.parse(opts.body);
      expect(body.messages).toEqual([{ r: "user", c: "hello" }]);
    });

    it("round-trip: toApi then fromApi preserves data", async () => {
      const thread = makeThread("t-rt");

      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(thread)))
        .mockResolvedValueOnce(new Response(doneStream()))
        .mockResolvedValueOnce(new Response(JSON.stringify([{ r: "user", c: "round-trip" }])));

      const store = createChatStore({
        apiUrl: "/api/chat",
        threadApiUrl: "/api/threads",
        messageFormat: customFormat,
      });

      await store.getState().processMessage({ role: "user", content: "round-trip" });

      const createBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(createBody.messages[0]).toEqual({ r: "user", c: "round-trip" });

      const sendBody = JSON.parse(fetchSpy.mock.calls[1][1].body);
      expect(sendBody.messages[0]).toEqual({ r: "user", c: "round-trip" });

      store.getState().selectThread("t-rt");
      await flushPromises();

      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].role).toBe("user");
      expect((store.getState().messages[0] as any).content).toBe("round-trip");
    });

    it("default identityMessageFormat passes through unchanged", async () => {
      fetchSpy.mockResolvedValue(new Response(doneStream()));

      const store = createChatStore({ apiUrl: "/api/chat" });
      store.setState({ selectedThreadId: "t1" });

      await store.getState().processMessage({ role: "user", content: "raw" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.messages[0]).toHaveProperty("id");
      expect(body.messages[0].role).toBe("user");
      expect(body.messages[0].content).toBe("raw");
    });
  });

  // ────────────────────────────────────────────
  // Thread switch during stream
  // ────────────────────────────────────────────

  describe("selectThread while streaming", () => {
    it("cancels current stream and loads new thread", async () => {
      let capturedAbort: AbortController;
      const processMessage = vi.fn().mockImplementation(
        ({ abortController }: { abortController: AbortController }) => {
          capturedAbort = abortController;
          return new Promise(() => {}); // never resolves
        },
      );
      const newMessages = [makeMessage("new-m1")];
      const loadThread = vi.fn().mockResolvedValue(newMessages);

      const store = createChatStore({
        processMessage,
        loadThread,
        streamProtocol: { parse: async function* () {} },
      });
      store.setState({ selectedThreadId: "t1" });

      // Start streaming
      store.getState().processMessage({ role: "user", content: "hello" });
      await flushPromises();
      expect(store.getState().isRunning).toBe(true);

      // Switch thread mid-stream
      store.getState().selectThread("t2");

      expect(capturedAbort!.signal.aborted).toBe(true);
      expect(store.getState().selectedThreadId).toBe("t2");
      expect(store.getState().isLoadingMessages).toBe(true);

      await flushPromises();

      expect(store.getState().messages).toEqual(newMessages);
      expect(store.getState().isLoadingMessages).toBe(false);
    });
  });
});
