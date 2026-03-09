import { describe, expect, it, vi } from "vitest";
import { AGUIEvent, EventType } from "../../../types";
import { vercelAIAdapter } from "../vercel-ai";

function sseLines(...events: (Record<string, unknown> | string)[]): string {
  return (
    events
      .map((e) => (typeof e === "string" ? `data: ${e}` : `data: ${JSON.stringify(e)}`))
      .join("\n\n") + "\n\n"
  );
}

function makeResponse(body: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return new Response(stream);
}

function makeChunkedResponse(...chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

async function collectEvents(response: Response) {
  const adapter = vercelAIAdapter();
  const events: AGUIEvent[] = [];
  for await (const event of adapter.parse(response)) {
    events.push(event);
  }
  return events;
}

describe("vercelAIAdapter", () => {
  describe("text message flow", () => {
    it("maps start → text-delta → finish to AG-UI events", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "msg-1" },
          { type: "text-delta", id: "text-1", delta: "Hello" },
          { type: "text-delta", id: "text-1", delta: " world" },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "msg-1", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "msg-1", delta: "Hello" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "msg-1", delta: " world" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1" },
      ]);
    });

    it("generates a UUID when messageId is missing from start event", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start" },
          { type: "text-delta", id: "t1", delta: "Hi" },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(3);
      expect((events[0] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_START);
      const msgId = (events[0] as { messageId: string }).messageId;
      expect(msgId).toBeTruthy();
      expect(msgId).not.toBe("");
      expect((events[1] as { messageId: string }).messageId).toBe(msgId);
      expect((events[2] as { messageId: string }).messageId).toBe(msgId);
    });
  });

  describe("tool call flow", () => {
    it("maps tool-input-start → delta → available to AG-UI events", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "msg-2" },
          { type: "tool-input-start", toolCallId: "call-1", toolName: "get_weather" },
          { type: "tool-input-delta", toolCallId: "call-1", inputTextDelta: '{"city":' },
          { type: "tool-input-delta", toolCallId: "call-1", inputTextDelta: '"SF"}' },
          {
            type: "tool-input-available",
            toolCallId: "call-1",
            toolName: "get_weather",
            input: { city: "SF" },
          },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "msg-2", role: "assistant" },
        { type: EventType.TOOL_CALL_START, toolCallId: "call-1", toolCallName: "get_weather" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '{"_request":' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '{"city":' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '"SF"}' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: "}" },
        { type: EventType.TOOL_CALL_END, toolCallId: "call-1" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "msg-2" },
      ]);
    });
  });

  describe("error handling", () => {
    it("maps error event to RUN_ERROR", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "msg-3" },
          { type: "error", errorText: "Rate limit exceeded" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "msg-3", role: "assistant" },
        { type: EventType.RUN_ERROR, message: "Rate limit exceeded" },
      ]);
    });

    it("maps abort event to RUN_ERROR with reason", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "msg-4" },
          { type: "abort", reason: "user cancelled" },
        ),
      );

      const events = await collectEvents(response);

      expect(events[1]).toEqual({
        type: EventType.RUN_ERROR,
        message: "user cancelled",
      });
    });

    it("maps abort event without reason to default message", async () => {
      const response = makeResponse(sseLines({ type: "abort" }));

      const events = await collectEvents(response);

      expect(events[0]).toEqual({
        type: EventType.RUN_ERROR,
        message: "Stream aborted",
      });
    });

    it("maps tool-input-error to RUN_ERROR", async () => {
      const response = makeResponse(
        sseLines({
          type: "tool-input-error",
          toolCallId: "call-1",
          toolName: "get_weather",
          input: {},
          errorText: "Invalid input schema",
        }),
      );

      const events = await collectEvents(response);

      expect(events[0]).toEqual({
        type: EventType.RUN_ERROR,
        message: "Invalid input schema",
      });
    });
  });

  describe("SSE parsing", () => {
    it("ignores [DONE] sentinel", async () => {
      const response = makeResponse(
        sseLines({ type: "start", messageId: "msg-5" }, { type: "finish" }) + "data: [DONE]\n\n",
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(2);
      expect((events[0] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_START);
      expect((events[1] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_END);
    });

    it("ignores non-data lines", async () => {
      const body =
        "event: message\ndata: " + JSON.stringify({ type: "start", messageId: "m1" }) + "\n\n";
      const response = makeResponse(body);

      const events = await collectEvents(response);

      expect(events).toHaveLength(1);
      expect((events[0] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_START);
    });

    it("handles chunks split across reads", async () => {
      const fullLine = `data: ${JSON.stringify({ type: "start", messageId: "msg-6" })}\n\n`;
      const splitAt = Math.floor(fullLine.length / 2);

      const response = makeChunkedResponse(fullLine.slice(0, splitAt), fullLine.slice(splitAt));

      const events = await collectEvents(response);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg-6",
        role: "assistant",
      });
    });

    it("handles JSON split mid-line across chunks", async () => {
      const line1 = `data: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "hello" })}`;
      const response = makeChunkedResponse(
        `data: ${JSON.stringify({ type: "start", messageId: "m1" })}\n\n`,
        line1.slice(0, 10),
        line1.slice(10) + "\n\n",
        `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(3);
      expect((events[0] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_START);
      expect(events[1]).toEqual({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "m1",
        delta: "hello",
      });
      expect((events[2] as { type: EventType }).type).toBe(EventType.TEXT_MESSAGE_END);
    });

    it("recovers from malformed JSON without crashing", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = makeResponse(
        "data: not-json\n\n" + `data: ${JSON.stringify({ type: "start", messageId: "m1" })}\n\n`,
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe(EventType.TEXT_MESSAGE_START);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse Vercel AI SSE event",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("throws when response has no body", async () => {
      const response = new Response(null);
      const adapter = vercelAIAdapter();

      await expect(async () => {
        for await (const _ of adapter.parse(response)) {
          /* drain */
        }
      }).rejects.toThrow("No response body");
    });

    it("processes remaining buffer after stream ends without trailing newline", async () => {
      const body = `data: ${JSON.stringify({ type: "start", messageId: "msg-tail" })}`;
      const response = makeResponse(body);

      const events = await collectEvents(response);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg-tail",
        role: "assistant",
      });
    });
  });

  describe("unhandled events", () => {
    it("silently skips lifecycle events like text-start, text-end, start-step, finish-step", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "m1" },
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: "Hi" },
          { type: "text-end", id: "t1" },
          { type: "start-step" },
          { type: "finish-step" },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "m1", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Hi" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "m1" },
      ]);
    });
  });

  describe("multi-byte UTF-8 split across chunks", () => {
    it("reassembles emoji split at byte boundary", async () => {
      const emoji = "🔥";
      const json = JSON.stringify({ type: "text-delta", id: "t1", delta: emoji });
      const sseLine = `data: ${json}\n\n`;
      const bytes = new TextEncoder().encode(sseLine);

      const startPayload = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "start", messageId: "utf8-1" })}\n\n`,
      );
      const finishPayload = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      );

      // Split the emoji SSE line mid-emoji (🔥 is 4 bytes in UTF-8)
      const emojiStart = sseLine.indexOf(emoji);
      const byteOffset = new TextEncoder().encode(sseLine.slice(0, emojiStart)).length + 2;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(startPayload);
          controller.enqueue(bytes.slice(0, byteOffset));
          controller.enqueue(bytes.slice(byteOffset));
          controller.enqueue(finishPayload);
          controller.close();
        },
      });

      const events = await collectEvents(new Response(stream));

      expect(events).toHaveLength(3);
      expect(events[1]).toEqual({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "utf8-1",
        delta: emoji,
      });
    });

    it("reassembles CJK character split at byte boundary", async () => {
      const cjk = "你好世界";
      const json = JSON.stringify({ type: "text-delta", id: "t1", delta: cjk });
      const sseLine = `data: ${json}\n\n`;
      const bytes = new TextEncoder().encode(sseLine);

      const startPayload = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "start", messageId: "cjk-1" })}\n\n`,
      );
      const finishPayload = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      );

      // Split mid-way through a multi-byte char (each CJK char is 3 bytes)
      const cjkStart = sseLine.indexOf(cjk);
      const byteOffset = new TextEncoder().encode(sseLine.slice(0, cjkStart)).length + 4;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(startPayload);
          controller.enqueue(bytes.slice(0, byteOffset));
          controller.enqueue(bytes.slice(byteOffset));
          controller.enqueue(finishPayload);
          controller.close();
        },
      });

      const events = await collectEvents(new Response(stream));

      expect(events).toHaveLength(3);
      expect(events[1]).toEqual({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "cjk-1",
        delta: cjk,
      });
    });

    it("handles emoji in the final buffer after stream ends", async () => {
      const json = JSON.stringify({ type: "text-delta", id: "t1", delta: "done✅" });
      const sseLine = `data: ${json}`;
      const bytes = new TextEncoder().encode(sseLine);

      // Split so the ✅ (3 bytes) is cut mid-character
      const checkStart = sseLine.indexOf("✅");
      const byteOffset = new TextEncoder().encode(sseLine.slice(0, checkStart)).length + 1;

      const startPayload = new TextEncoder().encode(
        `data: ${JSON.stringify({ type: "start", messageId: "utf8-tail" })}\n\n`,
      );

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(startPayload);
          controller.enqueue(bytes.slice(0, byteOffset));
          controller.enqueue(bytes.slice(byteOffset));
          controller.close();
        },
      });

      const events = await collectEvents(new Response(stream));

      expect(events).toHaveLength(2);
      expect(events[1]).toEqual({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "utf8-tail",
        delta: "done✅",
      });
    });
  });

  describe("interleaved tool calls and text", () => {
    it("maps multiple tool calls interleaved with text in a single stream", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "msg-interleave" },
          { type: "text-delta", id: "t1", delta: "Let me look up " },
          { type: "text-delta", id: "t1", delta: "two things." },
          { type: "tool-input-start", toolCallId: "call-a", toolName: "search" },
          { type: "tool-input-delta", toolCallId: "call-a", inputTextDelta: '{"q":"weather"}' },
          {
            type: "tool-input-available",
            toolCallId: "call-a",
            toolName: "search",
            input: { q: "weather" },
          },
          { type: "tool-input-start", toolCallId: "call-b", toolName: "calculator" },
          { type: "tool-input-delta", toolCallId: "call-b", inputTextDelta: '{"expr":' },
          { type: "tool-input-delta", toolCallId: "call-b", inputTextDelta: '"2+2"}' },
          {
            type: "tool-input-available",
            toolCallId: "call-b",
            toolName: "calculator",
            input: { expr: "2+2" },
          },
          { type: "text-delta", id: "t2", delta: "Here are the results." },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "msg-interleave", role: "assistant" },
        {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-interleave",
          delta: "Let me look up ",
        },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "msg-interleave", delta: "two things." },
        { type: EventType.TOOL_CALL_START, toolCallId: "call-a", toolCallName: "search" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-a", delta: '{"_request":' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-a", delta: '{"q":"weather"}' },
        { type: EventType.TOOL_CALL_START, toolCallId: "call-b", toolCallName: "calculator" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-b", delta: '{"_request":' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-b", delta: '{"expr":' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-b", delta: '"2+2"}' },
        {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-interleave",
          delta: "Here are the results.",
        },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-a", delta: "}" },
        { type: EventType.TOOL_CALL_END, toolCallId: "call-a" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-b", delta: "}" },
        { type: EventType.TOOL_CALL_END, toolCallId: "call-b" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "msg-interleave" },
      ]);
    });
  });

  describe("empty stream", () => {
    it("emits only start and end for a stream with no content events", async () => {
      const response = makeResponse(
        sseLines({ type: "start", messageId: "empty-1" }, { type: "finish" }),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "empty-1", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "empty-1" },
      ]);
    });

    it("produces no events from a completely empty body", async () => {
      const response = makeResponse("");
      const events = await collectEvents(response);
      expect(events).toEqual([]);
    });

    it("produces no events from a body with only whitespace and newlines", async () => {
      const response = makeResponse("\n\n  \n\n");
      const events = await collectEvents(response);
      expect(events).toEqual([]);
    });
  });

  describe("multiple consecutive errors", () => {
    it("emits all RUN_ERROR events for consecutive errors", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "err-multi" },
          { type: "error", errorText: "Rate limit" },
          { type: "error", errorText: "Timeout" },
          { type: "error", errorText: "Internal error" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "err-multi", role: "assistant" },
        { type: EventType.RUN_ERROR, message: "Rate limit" },
        { type: EventType.RUN_ERROR, message: "Timeout" },
        { type: EventType.RUN_ERROR, message: "Internal error" },
      ]);
    });

    it("emits errors from mixed error and abort events", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "err-mix" },
          { type: "error", errorText: "Failed" },
          { type: "abort", reason: "cancelled" },
          {
            type: "tool-input-error",
            toolCallId: "c1",
            toolName: "t",
            input: {},
            errorText: "bad input",
          },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "err-mix", role: "assistant" },
        { type: EventType.RUN_ERROR, message: "Failed" },
        { type: EventType.RUN_ERROR, message: "cancelled" },
        { type: EventType.RUN_ERROR, message: "bad input" },
      ]);
    });
  });

  describe("large payloads", () => {
    it("handles a very large text delta in a single SSE line", async () => {
      const largeText = "x".repeat(100_000);
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "big-1" },
          { type: "text-delta", id: "t1", delta: largeText },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(3);
      expect(events[1]).toEqual({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "big-1",
        delta: largeText,
      });
    });

    it("handles large tool call args payload", async () => {
      const largeArgs = JSON.stringify({ data: "y".repeat(50_000) });
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "big-tool" },
          { type: "tool-input-start", toolCallId: "c1", toolName: "big_fn" },
          { type: "tool-input-delta", toolCallId: "c1", inputTextDelta: largeArgs },
          {
            type: "tool-input-available",
            toolCallId: "c1",
            toolName: "big_fn",
            input: { data: "y".repeat(50_000) },
          },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toHaveLength(7);
      expect(events[2]).toEqual({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "c1",
        delta: '{"_request":',
      });
      expect(events[3]).toEqual({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "c1",
        delta: largeArgs,
      });
    });
  });

  describe("whitespace and empty lines between data lines", () => {
    it("handles extra blank lines between SSE data lines", async () => {
      const body =
        `data: ${JSON.stringify({ type: "start", messageId: "ws-1" })}\n\n` +
        "\n\n\n" +
        `data: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "ok" })}\n\n` +
        "\n" +
        `data: ${JSON.stringify({ type: "finish" })}\n\n`;

      const response = makeResponse(body);
      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "ws-1", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "ws-1", delta: "ok" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "ws-1" },
      ]);
    });

    it("handles lines with only whitespace interspersed", async () => {
      const body =
        `data: ${JSON.stringify({ type: "start", messageId: "ws-2" })}\n\n` +
        "   \n" +
        "  \n\n" +
        `data: ${JSON.stringify({ type: "finish" })}\n\n`;

      const response = makeResponse(body);
      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "ws-2", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "ws-2" },
      ]);
    });
  });

  describe("additional edge cases", () => {
    it("handles text delta with empty string", async () => {
      const response = makeResponse(
        sseLines(
          { type: "start", messageId: "empty-delta" },
          { type: "text-delta", id: "t1", delta: "" },
          { type: "finish" },
        ),
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "empty-delta", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "empty-delta", delta: "" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "empty-delta" },
      ]);
    });

    it("handles multiple [DONE] sentinels gracefully", async () => {
      const response = makeResponse(
        sseLines({ type: "start", messageId: "done-multi" }, { type: "finish" }) +
          "data: [DONE]\n\ndata: [DONE]\n\n",
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "done-multi", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "done-multi" },
      ]);
    });

    it("handles data line with extra whitespace after JSON", async () => {
      const response = makeResponse(
        `data: ${JSON.stringify({ type: "start", messageId: "trim-1" })}   \n\n` +
          `data: ${JSON.stringify({ type: "finish" })}  \n\n`,
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "trim-1", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "trim-1" },
      ]);
    });

    it("multiple malformed lines don't prevent valid events from being emitted", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = makeResponse(
        "data: {broken\n\n" +
          "data: also-broken\n\n" +
          `data: ${JSON.stringify({ type: "start", messageId: "resilient" })}\n\n` +
          "data: {\n\n" +
          `data: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "hi" })}\n\n` +
          `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      );

      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "resilient", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "resilient", delta: "hi" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "resilient" },
      ]);
      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });

    it("handles stream where every line arrives as a separate chunk", async () => {
      const lines = [
        `data: ${JSON.stringify({ type: "start", messageId: "byte-by-byte" })}\n\n`,
        `data: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "a" })}\n\n`,
        `data: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "b" })}\n\n`,
        `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      ];

      const response = makeChunkedResponse(...lines);
      const events = await collectEvents(response);

      expect(events).toEqual([
        { type: EventType.TEXT_MESSAGE_START, messageId: "byte-by-byte", role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "byte-by-byte", delta: "a" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "byte-by-byte", delta: "b" },
        { type: EventType.TEXT_MESSAGE_END, messageId: "byte-by-byte" },
      ]);
    });

    it("uses consistent messageId across events when start is in a later chunk", async () => {
      const response = makeChunkedResponse(
        `data: ${JSON.stringify({ type: "start", messageId: "late-start" })}\n`,
        `\ndata: ${JSON.stringify({ type: "text-delta", id: "t1", delta: "yo" })}\n\n`,
        `data: ${JSON.stringify({ type: "finish" })}\n\n`,
      );

      const events = await collectEvents(response);

      expect(events.every((e) => ("messageId" in e ? e.messageId === "late-start" : true))).toBe(
        true,
      );
      expect(events).toHaveLength(3);
    });
  });
});
