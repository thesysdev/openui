import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventType } from "../../../types";
import { agUIAdapter } from "../ag-ui";
import { openAIAdapter } from "../openai-completions";
import { openAIReadableStreamAdapter } from "../openai-readable-stream";
import { openAIResponsesAdapter } from "../openai-responses";
import {
  collect,
  completionChunk,
  consume,
  installAnimationFrame,
  makeResponse,
  ndjson,
  sse,
  sseNoSpace,
  types,
} from "./streamTestHelpers";

beforeAll(installAnimationFrame);

const toolDelta = (args = '{"city":"Tokyo"}') => ({
  tool_calls: [
    {
      index: 0,
      id: "call_1",
      type: "function",
      function: { name: "get_weather", arguments: args },
    },
  ],
});

// ── OpenAI Chat Completions (openAIAdapter + openAIReadableStreamAdapter) ──

describe("Chat Completions adapters", () => {
  it("accepts `data:` without the optional space", async () => {
    const body =
      sseNoSpace(completionChunk({ role: "assistant", content: "hi" })) +
      sseNoSpace(completionChunk({}, "stop")) +
      "data:[DONE]\n\n";
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it.each([
    ["length", "The response was cut off because it reached the maximum output length."],
    ["content_filter", "The response was stopped by the provider's content filter."],
  ])("finish_reason %s ends the message and raises RUN_ERROR", async (reason, message) => {
    const body =
      sse(completionChunk({ role: "assistant", content: "trunc" })) +
      sse(completionChunk({}, reason)) +
      "data: [DONE]\n\n";
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_ERROR,
    ]);
    expect(events[3]).toEqual({ type: EventType.RUN_ERROR, message, code: reason });
  });

  it("does not end a tool call whose arguments were cut off by the token limit", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk(toolDelta('{"city":'))) +
      sse(completionChunk({}, "length"));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_ERROR,
    ]);
  });

  it("keeps the truncated text and shows the error in the consumer", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: "trunc" })) +
      sse(completionChunk({}, "length"));
    const { messages, error } = await consume(openAIAdapter(), makeResponse(body));
    expect(error?.message).toMatch(/maximum output length/);
    expect(messages.map((m) => (m as { content?: string }).content)).toEqual(["trunc"]);
  });

  it("renders a refusal as text", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk({ refusal: "I can't help with that." })) +
      sse(completionChunk({}, "stop"));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(events).toEqual([
      expect.objectContaining({ type: EventType.TEXT_MESSAGE_START }),
      expect.objectContaining({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: "I can't help with that.",
      }),
      expect.objectContaining({ type: EventType.TEXT_MESSAGE_END }),
    ]);
  });

  it("closes tool calls on finish_reason stop (Gemini / OpenAI-compatible proxies)", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk(toolDelta())) +
      sse(completionChunk({}, "stop"));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it("closes tool calls once when finish_reason is tool_calls, and balances the message", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk(toolDelta())) +
      sse(completionChunk({}, "tool_calls")) +
      "data: [DONE]\n\n";
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it.each([
    ["SSE", openAIAdapter, sse],
    ["NDJSON", openAIReadableStreamAdapter, ndjson],
  ])("keeps one named tool call when %s chunks repeat its id", async (_, adapter, frame) => {
    const body = [
      completionChunk(toolDelta('{"city":')),
      completionChunk({
        tool_calls: [
          {
            index: 0,
            id: "call_1",
            function: { arguments: '"Tokyo"}' },
          },
        ],
      }),
      completionChunk({}, "tool_calls"),
    ]
      .map(frame)
      .join("");
    const events = await collect(adapter().parse(makeResponse(body)));
    expect(events.filter((e) => e.type === EventType.TOOL_CALL_START)).toEqual([
      { type: EventType.TOOL_CALL_START, toolCallId: "call_1", toolCallName: "get_weather" },
    ]);
    expect(events.filter((e) => e.type === EventType.TOOL_CALL_END)).toHaveLength(1);
    const { messages, error } = await consume(adapter(), makeResponse(body));
    expect(error).toBeUndefined();
    expect(messages).toEqual([
      expect.objectContaining({
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"Tokyo"}' },
          },
        ],
      }),
    ]);
  });

  it("keeps parallel calls distinct when argument chunks repeat both ids", async () => {
    const body = [
      completionChunk({
        tool_calls: [
          { index: 0, id: "call_1", function: { name: "weather", arguments: '{"city":' } },
          { index: 1, id: "call_2", function: { name: "time", arguments: '{"zone":' } },
        ],
      }),
      completionChunk({
        tool_calls: [
          { index: 0, id: "call_1", function: { arguments: '"Tokyo"}' } },
          { index: 1, id: "call_2", function: { arguments: '"Asia/Tokyo"}' } },
        ],
      }),
      completionChunk({}, "tool_calls"),
    ]
      .map(sse)
      .join("");
    const { messages, error } = await consume(openAIAdapter(), makeResponse(body));
    expect(error).toBeUndefined();
    expect(messages).toEqual([
      expect.objectContaining({
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "weather", arguments: '{"city":"Tokyo"}' },
          },
          {
            id: "call_2",
            type: "function",
            function: { name: "time", arguments: '{"zone":"Asia/Tokyo"}' },
          },
        ],
      }),
    ]);
  });

  it("does not invent an ending for a stream that stops without a finish_reason", async () => {
    // It may have been cut off; closing the calls would make it look complete.
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk(toolDelta()));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
    ]);
  });

  it.each([
    ["false", false],
    ["an empty string", ""],
    ["0", 0],
    ["an empty object", {}],
    ["an object with only code 0", { code: 0 }],
  ])("keeps a chunk whose `error` field is %s", async (_, error) => {
    const body =
      sse({ ...completionChunk({ role: "assistant", content: "hi" }), error }) +
      sse(completionChunk({}, "stop"));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it("opens a new message for text after a finished step, so START/END stay paired", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) +
      sse(completionChunk(toolDelta())) +
      sse(completionChunk({}, "tool_calls")) +
      sse(completionChunk({ content: "after" })) +
      sse(completionChunk({}, "stop"));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    const text = events.filter((e) => e.type.startsWith("TEXT_MESSAGE"));
    expect(text.map((e) => e.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_END,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
    const ids = text.map((e) => (e as { messageId: string }).messageId);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
    expect(new Set(ids.slice(2)).size).toBe(1);
  });

  it.each([
    ["a null record", null],
    [
      "a non-array tool_calls",
      { choices: [{ index: 0, delta: { tool_calls: 5 }, finish_reason: null }] },
    ],
    [
      "a null tool call",
      { choices: [{ index: 0, delta: { tool_calls: [null] }, finish_reason: null }] },
    ],
  ])("skips %s and keeps the answer that follows (both framings)", async (_, record) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const after = [
      completionChunk({ role: "assistant", content: "after" }),
      completionChunk({}, "stop"),
    ];
    const sseEvents = await collect(
      openAIAdapter().parse(makeResponse(sse(record) + after.map(sse).join(""))),
    );
    const ndjsonEvents = await collect(
      openAIReadableStreamAdapter().parse(
        makeResponse(ndjson(record) + after.map(ndjson).join(""), "application/x-ndjson"),
      ),
    );
    for (const events of [sseEvents, ndjsonEvents]) {
      expect(events).toContainEqual(
        expect.objectContaining({ type: EventType.TEXT_MESSAGE_CONTENT, delta: "after" }),
      );
      expect(types(events)).not.toContain(EventType.RUN_ERROR);
    }
    error.mockRestore();
  });

  it("ignores a non-streamed chat.completion body instead of reading it as truncated", async () => {
    const completion = {
      id: "chatcmpl-1",
      object: "chat.completion",
      choices: [
        { index: 0, message: { role: "assistant", content: "full" }, finish_reason: "length" },
      ],
    };
    const events = await collect(
      openAIAdapter().parse(makeResponse(JSON.stringify(completion), "application/json")),
    );
    expect(events).toEqual([]);
  });

  it("applies the same mapping to the NDJSON adapter", async () => {
    const body =
      ndjson(completionChunk({ role: "assistant", refusal: "No." })) +
      ndjson(completionChunk({}, "length"));
    const events = await collect(
      openAIReadableStreamAdapter().parse(makeResponse(body, "application/x-ndjson")),
    );
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_ERROR,
    ]);
  });
});

// ── OpenAI Responses ──

const responsesEvent = (type: string, fields: Record<string, unknown>) => ({
  sequence_number: 0,
  type,
  ...fields,
});

describe("openAIResponsesAdapter", () => {
  it("accepts `data:` without the optional space", async () => {
    const body =
      sseNoSpace(responsesEvent("response.output_text.delta", { item_id: "m1", delta: "hi" })) +
      sseNoSpace(responsesEvent("response.output_text.done", { item_id: "m1", text: "hi" }));
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it("renders a refusal as text", async () => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          output_index: 0,
          item: {
            id: "msg_1",
            type: "message",
            role: "assistant",
            status: "in_progress",
            content: [],
          },
        }),
      ) +
      sse(responsesEvent("response.refusal.delta", { item_id: "msg_1", delta: "I can't help." })) +
      sse(responsesEvent("response.refusal.done", { item_id: "msg_1", refusal: "I can't help." }));
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(events).toEqual([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg_1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "msg_1", delta: "I can't help." },
      { type: EventType.TEXT_MESSAGE_END, messageId: "msg_1" },
    ]);
  });

  it.each([
    ["max_output_tokens", /maximum output length/],
    ["content_filter", /content filter/],
  ])("response.incomplete (%s) raises RUN_ERROR", async (reason, message) => {
    const body =
      sse(responsesEvent("response.output_text.delta", { item_id: "m1", delta: "partial" })) +
      sse(responsesEvent("response.output_text.done", { item_id: "m1", text: "partial" })) +
      sse(
        responsesEvent("response.incomplete", {
          response: { id: "r", status: "incomplete", incomplete_details: { reason } },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    const last = events.at(-1) as { type: string; message: string; code: string };
    expect(last.type).toBe(EventType.RUN_ERROR);
    expect(last.message).toMatch(message);
    expect(last.code).toBe(reason);
  });

  it("stops at the first RUN_ERROR", async () => {
    const body =
      sse(responsesEvent("error", { message: "Rate limit", code: "rate_limit_exceeded" })) +
      sse(responsesEvent("response.output_text.delta", { item_id: "m1", delta: "late" }));
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([EventType.RUN_ERROR]);
  });

  it("shows a file_search call as a tool card with its queries and results", async () => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          output_index: 0,
          item: { id: "fs_1", type: "file_search_call", status: "in_progress", queries: [] },
        }),
      ) +
      sse(
        responsesEvent("response.output_item.done", {
          output_index: 0,
          item: {
            id: "fs_1",
            type: "file_search_call",
            status: "completed",
            queries: ["tokyo weather"],
            results: [{ file_id: "f1", text: "sunny" }],
          },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(events).toEqual([
      { type: EventType.TOOL_CALL_START, toolCallId: "fs_1", toolCallName: "file_search" },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "fs_1",
        delta: '{"queries":["tokyo weather"]}',
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "fs_1",
        toolCallId: "fs_1",
        content: '[{"file_id":"f1","text":"sunny"}]',
      },
    ]);
  });

  it("keeps one call id for a hosted tool when only one of its events carries an id", async () => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          output_index: 2,
          item: { type: "code_interpreter_call", status: "in_progress" },
        }),
      ) +
      sse(
        responsesEvent("response.output_item.done", {
          output_index: 2,
          item: {
            id: "ci_9",
            type: "code_interpreter_call",
            status: "completed",
            code: "1+1",
            outputs: [],
          },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(events.map((e) => [e.type, (e as { toolCallId: string }).toolCallId])).toEqual([
      [EventType.TOOL_CALL_START, "code_interpreter_call_2"],
      [EventType.TOOL_CALL_ARGS, "code_interpreter_call_2"],
      [EventType.TOOL_CALL_RESULT, "code_interpreter_call_2"],
    ]);
  });

  it("keeps interleaved hosted tools with ids apart, even without output_index", async () => {
    const added = (id: string) =>
      sse(
        responsesEvent("response.output_item.added", {
          item: { id, type: "file_search_call", status: "in_progress" },
        }),
      );
    const done = (id: string) =>
      sse(
        responsesEvent("response.output_item.done", {
          item: { id, type: "file_search_call", status: "completed", queries: [id], results: [] },
        }),
      );
    const events = await collect(
      openAIResponsesAdapter().parse(
        makeResponse(added("fs_a") + added("fs_b") + done("fs_a") + done("fs_b")),
      ),
    );
    const results = events
      .filter((e) => e.type === EventType.TOOL_CALL_RESULT)
      .map((e) => (e as { toolCallId: string }).toolCallId);
    expect(results).toEqual(["fs_a", "fs_b"]);
    expect(types(events).filter((t) => t === EventType.TOOL_CALL_START)).toHaveLength(2);
  });

  it("starts a hosted tool from its done item when no added event arrived, without id collisions", async () => {
    const done = (outputIndex: number) =>
      sse(
        responsesEvent("response.output_item.done", {
          output_index: outputIndex,
          item: { type: "file_search_call", status: "completed", queries: ["q"], results: [] },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(done(0) + done(1))));
    const starts = events
      .filter((e) => e.type === EventType.TOOL_CALL_START)
      .map((e) => (e as { toolCallId: string }).toolCallId);
    expect(starts).toEqual(["file_search_call_0", "file_search_call_1"]);
    expect(types(events).filter((t) => t === EventType.TOOL_CALL_RESULT)).toHaveLength(2);
  });

  it("flags a failed hosted tool and never copies a generated image into the tool message", async () => {
    const failed = await collect(
      openAIResponsesAdapter().parse(
        makeResponse(
          sse(
            responsesEvent("response.output_item.added", {
              output_index: 0,
              item: { id: "ci_1", type: "code_interpreter_call", status: "in_progress" },
            }),
          ) +
            sse(
              responsesEvent("response.output_item.done", {
                output_index: 0,
                item: {
                  id: "ci_1",
                  type: "code_interpreter_call",
                  status: "failed",
                  code: "1/0",
                  outputs: null,
                },
              }),
            ),
        ),
      ),
    );
    expect(failed.at(-1)).toMatchObject({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId: "ci_1",
      isError: true,
      error: "code_interpreter failed",
    });

    const image = await collect(
      openAIResponsesAdapter().parse(
        makeResponse(
          sse(
            responsesEvent("response.output_item.done", {
              output_index: 0,
              item: {
                id: "ig_1",
                type: "image_generation_call",
                status: "completed",
                result: "iVBORw0KGgo…",
              },
            }),
          ),
        ),
      ),
    );
    expect(image.at(-1)).toMatchObject({ content: '{"status":"completed","image":"generated"}' });
  });

  it.each([
    ["failed", true],
    ["completed", false],
  ])("flags a web_search_call whose status is %s only when it failed", async (status, failed) => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          output_index: 0,
          item: { id: "ws_1", type: "web_search_call", status: "in_progress" },
        }),
      ) +
      sse(
        responsesEvent("response.output_item.done", {
          output_index: 0,
          item: {
            id: "ws_1",
            type: "web_search_call",
            status,
            action: { type: "search", query: "tokyo" },
          },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    const result = events.find((e) => e.type === EventType.TOOL_CALL_RESULT);
    if (failed) expect(result).toMatchObject({ isError: true, error: "web_search failed" });
    else expect(result).not.toHaveProperty("isError");
  });

  it("surfaces a plain JSON error body (no SSE framing) as RUN_ERROR", async () => {
    const events = await collect(
      openAIResponsesAdapter().parse(
        makeResponse(
          '{"error":{"message":"upstream exploded","type":"server_error"}}',
          "application/json",
        ),
      ),
    );
    expect(events).toEqual([{ type: EventType.RUN_ERROR, message: "upstream exploded" }]);
  });
});

// ── AG-UI ──

describe("agUIAdapter", () => {
  it("accepts `data:` without the optional space", async () => {
    const body =
      sseNoSpace({ type: EventType.TEXT_MESSAGE_START, messageId: "m", role: "assistant" }) +
      sseNoSpace({ type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m", delta: "hi" });
    const events = await collect(agUIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([EventType.TEXT_MESSAGE_START, EventType.TEXT_MESSAGE_CONTENT]);
  });

  it.each([
    ["one line", '{"error":{"message":"upstream exploded","type":"server_error"}}'],
    ["pretty-printed", '{\n  "error": {\n    "message": "upstream exploded"\n  }\n}\n'],
  ])("surfaces a %s JSON error body under HTTP 200 as RUN_ERROR", async (_, body) => {
    const events = await collect(agUIAdapter().parse(makeResponse(body, "application/json")));
    expect(events).toEqual([{ type: EventType.RUN_ERROR, message: "upstream exploded" }]);
  });

  it("ignores a JSON error body over 64 KB, however it is laid out", async () => {
    const message = "x".repeat(70 * 1024);
    for (const body of [
      JSON.stringify({ error: { message } }),
      JSON.stringify({ error: { message } }, null, 2),
    ]) {
      expect(await collect(agUIAdapter().parse(makeResponse(body, "application/json")))).toEqual(
        [],
      );
    }
  });

  it("still ignores a non-JSON body", async () => {
    const events = await collect(
      agUIAdapter().parse(makeResponse("<html><body>Bad gateway</body></html>", "text/html")),
    );
    expect(events).toEqual([]);
  });

  it("ignores plain lines once the stream is SSE", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const body =
      sse({ type: EventType.TEXT_MESSAGE_START, messageId: "m", role: "assistant" }) +
      '{"error":{"message":"not part of the stream"}}\n';
    const events = await collect(agUIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([EventType.TEXT_MESSAGE_START]);
    error.mockRestore();
  });

  it("stops at the first RUN_ERROR", async () => {
    const body =
      sse({ type: EventType.RUN_ERROR, message: "boom" }) +
      sse({ type: EventType.TEXT_MESSAGE_START, messageId: "m", role: "assistant" });
    const events = await collect(agUIAdapter().parse(makeResponse(body)));
    expect(types(events)).toEqual([EventType.RUN_ERROR]);
  });
});
