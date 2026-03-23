import { describe, expect, it, vi } from "vitest";
import { EventType } from "../../../types";
import { langGraphAdapter } from "../langgraph";

// ── Helpers ──

/**
 * Create a Response with an SSE body from a raw string.
 */
function makeSSEResponse(body: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream);
}

/**
 * Build a named SSE block: `event: <name>\ndata: <json>\n\n`
 */
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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

// ── Tests ──

describe("langGraphAdapter", () => {
  it("throws when response has no body", async () => {
    const adapter = langGraphAdapter();
    const response = new Response(null);

    await expect(async () => {
      for await (const _ of adapter.parse(response)) {
        /* drain */
      }
    }).rejects.toThrow("No response body");
  });

  describe("text streaming", () => {
    it("emits TEXT_MESSAGE_START, CONTENT, and END for AI message chunks", async () => {
      const body =
        sse("messages", [
          { type: "AIMessageChunk", content: "Hello", id: "msg-1" },
          { langgraph_node: "agent" },
        ]) +
        sse("messages", [
          { type: "AIMessageChunk", content: " world", id: "msg-1" },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      expect(events[0]).toMatchObject({
        type: EventType.TEXT_MESSAGE_START,
        role: "assistant",
      });
      expect(events[1]).toMatchObject({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: "Hello",
      });
      expect(events[2]).toMatchObject({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: " world",
      });
      expect(events[3]).toMatchObject({
        type: EventType.TEXT_MESSAGE_END,
      });
    });

    it("handles content as array of typed blocks", async () => {
      const body =
        sse("messages", [
          {
            type: "AIMessageChunk",
            content: [
              { type: "text", text: "block one" },
              { type: "text", text: " block two" },
            ],
            id: "msg-1",
          },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      expect(events[1]).toMatchObject({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: "block one block two",
      });
    });

    it("handles non-tuple message format (plain object)", async () => {
      const body =
        sse("messages", { type: "ai", content: "plain", id: "msg-1" }) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      expect(events[0]).toMatchObject({ type: EventType.TEXT_MESSAGE_START });
      expect(events[1]).toMatchObject({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: "plain",
      });
    });

    it("ignores non-AI message types", async () => {
      const body =
        sse("messages", [
          { type: "human", content: "user input", id: "hmsg-1" },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      // Should only have the end event (no message start/content)
      expect(events).toHaveLength(0);
    });
  });

  describe("tool calls", () => {
    it("emits tool call events for tool_call_chunks", async () => {
      const body =
        sse("messages", [
          {
            type: "AIMessageChunk",
            content: "",
            tool_call_chunks: [
              { id: "tc-1", name: "get_weather", args: '{"loc', index: 0 },
            ],
          },
          { langgraph_node: "agent" },
        ]) +
        sse("messages", [
          {
            type: "AIMessageChunk",
            content: "",
            tool_call_chunks: [
              { id: undefined, name: undefined, args: 'ation":"NYC"}', index: 0 },
            ],
          },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      // TEXT_MESSAGE_START, TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_ARGS, TOOL_CALL_END, TEXT_MESSAGE_END
      const toolStart = events.find((e: any) => e.type === EventType.TOOL_CALL_START);
      expect(toolStart).toMatchObject({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc-1",
        toolCallName: "get_weather",
      });

      const toolArgs = events.filter((e: any) => e.type === EventType.TOOL_CALL_ARGS);
      expect(toolArgs).toHaveLength(2);
      expect((toolArgs[0] as any).delta).toBe('{"loc');
      expect((toolArgs[1] as any).delta).toBe('ation":"NYC"}');
    });

    it("emits tool call events for complete tool_calls (non-streaming)", async () => {
      const body =
        sse("messages", [
          {
            type: "AIMessageChunk",
            content: "",
            tool_calls: [
              { id: "tc-1", name: "search", args: { query: "test" } },
            ],
          },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      const toolStart = events.find((e: any) => e.type === EventType.TOOL_CALL_START);
      expect(toolStart).toMatchObject({
        toolCallId: "tc-1",
        toolCallName: "search",
      });

      const toolArgs = events.find((e: any) => e.type === EventType.TOOL_CALL_ARGS);
      expect((toolArgs as any).delta).toBe('{"query":"test"}');

      const toolEnd = events.filter((e: any) => e.type === EventType.TOOL_CALL_END);
      // One from the complete tool_calls handling + one from the "end" event cleanup
      expect(toolEnd.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("error handling", () => {
    it("emits RUN_ERROR for error events", async () => {
      const body = sse("error", {
        error: "InternalError",
        message: "Something went wrong",
      });

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      expect(events[0]).toMatchObject({
        type: EventType.RUN_ERROR,
        message: "Something went wrong",
        code: "InternalError",
      });
    });

    it("handles malformed JSON gracefully", async () => {
      const body = "event: messages\ndata: {invalid json}\n\n" + sse("end", null);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse LangGraph SSE data",
        expect.any(SyntaxError),
      );
      consoleSpy.mockRestore();

      // Should still have processed remaining events (no events since "end"
      // with no message started yields nothing)
      expect(events).toHaveLength(0);
    });
  });

  describe("interrupts", () => {
    it("calls onInterrupt when updates contain __interrupt__", async () => {
      const onInterrupt = vi.fn();
      const body =
        sse("messages", [
          { type: "AIMessageChunk", content: "thinking...", id: "msg-1" },
          { langgraph_node: "agent" },
        ]) +
        sse("updates", {
          agent: { messages: [] },
          __interrupt__: { value: "need input", resumable: true },
        }) +
        sse("end", null);

      const adapter = langGraphAdapter({ onInterrupt });
      await collect(adapter.parse(makeSSEResponse(body)));

      expect(onInterrupt).toHaveBeenCalledWith({
        value: "need input",
        resumable: true,
      });
    });

    it("does not throw when onInterrupt is not provided", async () => {
      const body =
        sse("updates", {
          __interrupt__: { value: "need input" },
        }) +
        sse("end", null);

      const adapter = langGraphAdapter();
      // Should not throw
      await collect(adapter.parse(makeSSEResponse(body)));
    });
  });

  describe("metadata event", () => {
    it("does not emit events for metadata", async () => {
      const body =
        sse("metadata", { run_id: "run-123", thread_id: "thread-456" }) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      // No events should be emitted for metadata alone
      expect(events).toHaveLength(0);
    });
  });

  describe("stream end", () => {
    it("closes message on explicit end event", async () => {
      const body =
        sse("messages", [
          { type: "AIMessageChunk", content: "done", id: "msg-1" },
          { langgraph_node: "agent" },
        ]) +
        sse("end", null);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      const lastEvent = events[events.length - 1] as any;
      expect(lastEvent.type).toBe(EventType.TEXT_MESSAGE_END);
    });

    it("closes message when stream ends without end event", async () => {
      const body = sse("messages", [
        { type: "AIMessageChunk", content: "abrupt", id: "msg-1" },
        { langgraph_node: "agent" },
      ]);

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(makeSSEResponse(body)));

      const lastEvent = events[events.length - 1] as any;
      expect(lastEvent.type).toBe(EventType.TEXT_MESSAGE_END);
    });
  });

  describe("multi-chunk delivery", () => {
    it("handles SSE blocks split across multiple chunks", async () => {
      // Simulate a response where SSE data arrives in two chunks,
      // with the split happening mid-block.
      const part1 = "event: messages\ndata: ";
      const part2 =
        JSON.stringify([
          { type: "AIMessageChunk", content: "split", id: "msg-1" },
          { langgraph_node: "agent" },
        ]) + "\n\n" + sse("end", null);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(part1));
          controller.enqueue(new TextEncoder().encode(part2));
          controller.close();
        },
      });

      const adapter = langGraphAdapter();
      const events = await collect(adapter.parse(new Response(stream)));

      expect(events[0]).toMatchObject({ type: EventType.TEXT_MESSAGE_START });
      expect(events[1]).toMatchObject({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: "split",
      });
    });
  });
});
