import { describe, expect, it, vi } from "vitest";
import { EventType } from "../../../types";
import { EVE_INPUT_REQUESTED_EVENT, eveAdapter } from "../eve";

// ── Helpers ──

/**
 * Create a Response with an NDJSON body from a list of Eve events.
 */
function makeNdjsonResponse(events: unknown[]): Response {
  const body = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream);
}

/**
 * Collect all events from an async iterable.
 */
async function collect(iter: AsyncIterable<unknown>): Promise<unknown[]> {
  const events: unknown[] = [];
  for await (const event of iter) {
    events.push(event);
  }
  return events;
}

const waiting = { type: "session.waiting", data: { wait: "next-user-message" } };

// ── Tests ──

describe("eveAdapter", () => {
  it("throws when response has no body", async () => {
    const adapter = eveAdapter();
    const response = new Response(null);

    await expect(async () => {
      for await (const _ of adapter.parse(response)) {
        /* drain */
      }
    }).rejects.toThrow("No response body");
  });

  describe("text streaming", () => {
    it("emits TEXT_MESSAGE_START, CONTENT, and END for message deltas", async () => {
      const response = makeNdjsonResponse([
        {
          type: "message.appended",
          data: { messageDelta: "Hello", messageSoFar: "Hello", stepIndex: 0, turnId: "turn_0" },
        },
        {
          type: "message.appended",
          data: {
            messageDelta: " world",
            messageSoFar: "Hello world",
            stepIndex: 0,
            turnId: "turn_0",
          },
        },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        delta?: string;
      }>;

      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
      ]);
      expect(events[1].delta).toBe("Hello");
      expect(events[2].delta).toBe(" world");
    });

    it("falls back to message.completed for steps that streamed no deltas", async () => {
      const response = makeNdjsonResponse([
        {
          type: "message.completed",
          data: { message: "Full answer", stepIndex: 0, turnId: "turn_0" },
        },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        delta?: string;
      }>;

      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
      ]);
      expect(events[1].delta).toBe("Full answer");
    });

    it("skips message.completed for steps that already streamed", async () => {
      const response = makeNdjsonResponse([
        {
          type: "message.appended",
          data: { messageDelta: "Streamed", stepIndex: 0, turnId: "turn_0" },
        },
        {
          type: "message.completed",
          data: { message: "Streamed", stepIndex: 0, turnId: "turn_0" },
        },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{ type: EventType }>;

      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
      ]);
    });
  });

  describe("tool calls", () => {
    it("emits the full tool lifecycle including TOOL_CALL_RESULT", async () => {
      const response = makeNdjsonResponse([
        {
          type: "actions.requested",
          data: {
            actions: [
              {
                callId: "call_1",
                input: { location: "Berlin" },
                kind: "tool-call",
                toolName: "get_weather",
              },
            ],
            stepIndex: 0,
            turnId: "turn_0",
          },
        },
        {
          type: "action.result",
          data: {
            result: {
              callId: "call_1",
              kind: "tool-result",
              output: '{"temperature_c":21}',
              toolName: "get_weather",
            },
            status: "completed",
            stepIndex: 0,
            turnId: "turn_0",
          },
        },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        toolCallId?: string;
        toolCallName?: string;
        delta?: string;
        content?: string;
      }>;

      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TOOL_CALL_START,
        EventType.TOOL_CALL_ARGS,
        EventType.TOOL_CALL_END,
        EventType.TOOL_CALL_RESULT,
        EventType.TEXT_MESSAGE_END,
      ]);
      expect(events[1].toolCallName).toBe("get_weather");
      expect(events[2].delta).toBe('{"location":"Berlin"}');
      expect(events[4].toolCallId).toBe("call_1");
      expect(events[4].content).toBe('{"temperature_c":21}');
    });

    it("serializes failed tool results as an error payload", async () => {
      const response = makeNdjsonResponse([
        {
          type: "action.result",
          data: {
            result: { callId: "call_1", kind: "tool-result", output: null, toolName: "t" },
            status: "failed",
            error: { code: "boom", message: "lookup failed" },
            stepIndex: 0,
            turnId: "turn_0",
          },
        },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        content?: string;
      }>;

      expect(events[0].type).toBe(EventType.TOOL_CALL_RESULT);
      expect(JSON.parse(events[0].content ?? "")).toEqual({ error: "lookup failed" });
    });
  });

  describe("input requests", () => {
    it("surfaces input.requested as a CUSTOM event", async () => {
      const requests = [
        {
          requestId: "call_1",
          prompt: "Which city?",
          options: [{ id: "berlin", label: "Berlin" }],
          allowFreeform: true,
          action: { callId: "call_1", kind: "tool-call", toolName: "ask_question", input: {} },
        },
      ];
      const response = makeNdjsonResponse([
        { type: "input.requested", data: { requests, stepIndex: 0, turnId: "turn_0" } },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        name?: string;
        value?: unknown;
      }>;

      expect(events[0].type).toBe(EventType.CUSTOM);
      expect(events[0].name).toBe(EVE_INPUT_REQUESTED_EVENT);
      expect(events[0].value).toEqual(requests);
    });
  });

  describe("boundaries and errors", () => {
    it("stops at the first turn boundary and ignores later events", async () => {
      const response = makeNdjsonResponse([
        { type: "message.appended", data: { messageDelta: "turn 0", stepIndex: 0 } },
        { type: "session.completed" },
        { type: "message.appended", data: { messageDelta: "turn 1 leak", stepIndex: 0 } },
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        delta?: string;
      }>;

      expect(events.map((e) => e.type)).toEqual([
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
      ]);
      expect(events[1].delta).toBe("turn 0");
    });

    it("emits RUN_ERROR for session.failed and stops", async () => {
      const response = makeNdjsonResponse([
        { type: "session.failed", data: { code: "x", message: "model unavailable" } },
        { type: "message.appended", data: { messageDelta: "leak", stepIndex: 0 } },
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
        message?: string;
      }>;

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EventType.RUN_ERROR);
      expect(events[0].message).toBe("model unavailable");
    });

    it("emits RUN_ERROR for turn.failed but keeps reading", async () => {
      const response = makeNdjsonResponse([
        { type: "turn.failed", data: { message: "step exploded" } },
        waiting,
      ]);

      const events = (await collect(eveAdapter().parse(response))) as Array<{
        type: EventType;
      }>;

      expect(events.map((e) => e.type)).toEqual([EventType.RUN_ERROR]);
    });
  });

  describe("onEvent", () => {
    it("receives every raw event, including untranslated types", async () => {
      const onEvent = vi.fn();
      const response = makeNdjsonResponse([
        { type: "session.started", data: {} },
        { type: "message.appended", data: { messageDelta: "hi", stepIndex: 0 } },
        waiting,
      ]);

      await collect(eveAdapter({ onEvent }).parse(response));

      expect(onEvent.mock.calls.map(([e]) => e.type)).toEqual([
        "session.started",
        "message.appended",
        "session.waiting",
      ]);
    });
  });
});
