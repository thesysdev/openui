import { describe, expect, it } from "vitest";
import { caught, fakeFetch, json, type SentRequest } from "../__tests__/fake-fetch";
import { OpenUIClient } from "../client";
import { OpenUIApiError } from "../core/errors";

/** A fake Conversations API. Item lists come back in pages of `pageSize`. */
function fakeCloud(stored: Record<string, unknown>[] = [], pageSize = 100) {
  const { fetch, requests } = fakeFetch(({ method, url, body }) => {
    if (url.pathname === "/v1/conversations/conv_missing") {
      return json({ error: { message: "Conversation not found" } }, 404);
    }
    if (url.pathname === "/v1/conversations") {
      return method === "POST"
        ? json({ id: "conv_1", created_at: 1_700_000_000, ...(body as object) })
        : json({ object: "list", data: [], has_more: false });
    }
    if (url.pathname.endsWith("/items") && method === "POST") {
      const data = (body as { items: object[] }).items.map((item, i) => ({
        id: `item_${i}`,
        object: "conversation.item",
        conversation_id: "conv_1",
        ...item,
      }));
      return json({ object: "list", data, has_more: false });
    }
    if (url.pathname.endsWith("/items")) {
      const after = url.searchParams.get("after");
      const start = after ? stored.findIndex((item) => item["id"] === after) + 1 : 0;
      const data = stored.slice(start, start + pageSize);
      return json({
        object: "list",
        data,
        has_more: start + data.length < stored.length,
        last_id: data.at(-1)?.["id"],
      });
    }
    return json({
      id: url.pathname.split("/")[3],
      object: url.pathname.includes("/items/") ? "conversation.item" : "conversation",
      type: "message",
      role: "user",
      content: "hi",
      user_id: "maya",
      app_id: "north",
      created_at: 1_700_000_000,
    });
  });
  const openui = new OpenUIClient({
    apiKey: "sk-test",
    baseUrl: "http://cloud.test",
    appId: "north",
    fetch,
  });
  return { openui, requests };
}

/** A request as method, path, query and body, for compact checks. */
const sent = ({ method, url, body }: SentRequest) => ({
  method,
  path: url.pathname,
  query: Object.fromEntries(url.searchParams),
  body,
});

describe("openui.conversations", () => {
  it("create names the owner and the client's app in the body", async () => {
    const { openui, requests } = fakeCloud();
    const conversation = await openui.conversations.create({ title: "Q3" }, { userId: "maya" });

    expect(requests.map(sent)).toEqual([
      {
        method: "POST",
        path: "/v1/conversations",
        query: {},
        body: { title: "Q3", user_id: "maya", app_id: "north" },
      },
    ]);
    expect(conversation).toEqual({
      id: "conv_1",
      title: "Q3",
      userId: "maya",
      appId: "north",
      createdAt: 1_700_000_000_000,
    });
  });

  it("create needs a userId, and fails before any request without one", async () => {
    const { openui, requests } = fakeCloud();
    // @ts-expect-error a conversation needs its owner
    await expect(openui.conversations.create({}, {})).rejects.toMatchObject({
      code: "invalid_input",
    });
    await expect(openui.conversations.create({}, { userId: " " })).rejects.toMatchObject({
      code: "invalid_input",
    });
    expect(requests).toEqual([]);
  });

  it("list filters on ?user_id alone", async () => {
    const { openui, requests } = fakeCloud();
    await openui.conversations.list({ userId: "maya", limit: 5 });
    await openui.conversations.list();

    expect(requests.map((request) => sent(request).query)).toEqual([
      { user_id: "maya", limit: "5" },
      {},
    ]);
  });

  it("calls by id name no user: they act as your org", async () => {
    const { openui, requests } = fakeCloud();
    const conversation = await openui.conversations.get("conv_1");
    await openui.conversations.update("conv_1", { title: "Renamed" });
    await openui.conversations.delete("conv_1");
    await openui.conversations.items.list("conv_1", { order: "asc" });
    await openui.conversations.items.get("conv_1", "item_1");
    await openui.conversations.items.update("conv_1", "item_1", { status: "completed" });

    expect(requests.map(sent).map(({ method, path, query }) => [method, path, query])).toEqual([
      ["GET", "/v1/conversations/conv_1", {}],
      ["POST", "/v1/conversations/conv_1", {}],
      ["DELETE", "/v1/conversations/conv_1", {}],
      ["GET", "/v1/conversations/conv_1/items", { order: "asc" }],
      ["GET", "/v1/conversations/conv_1/items/item_1", {}],
      ["POST", "/v1/conversations/conv_1/items/item_1", {}],
    ]);
    // Its owner, for the app's own check.
    expect(conversation.userId).toBe("maya");
  });

  it("a missing conversation throws OpenUIApiError with the status", async () => {
    const { openui } = fakeCloud();
    const error = await caught(() => openui.conversations.get("conv_missing"));
    expect(error).toBeInstanceOf(OpenUIApiError);
    expect(error).toMatchObject({ status: 404, message: "Conversation not found" });
  });

  it("items.create makes no request with nothing to add", async () => {
    const { openui, requests } = fakeCloud();
    expect(await openui.conversations.items.create("conv_1", [])).toEqual([]);
    expect(requests).toEqual([]);
  });
});

describe("openui.chat.conversations and openui.langgraph.conversations", () => {
  const thread = [
    { type: "message", role: "user", content: [{ type: "input_text", text: "Revenue?" }] },
    { type: "message", role: "assistant", content: [{ type: "output_text", text: "Checking." }] },
    { type: "function_call", call_id: "c1", name: "query", arguments: '{"by":"region"}' },
    { type: "function_call_output", call_id: "c1", output: '{"EMEA":12}' },
    { type: "message", role: "assistant", content: [{ type: "output_text", text: "EMEA leads." }] },
  ].map((item, i) => ({ id: `item_${i}`, object: "conversation.item", ...item }));

  it("share openui.conversations' conversation calls", () => {
    const { openui } = fakeCloud();
    for (const { conversations } of [openui.chat, openui.langgraph]) {
      for (const call of ["list", "create", "get", "update", "delete"] as const) {
        expect(conversations[call]).toBe(openui.conversations[call]);
      }
    }
  });

  it("items.list reads every page, oldest first, as one thread", async () => {
    // Pages of 2, so the reply's text and its tool call land on different pages.
    const { openui, requests } = fakeCloud(thread, 2);
    const messages = await openui.chat.conversations.items.list("conv_1");

    expect(requests.map((request) => sent(request).query)).toEqual([
      { order: "asc", limit: "100" },
      { order: "asc", limit: "100", after: "item_1" },
      { order: "asc", limit: "100", after: "item_3" },
    ]);
    expect(messages).toEqual([
      { role: "user", content: "Revenue?" },
      {
        role: "assistant",
        content: "Checking.",
        tool_calls: [
          { id: "c1", type: "function", function: { name: "query", arguments: '{"by":"region"}' } },
        ],
      },
      { role: "tool", tool_call_id: "c1", content: '{"EMEA":12}' },
      { role: "assistant", content: "EMEA leads." },
    ]);
  });

  it("items.create converts the turn and sends only the items", async () => {
    const { openui, requests } = fakeCloud();
    const stored = await openui.chat.conversations.items.create("conv_1", [
      { role: "system", content: "rules" },
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);

    expect(requests).toHaveLength(1);
    expect(sent(requests[0]!)).toMatchObject({ method: "POST", query: {} });
    expect(requests[0]?.body).toEqual({
      items: [
        { type: "message", role: "user", content: [{ type: "input_text", text: "hi" }] },
        { type: "message", role: "assistant", content: [{ type: "output_text", text: "hello" }] },
      ],
    });
    expect(stored.map((item) => item.id)).toEqual(["item_0", "item_1"]);
  });

  it("items.create needs an array of messages", async () => {
    const { openui } = fakeCloud();
    // @ts-expect-error messages, not one message
    await expect(openui.chat.conversations.items.create("conv_1", "hi")).rejects.toMatchObject({
      code: "invalid_input",
    });
  });
});
