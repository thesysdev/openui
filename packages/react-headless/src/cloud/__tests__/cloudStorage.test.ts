import { describe, expect, it, vi } from "vitest";
import type { UserMessage } from "../../types/message";
import { cloudArtifactStorage } from "../artifactStorage";
import { cloudItemsToMessages } from "../items";
import { cloudThreadStorage, deriveTitle } from "../threadStorage";
import type { CloudArtifact, CloudConversationItem } from "../wire";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const baseUrl = "https://cloud.example.com/";
const conversation = { id: "c 1", object: "conversation", created_at: 1700000000, title: "Hello" };
const artifact: CloudArtifact = {
  id: "a/1",
  object: "openui.artifact",
  conversation_id: "c1",
  kind: "report",
  name: "Q2",
  content: "root = ReportView()",
  created_at: 100,
  updated_at: 200,
};

function item(id: string, fields: Partial<CloudConversationItem>): CloudConversationItem {
  return { id, object: "conversation.item", created_at: 1, type: "message", ...fields };
}

describe("cloud conversations", () => {
  it("lists threads with an encoded cursor and maps timestamps and missing titles", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json({
        data: [conversation, { ...conversation, id: "c2", title: undefined }],
        has_more: true,
        last_id: "c2",
      }),
    );
    const storage = cloudThreadStorage({ baseUrl, fetch, pageLimit: 20 });
    expect(await storage.listThreads("c&0")).toEqual({
      threads: [
        { id: "c 1", title: "Hello", createdAt: 1700000000000 },
        { id: "c2", title: "New conversation", createdAt: 1700000000000 },
      ],
      nextCursor: "c2",
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      "https://cloud.example.com/v1/conversations?limit=20&after=c%260",
    );
  });

  it("creates and renames threads with only the title and encodes IDs for rename/delete", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json(conversation))
      .mockResolvedValueOnce(json({ ...conversation, title: "Renamed" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const storage = cloudThreadStorage({ baseUrl, fetch });
    const thread = await storage.createThread({ id: "m1", role: "user", content: " Hello " });
    expect(fetch.mock.calls[0]).toEqual([
      "https://cloud.example.com/v1/conversations",
      {
        method: "POST",
        body: JSON.stringify({ title: "Hello" }),
        headers: { "Content-Type": "application/json" },
      },
    ]);
    expect(await storage.updateThread({ ...thread, title: "Renamed" })).toEqual({
      ...thread,
      title: "Renamed",
    });
    expect(fetch.mock.calls[1]).toEqual([
      "https://cloud.example.com/v1/conversations/c%201",
      {
        method: "POST",
        body: JSON.stringify({ title: "Renamed" }),
        headers: { "Content-Type": "application/json" },
      },
    ]);
    await storage.deleteThread(thread.id);
    expect(fetch.mock.calls[2]).toEqual([
      "https://cloud.example.com/v1/conversations/c%201",
      { method: "DELETE", headers: {} },
    ]);
  });

  it.each([
    ["  Hello  ", "Hello"],
    ["", "New conversation"],
    ["x".repeat(80), "x".repeat(60)],
    [
      [
        { type: "binary", mimeType: "image/png", url: "https://example.com/image.png" },
        { type: "text", text: "  " },
        { type: "text", text: " From parts " },
      ],
      "From parts",
    ],
  ] satisfies [UserMessage["content"], string][])("derives a title from %j", (content, title) => {
    expect(deriveTitle({ id: "m1", role: "user", content })).toBe(title);
  });

  it("loads all pages in order and groups tool calls/results spanning page boundaries", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        json({
          data: [
            item("u1", { role: "user", content: "hi" }),
            item("a1", { role: "assistant", content: [{ type: "output_text", text: "Working" }] }),
            item("f1", {
              type: "function_call",
              call_id: "call1",
              name: "search",
              arguments: "{}",
            }),
          ],
          has_more: true,
          last_id: "f1",
        }),
      )
      .mockResolvedValueOnce(
        json({
          data: [
            item("o1", { type: "function_call_output", call_id: "call1", output: { found: true } }),
            item("f2", {
              type: "function_call",
              call_id: "call2",
              name: "report",
              arguments: "{}",
            }),
            item("o2", { type: "function_call_output", call_id: "call2", output: "done" }),
          ],
          has_more: false,
          last_id: "o2",
        }),
      );
    const messages = await cloudThreadStorage({ baseUrl, fetch }).getMessages("c/1");
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://cloud.example.com/v1/conversations/c%2F1/items?order=asc&limit=100",
      "https://cloud.example.com/v1/conversations/c%2F1/items?order=asc&limit=100&after=f1",
    ]);
    expect(messages).toEqual([
      { id: "u1", role: "user", content: "hi" },
      {
        id: "a1",
        role: "assistant",
        content: "Working",
        toolCalls: [
          { id: "call1", type: "function", function: { name: "search", arguments: "{}" } },
          { id: "call2", type: "function", function: { name: "report", arguments: "{}" } },
        ],
      },
      { id: "o1", role: "tool", toolCallId: "call1", content: '{"found":true}' },
      { id: "o2", role: "tool", toolCallId: "call2", content: "done" },
    ]);
  });

  it("stops pagination when the server omits its cursor", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: [], has_more: true }));
    expect(await cloudThreadStorage({ baseUrl, fetch }).getMessages("c1")).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces API failures with the operation and status", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({}, 500));
    await expect(cloudThreadStorage({ baseUrl, fetch }).deleteThread("c1")).rejects.toThrow(
      "OpenUI Cloud: DELETE /v1/conversations/c1 failed: 500",
    );
  });
});

describe("cloud artifacts", () => {
  it("maps summaries and forwards search, types, pagination, and page size", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json({
        data: [artifact],
        has_more: true,
        last_id: "a/1",
      }),
    );
    const result = await cloudArtifactStorage({ baseUrl, fetch }).list({
      name: "Q2 & Q3",
      type: ["slides", "report"],
      cursor: "a0",
      limit: 25,
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      "https://cloud.example.com/v1/artifacts?name=Q2+%26+Q3&kind=slides&kind=report&after=a0&limit=25",
    );
    expect(result).toEqual({
      artifacts: [{ id: "a/1", title: "Q2", type: "report", threadId: "c1", updatedAt: 200000 }],
      nextCursor: "a/1",
    });
    expect(result.artifacts[0]).not.toHaveProperty("content");
  });

  it("uses default list options and omits a cursor on the final page", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json({
        data: [],
        has_more: false,
        last_id: "a1",
      }),
    );
    expect(await cloudArtifactStorage({ baseUrl, fetch }).list()).toEqual({
      artifacts: [],
      nextCursor: undefined,
    });
    expect(fetch.mock.calls[0]![0]).toBe("https://cloud.example.com/v1/artifacts?limit=100");
  });

  it("reads content and falls back to the artifact ID and creation time", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json({
        ...artifact,
        name: undefined,
        updated_at: undefined,
      }),
    );
    expect(await cloudArtifactStorage({ baseUrl, fetch }).get("a/1")).toEqual({
      id: "a/1",
      title: "a/1",
      type: "report",
      threadId: "c1",
      updatedAt: 100000,
      content: artifact.content,
    });
    expect(fetch.mock.calls[0]![0]).toBe("https://cloud.example.com/v1/artifacts/a%2F1");
  });

  it.each([artifact.content, { root: "ReportView" }])(
    "updates %j as a string without a version",
    async (content) => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json(artifact));
      const result = await cloudArtifactStorage({ baseUrl, fetch }).update({ id: "a/1", content });
      expect(fetch.mock.calls[0]).toEqual([
        "https://cloud.example.com/v1/artifacts/a%2F1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: typeof content === "string" ? content : JSON.stringify(content),
          }),
        },
      ]);
      expect(result).not.toHaveProperty("content");
    },
  );
});

describe("cloud item conversion", () => {
  it("skips unsupported and malformed tool rows while retaining valid messages", () => {
    expect(
      cloudItemsToMessages([
        item("unknown", { type: "reasoning" }),
        item("bad-call", { type: "function_call" }),
        item("bad-output", { type: "function_call_output", call_id: "call" }),
        item("u1", { role: "user", content: "hi" }),
        item("a1", { role: "assistant", content: "hello" }),
      ]),
    ).toEqual([
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "assistant", content: "hello" },
    ]);
  });

  it("preserves multipart user input", () => {
    expect(
      cloudItemsToMessages([
        item("u1", {
          role: "user",
          content: [
            { type: "input_text", text: "Describe this" },
            { type: "input_image", image_url: "https://example.com/image.png" },
          ],
        }),
      ]),
    ).toEqual([
      {
        id: "u1",
        role: "user",
        content: [
          { type: "text", text: "Describe this" },
          { type: "binary", url: "https://example.com/image.png", mimeType: "image/*" },
        ],
      },
    ]);
  });
});
