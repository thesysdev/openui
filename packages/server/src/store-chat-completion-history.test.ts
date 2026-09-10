import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-chat-completion-history";

describe("chatCompletionMessagesToItems", () => {
  it("maps user and assistant text into Conversations message items", () => {
    expect(
      chatCompletionMessagesToItems([
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi there" },
      ]),
    ).toEqual([
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "hello" }],
      },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "hi there" }],
      },
    ]);
  });

  it("skips system and developer messages", () => {
    expect(
      chatCompletionMessagesToItems([
        { role: "system", content: "you are a bot" },
        { role: "developer", content: "internal" },
        { role: "user", content: "ping" },
      ]),
    ).toEqual([
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "ping" }],
      },
    ]);
  });

  it("flattens assistant tool_calls into sibling function_call items", () => {
    const messages: ChatCompletionMessageParam[] = [
      { role: "user", content: "weather?" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"nyc"}' },
          },
        ],
      },
      { role: "tool", tool_call_id: "call_1", content: '{"temp":72}' },
      { role: "assistant", content: "72 and sunny" },
    ];

    expect(chatCompletionMessagesToItems(messages)).toEqual([
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "weather?" }],
      },
      {
        type: "function_call",
        call_id: "call_1",
        name: "get_weather",
        arguments: '{"city":"nyc"}',
      },
      {
        type: "function_call_output",
        call_id: "call_1",
        output: '{"temp":72}',
      },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "72 and sunny" }],
      },
    ]);
  });

  it("maps image_url parts to input_image", () => {
    expect(
      chatCompletionMessagesToItems([
        {
          role: "user",
          content: [
            { type: "text", text: "what is this?" },
            { type: "image_url", image_url: { url: "https://cdn.example/a.png" } },
          ],
        },
      ]),
    ).toEqual([
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "what is this?" },
          {
            type: "input_image",
            image_url: "https://cdn.example/a.png",
            detail: "auto",
          },
        ],
      },
    ]);
  });

  it("skips empty user messages", () => {
    expect(chatCompletionMessagesToItems([{ role: "user", content: "" }])).toEqual([]);
  });
});

describe("storeChatCompletionHistory", () => {
  it("POSTs converted items to the Conversations API", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ object: "list", data: [{ id: "item_1" }] }),
    });

    const result = await storeChatCompletionHistory({
      apiKey: "sk-test",
      conversationId: "conv 1",
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ],
      fetch,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [
      string,
      { method?: string; headers?: Record<string, string>; body?: string },
    ];
    expect(url).toBe("https://api.thesys.dev/v1/conversations/conv%201/items");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer sk-test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      items: [
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "hello" }],
        },
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "hi" }],
        },
      ],
    });
    expect(result).toEqual({ object: "list", data: [{ id: "item_1" }] });
  });

  it("does not fetch when there is nothing to store", async () => {
    const fetch = vi.fn();
    const result = await storeChatCompletionHistory({
      apiKey: "sk-test",
      conversationId: "conv_1",
      messages: [{ role: "system", content: "skip me" }],
      fetch,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      object: "list",
      data: [],
      first_id: "",
      last_id: "",
      has_more: false,
    });
  });

  it("throws with the response body when the API rejects the write", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "conversation not found",
    });

    await expect(
      storeChatCompletionHistory({
        apiKey: "sk-test",
        conversationId: "missing",
        messages: [{ role: "user", content: "hello" }],
        fetch,
      }),
    ).rejects.toThrow("store chat completion history failed: 404 conversation not found");
  });

  it("honors apiBaseUrl and strips a trailing slash", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ object: "list", data: [] }),
    });

    await storeChatCompletionHistory({
      apiKey: "sk-test",
      conversationId: "conv_1",
      messages: [{ role: "user", content: "hello" }],
      apiBaseUrl: "http://localhost:3000/",
      fetch,
    });

    expect(fetch.mock.calls[0]?.[0]).toBe("http://localhost:3000/v1/conversations/conv_1/items");
  });
});
