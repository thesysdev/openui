import { describe, expect, it } from "vitest";
import { stored } from "../__tests__/conversation-items";
import { caught, fakeFetch, json } from "../__tests__/fake-fetch";
import { OpenUIClient } from "../client";
import { OpenUIApiError } from "../core/errors";

const row = { id: "conv_1", user_id: "maya", app_id: "north", created_at: 1_700_000_000 };

/** A client on a fake OpenUI Cloud. Item lists come back from `items`, in pages of `pageSize`. */
function setup(items: object[] = [], pageSize = 100) {
  const thread = stored(items);
  const { fetch, requests } = fakeFetch(({ method, url, body }) => {
    if (url.pathname === "/v1/conversations/conv_missing") {
      return json({ error: { message: "Conversation not found" } }, 404);
    }
    if (url.pathname === "/v1/conversations" && method === "POST") {
      return json({ ...row, ...(body as object) });
    }
    if (url.pathname.endsWith("/items") && method === "POST") {
      return json({ data: stored((body as { items: object[] }).items), has_more: false });
    }
    if (url.pathname.endsWith("/items")) {
      const after = url.searchParams.get("after");
      const start = after ? thread.findIndex((item) => item.id === after) + 1 : 0;
      const data = thread.slice(start, start + pageSize);
      return json({
        data,
        has_more: start + data.length < thread.length,
        last_id: data.at(-1)?.id,
      });
    }
    if (url.pathname === "/v1/conversations") return json({ data: [row], has_more: false });
    return json({ ...row, type: "message", role: "user", content: "hi" });
  });
  const openui = new OpenUIClient({
    apiKey: "k",
    baseUrl: "https://cloud.test",
    appId: "north",
    fetch,
  });
  return { openui, requests };
}

describe("openui.conversations", () => {
  it("create names the owner and the client's app in the body", async () => {
    const { openui, requests } = setup();
    expect(await openui.conversations.create({ title: "Q3" }, { userId: "maya" })).toEqual({
      id: "conv_1",
      title: "Q3",
      userId: "maya",
      appId: "north",
      createdAt: 1_700_000_000_000,
    });
    expect(requests[0]!.method).toBe("POST");
    expect(requests[0]!.url.pathname).toBe("/v1/conversations");
    expect(requests[0]!.url.search).toBe("");
    expect(requests[0]!.body).toEqual({ title: "Q3", user_id: "maya", app_id: "north" });
  });

  it.each([{}, { userId: " " }])("create with %j fails before any request", async (options) => {
    const { openui, requests } = setup();
    // @ts-expect-error a conversation needs its owner
    expect(await caught(() => openui.conversations.create({}, options))).toMatchObject({
      code: "invalid_input",
    });
    expect(requests).toEqual([]);
  });

  it("list filters on ?user_id alone", async () => {
    const { openui, requests } = setup();
    await openui.conversations.list({ userId: "maya", limit: 5 });
    await openui.conversations.list();
    expect([...requests[0]!.url.searchParams]).toEqual([
      ["user_id", "maya"],
      ["limit", "5"],
    ]);
    expect(requests[1]!.url.search).toBe("");
  });

  it("calls by id name no user: they act as your org", async () => {
    const { openui, requests } = setup();
    const conversation = await openui.conversations.get("conv_1");
    await openui.conversations.update("conv_1", { title: "Renamed" });
    await openui.conversations.delete("conv_1");
    await openui.conversations.items.get("conv_1", "item_1");
    await openui.conversations.items.update("conv_1", "item_1", { status: "completed" });

    expect(requests.map(({ method, url }) => [method, url.pathname, url.search])).toEqual([
      ["GET", "/v1/conversations/conv_1", ""],
      ["POST", "/v1/conversations/conv_1", ""],
      ["DELETE", "/v1/conversations/conv_1", ""],
      ["GET", "/v1/conversations/conv_1/items/item_1", ""],
      ["POST", "/v1/conversations/conv_1/items/item_1", ""],
    ]);
    // Its owner, for the app's own check.
    expect(conversation.userId).toBe("maya");
  });

  it("a missing conversation throws OpenUIApiError with the status", async () => {
    const { openui } = setup();
    const error = await caught(() => openui.conversations.get("conv_missing"));
    expect(error).toBeInstanceOf(OpenUIApiError);
    expect(error).toMatchObject({ status: 404, message: "Conversation not found" });
  });

  it("items.create makes no request with nothing to add", async () => {
    const { openui, requests } = setup();
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
  ];

  it("share openui.conversations' conversation calls", () => {
    const { openui } = setup();
    for (const { conversations } of [openui.chat, openui.langgraph]) {
      for (const call of ["list", "create", "get", "update", "delete"] as const) {
        expect(conversations[call]).toBe(openui.conversations[call]);
      }
    }
  });

  it("items.list reads every page, oldest first, as one thread", async () => {
    // Pages of 2, so the reply's text and its tool call land on different pages.
    const { openui, requests } = setup(thread, 2);
    const messages = await openui.chat.conversations.items.list("conv_1");

    expect(requests.map(({ url }) => [...url.searchParams])).toEqual([
      [
        ["limit", "100"],
        ["order", "asc"],
      ],
      [
        ["limit", "100"],
        ["after", "item_1"],
        ["order", "asc"],
      ],
      [
        ["limit", "100"],
        ["after", "item_3"],
        ["order", "asc"],
      ],
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

  it("chat items.create sends the turn as items and returns it as stored, as messages", async () => {
    const { openui, requests } = setup();
    const stored = await openui.chat.conversations.items.create("conv_1", [
      { role: "system", content: "rules" },
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url.search).toBe("");
    expect(requests[0]!.body).toEqual({
      items: [
        { type: "message", role: "user", content: [{ type: "input_text", text: "hi" }] },
        { type: "message", role: "assistant", content: [{ type: "output_text", text: "hello" }] },
      ],
    });
    // The system message isn't stored, so it isn't returned.
    expect(stored).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
  });

  it("langgraph items.create takes the plain messages items.list returns, and returns them", async () => {
    const { openui, requests } = setup();
    const turn = [
      { role: "human" as const, content: "Book a table" },
      {
        role: "ai" as const,
        content: "",
        tool_calls: [{ type: "tool_call" as const, id: "t1", name: "book", args: { people: 2 } }],
      },
      { role: "tool" as const, content: "booked", tool_call_id: "t1" },
    ];
    expect(await openui.langgraph.conversations.items.create("conv_1", turn)).toEqual(turn);
    expect(requests[0]!.body).toEqual({
      items: [
        { type: "message", role: "user", content: [{ type: "input_text", text: "Book a table" }] },
        { type: "function_call", call_id: "t1", name: "book", arguments: '{"people":2}' },
        { type: "function_call_output", call_id: "t1", output: "booked" },
      ],
    });
  });

  it("items.create needs an array of messages", async () => {
    const { openui } = setup();
    expect(
      // @ts-expect-error messages, not one message
      await caught(() => openui.chat.conversations.items.create("conv_1", "hi")),
    ).toMatchObject({ code: "invalid_input" });
  });
});
