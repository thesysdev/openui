import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  EventType,
  type AGUIEvent,
  type Message,
  type StreamProtocolAdapter,
} from "../../../types";
import { processStreamedMessage } from "../../processStreamedMessage";
import { agUIAdapter } from "../ag-ui";
import { eveAdapter } from "../eve";
import { langGraphAdapter } from "../langgraph";
import { openAIAdapter } from "../openai-completions";
import { openAIReadableStreamAdapter } from "../openai-readable-stream";
import { openAIResponsesAdapter } from "../openai-responses";
import { vercelAIAdapter } from "../vercel-ai-sdk";

beforeAll(() => {
  const g = globalThis as unknown as {
    requestAnimationFrame?: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
  };
  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number;
    g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

// ── Helpers ──

function makeResponse(chunks: string | string[], contentType = "text/event-stream"): Response {
  const list = typeof chunks === "string" ? [chunks] : chunks;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of list) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": contentType } });
}

async function collect(iterable: AsyncIterable<AGUIEvent>): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

const types = (events: AGUIEvent[]) => events.map((e) => e.type);
const sse = (record: unknown) => `data: ${JSON.stringify(record)}\n\n`;
const sseNoSpace = (record: unknown) => `data:${JSON.stringify(record)}\n\n`;
const ndjson = (record: unknown) => `${JSON.stringify(record)}\n`;

/** Runs a response through an adapter and the real consumer, as AgentInterface does. */
async function consume(adapter: StreamProtocolAdapter, response: Response) {
  const messages: Message[] = [];
  const upsert = (m: Message) => {
    const i = messages.findIndex((x) => x.id === m.id);
    if (i >= 0) messages[i] = m;
    else messages.push(m);
  };
  let error: Error | undefined;
  try {
    await processStreamedMessage({
      response,
      adapter,
      createMessage: upsert,
      updateMessage: upsert,
    });
  } catch (e) {
    error = e as Error;
  }
  await new Promise((r) => setTimeout(r, 10));
  return { messages, error };
}

const completionChunk = (delta: Record<string, unknown>, finish: string | null = null) => ({
  id: "chatcmpl-1",
  object: "chat.completion.chunk",
  created: 1,
  model: "m",
  choices: [{ index: 0, delta, finish_reason: finish }],
});

const toolDelta = {
  tool_calls: [
    {
      index: 0,
      id: "call_1",
      type: "function",
      function: { name: "get_weather", arguments: '{"city":"Tokyo"}' },
    },
  ],
};

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
      sse(completionChunk(toolDelta)) +
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
      sse(completionChunk(toolDelta)) +
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

  it("closes open tool calls when the stream ends without a finish_reason", async () => {
    const body =
      sse(completionChunk({ role: "assistant", content: null })) + sse(completionChunk(toolDelta));
    const events = await collect(openAIAdapter().parse(makeResponse(body)));
    expect(types(events).slice(-2)).toEqual([EventType.TOOL_CALL_END, EventType.TEXT_MESSAGE_END]);
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

  it("shows a file_search call as a tool card with its queries and results", async () => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          item: { id: "fs_1", type: "file_search_call", status: "in_progress", queries: [] },
        }),
      ) +
      sse(
        responsesEvent("response.output_item.done", {
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

  it("flags a failed hosted tool and never copies a generated image into the tool message", async () => {
    const failed = await collect(
      openAIResponsesAdapter().parse(
        makeResponse(
          sse(
            responsesEvent("response.output_item.added", {
              item: { id: "ci_1", type: "code_interpreter_call", status: "in_progress" },
            }),
          ) +
            sse(
              responsesEvent("response.output_item.done", {
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
    expect(image.at(-1)).toMatchObject({
      content: '{"status":"completed","image":"generated"}',
    });
  });

  it("streams a custom tool call's input like function arguments", async () => {
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          item: {
            id: "ct_1",
            type: "custom_tool_call",
            call_id: "call_9",
            name: "run_sql",
            input: "",
          },
        }),
      ) +
      sse(
        responsesEvent("response.custom_tool_call_input.delta", {
          item_id: "ct_1",
          delta: "SELECT 1",
        }),
      ) +
      sse(
        responsesEvent("response.custom_tool_call_input.done", {
          item_id: "ct_1",
          input: "SELECT 1",
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(events).toEqual([
      { type: EventType.TOOL_CALL_START, toolCallId: "call_9", toolCallName: "run_sql" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call_9", delta: "SELECT 1" },
      { type: EventType.TOOL_CALL_END, toolCallId: "call_9" },
    ]);
  });

  it("shows a computer_call action and leaves the result to the client", async () => {
    const action = { type: "click", x: 10, y: 20, button: "left" };
    const body =
      sse(
        responsesEvent("response.output_item.added", {
          item: { id: "cu_1", type: "computer_call", call_id: "call_c", status: "in_progress" },
        }),
      ) +
      sse(
        responsesEvent("response.output_item.done", {
          item: {
            id: "cu_1",
            type: "computer_call",
            call_id: "call_c",
            status: "completed",
            action,
          },
        }),
      );
    const events = await collect(openAIResponsesAdapter().parse(makeResponse(body)));
    expect(events).toEqual([
      { type: EventType.TOOL_CALL_START, toolCallId: "call_c", toolCallName: "computer" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call_c", delta: JSON.stringify(action) },
      { type: EventType.TOOL_CALL_END, toolCallId: "call_c" },
    ]);
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
});

// ── Vercel AI SDK ──

describe("vercelAIAdapter", () => {
  const text =
    sse({ type: "text-start", id: "t1" }) + sse({ type: "text-delta", id: "t1", delta: "partial" });

  it.each([
    ["length", /maximum output length/],
    ["content-filter", /content filter/],
  ])("finishReason %s raises RUN_ERROR after the text", async (finishReason, message) => {
    const body =
      text +
      sse({ type: "text-end", id: "t1" }) +
      sse({ type: "finish", finishReason }) +
      "data: [DONE]\n\n";
    const events = await collect(vercelAIAdapter().parse(makeResponse(body)));
    const last = events.at(-1) as { type: string; message: string; code: string };
    expect(types(events)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_ERROR,
    ]);
    expect(last.message).toMatch(message);
    expect(last.code).toBe(finishReason);
  });

  it("a normal finish is not an error", async () => {
    const body =
      text + sse({ type: "text-end", id: "t1" }) + sse({ type: "finish", finishReason: "stop" });
    const events = await collect(vercelAIAdapter().parse(makeResponse(body)));
    expect(types(events)).not.toContain(EventType.RUN_ERROR);
  });

  it("an abort chunk raises RUN_ERROR with the reason", async () => {
    const body =
      sse({ type: "start-step" }) +
      text +
      sse({ type: "abort", reason: "cancelled" }) +
      "data: [DONE]\n\n";
    const events = await collect(vercelAIAdapter().parse(makeResponse(body)));
    expect(types(events).slice(-2)).toEqual([EventType.TEXT_MESSAGE_END, EventType.RUN_ERROR]);
    expect(events.at(-1)).toEqual({
      type: EventType.RUN_ERROR,
      message: "The response was aborted (cancelled).",
      code: "abort",
    });
  });

  it("surfaces a JSON error body under HTTP 200 as RUN_ERROR", async () => {
    const events = await collect(
      vercelAIAdapter().parse(
        makeResponse(
          '{"error":{"message":"upstream exploded"}}',
          "application/json; charset=utf-8",
        ),
      ),
    );
    expect(events).toEqual([{ type: EventType.RUN_ERROR, message: "upstream exploded" }]);
  });
});

// ── LangGraph ──

describe("langGraphAdapter", () => {
  const block = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const ai = (content: string, extra: Record<string, unknown> = {}) => [
    { type: "AIMessageChunk", id: "run-1", content, ...extra },
    { langgraph_step: 1, langgraph_node: "agent" },
  ];
  const lfBody =
    block("metadata", { run_id: "r" }) +
    block("messages", ai("Hello ")) +
    block("messages", ai("there"));

  it("parses CRLF-terminated streams the same as LF", async () => {
    const lf = await collect(langGraphAdapter().parse(makeResponse(lfBody)));
    const crlf = await collect(
      langGraphAdapter().parse(makeResponse(lfBody.replace(/\n/g, "\r\n"))),
    );
    expect(types(lf)).toContain(EventType.TEXT_MESSAGE_CONTENT);
    expect(crlf.map((e) => ({ ...e, messageId: undefined }))).toEqual(
      lf.map((e) => ({ ...e, messageId: undefined })),
    );
  });

  it("handles a CRLF split across two network reads", async () => {
    const crlf = lfBody.replace(/\n/g, "\r\n");
    const cut = crlf.indexOf("\r\n\r\n") + 1; // first read ends on the "\r"
    const events = await collect(
      langGraphAdapter().parse(makeResponse([crlf.slice(0, cut), crlf.slice(cut)])),
    );
    const deltas = events
      .filter((e) => e.type === EventType.TEXT_MESSAGE_CONTENT)
      .map((e) => (e as { delta: string }).delta);
    expect(deltas).toEqual(["Hello ", "there"]);
  });

  it("announces tool_calls that arrive with an empty tool_call_chunks array", async () => {
    const body = block(
      "messages",
      ai("", {
        tool_calls: [{ id: "call_1", name: "get_weather", args: { city: "Tokyo" } }],
        tool_call_chunks: [],
      }),
    );
    const events = await collect(langGraphAdapter().parse(makeResponse(body)));
    expect(events).toEqual(
      expect.arrayContaining([
        { type: EventType.TOOL_CALL_START, toolCallId: "call_1", toolCallName: "get_weather" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call_1", delta: '{"city":"Tokyo"}' },
        { type: EventType.TOOL_CALL_END, toolCallId: "call_1" },
      ]),
    );
  });
});

// ── Eve ──

describe("eveAdapter", () => {
  const base = { sequence: 1, stepIndex: 0, turnId: "turn-1" };
  const requested = ndjson({
    type: "actions.requested",
    data: {
      ...base,
      actions: [
        { kind: "tool-call", callId: "call_1", toolName: "get_weather", input: { city: "Tokyo" } },
      ],
    },
  });
  const result = (status: string, extra: Record<string, unknown>) =>
    ndjson({
      type: "action.result",
      data: {
        ...base,
        status,
        result: { kind: "tool-result", callId: "call_1", output: null },
        ...extra,
      },
    });

  it("flags a failed action.result as a tool error", async () => {
    const body =
      requested + result("failed", { error: { code: "TOOL_ERROR", message: "upstream 500" } });
    const events = await collect(eveAdapter().parse(makeResponse(body, "application/x-ndjson")));
    expect(events.find((e) => e.type === EventType.TOOL_CALL_RESULT)).toMatchObject({
      toolCallId: "call_1",
      content: '{"error":"upstream 500"}',
      isError: true,
      error: "upstream 500",
    });
  });

  it("shows the failure on the tool message in the consumer", async () => {
    const body =
      requested + result("failed", { error: { code: "TOOL_ERROR", message: "upstream 500" } });
    const { messages } = await consume(eveAdapter(), makeResponse(body, "application/x-ndjson"));
    expect(messages.find((m) => m.role === "tool")).toMatchObject({ error: "upstream 500" });
  });

  it("leaves a completed result unflagged", async () => {
    const ok = ndjson({
      type: "action.result",
      data: {
        ...base,
        status: "completed",
        result: { kind: "tool-result", callId: "call_1", output: "sunny" },
      },
    });
    const events = await collect(
      eveAdapter().parse(makeResponse(requested + ok, "application/x-ndjson")),
    );
    const toolResult = events.find((e) => e.type === EventType.TOOL_CALL_RESULT);
    expect(toolResult).toMatchObject({ content: "sunny" });
    expect(toolResult).not.toHaveProperty("isError");
  });
});
