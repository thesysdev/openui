import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Thread, UserMessage } from "../../store/types";
import type { MessageFormat } from "../../types/messageFormat";
import { restStorage } from "../restStorage";

const json = (body: unknown, ok = true, status = 200) =>
  new Response(JSON.stringify(body), { status, statusText: ok ? "OK" : "Error" });

describe("restStorage", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
  });

  const make = (overrides?: { messageFormat?: MessageFormat; headers?: Record<string, string> }) =>
    restStorage({
      baseUrl: "/api/threads",
      fetch: fetchSpy as unknown as typeof fetch,
      ...overrides,
    }).thread;

  it("listThreads GETs {base}/get and returns the payload", async () => {
    const payload = { threads: [{ id: "t1", title: "A", createdAt: 0 }], nextCursor: "c2" };
    fetchSpy.mockResolvedValue(json(payload));

    const result = await make().listThreads();

    expect(fetchSpy).toHaveBeenCalledWith("/api/threads/get", expect.objectContaining({}));
    expect(result).toEqual(payload);
  });

  it("listThreads passes cursor as query param", async () => {
    fetchSpy.mockResolvedValue(json({ threads: [] }));
    await make().listThreads("abc");
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/threads/get?cursor=abc");
  });

  it("createThread POSTs {base}/create with messageFormat.toApi applied", async () => {
    const thread: Thread = { id: "t-new", title: "New", createdAt: 0 };
    fetchSpy.mockResolvedValue(json(thread));
    const toApi = vi.fn((msgs) => msgs.map((m: any) => ({ custom: m.id })));
    const messageFormat: MessageFormat = { toApi, fromApi: (d) => d as any };

    const result = await make({ messageFormat }).createThread({
      id: "m1",
      role: "user",
      content: "hi",
    } as UserMessage);

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/threads/create");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(toApi).toHaveBeenCalled();
    expect(JSON.parse(opts.body)).toEqual({ messages: [{ custom: "m1" }] });
    expect(result).toEqual(thread);
  });

  it("getMessages GETs {base}/get/:id and applies messageFormat.fromApi", async () => {
    const raw = [{ r: "user", c: "hi" }];
    const parsed = [{ id: "m1", role: "user", content: "hi" }];
    fetchSpy.mockResolvedValue(json(raw));
    const fromApi = vi.fn().mockReturnValue(parsed);

    const result = await make({ messageFormat: { toApi: (m) => m, fromApi } }).getMessages("t1");

    expect(fetchSpy.mock.calls[0][0]).toBe("/api/threads/get/t1");
    expect(fromApi).toHaveBeenCalledWith(raw);
    expect(result).toEqual(parsed);
  });

  it("updateThread PATCHes {base}/update/:id with the thread body", async () => {
    const updated: Thread = { id: "t1", title: "Renamed", createdAt: 0 };
    fetchSpy.mockResolvedValue(json(updated));

    const result = await make().updateThread(updated);

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/threads/update/t1");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body)).toEqual(updated);
    expect(result).toEqual(updated);
  });

  it("updateMessage PATCHes {base}/messages/:threadId/:messageId with the full toApi result", async () => {
    fetchSpy.mockResolvedValue(json({}, true));
    const toApi = vi.fn((msgs) => msgs.flatMap((m: any) => [{ custom: m.id }, { extra: true }]));
    const messageFormat: MessageFormat = { toApi, fromApi: (d) => d as any };
    const message = { id: "m1", role: "assistant" as const, content: "hi" };

    await make({ messageFormat }).updateMessage("t1", message);

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/threads/messages/t1/m1");
    expect(opts.method).toBe("PATCH");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(toApi).toHaveBeenCalledWith([message]);
    expect(JSON.parse(opts.body)).toEqual({
      messages: [{ custom: "m1" }, { extra: true }],
    });
  });

  it("deleteThread DELETEs {base}/delete/:id", async () => {
    fetchSpy.mockResolvedValue(json({}, true));
    await make().deleteThread("t1");
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/threads/delete/t1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("merges custom headers into requests", async () => {
    fetchSpy.mockResolvedValue(json({ threads: [] }));
    await make({ headers: { Authorization: "Bearer x" } }).listThreads();
    expect(fetchSpy.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer x" });
  });

  it("throws a descriptive error when res.ok is false", async () => {
    fetchSpy.mockResolvedValue(json({ error: "nope" }, false, 500));
    await expect(make().listThreads()).rejects.toThrow(/GET \/api\/threads\/get failed: 500/);
  });
});
