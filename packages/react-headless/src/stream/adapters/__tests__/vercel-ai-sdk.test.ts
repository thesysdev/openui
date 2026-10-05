import { describe, expect, it, vi } from "vitest";
import { vercelAIAdapter } from "../../../index";
import { EventType, type AGUIEvent } from "../../../types";

function sse(chunk: unknown): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function makeResponse(body: string, fragmentEveryByte = false): Response {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (fragmentEveryByte) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      } else {
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function collect(iterable: AsyncIterable<AGUIEvent>): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

async function parse(body: string): Promise<AGUIEvent[]> {
  return collect(vercelAIAdapter().parse(makeResponse(body)));
}

describe("vercelAIAdapter", () => {
  it("maps AI SDK model step boundaries", async () => {
    const events = await parse(
      sse({ type: "start-step" }) +
        sse({ type: "finish-step" }) +
        sse({ type: "start-step" }) +
        sse({ type: "finish-step" }),
    );

    expect(events).toEqual([
      {
        type: EventType.STEP_STARTED,
        stepName: "vercel-ai-step-1",
      },
      {
        type: EventType.STEP_FINISHED,
        stepName: "vercel-ai-step-1",
      },
      {
        type: EventType.STEP_STARTED,
        stepName: "vercel-ai-step-2",
      },
      {
        type: EventType.STEP_FINISHED,
        stepName: "vercel-ai-step-2",
      },
    ]);
  });

  it("normalizes all text parts in a model step into one AG-UI message", async () => {
    const events = await parse(
      sse({ type: "start-step" }) +
        sse({ type: "text-start", id: "text-1" }) +
        sse({ type: "text-delta", id: "text-1", delta: "one" }) +
        sse({ type: "text-end", id: "text-1" }) +
        sse({ type: "text-start", id: "text-2" }) +
        sse({ type: "text-delta", id: "text-2", delta: "two" }) +
        sse({ type: "text-end", id: "text-2" }) +
        sse({ type: "finish-step" }),
    );

    expect(events).toEqual([
      {
        type: EventType.STEP_STARTED,
        stepName: "vercel-ai-step-1",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: "one",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: "two",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-1",
      },
      {
        type: EventType.STEP_FINISHED,
        stepName: "vercel-ai-step-1",
      },
    ]);
  });

  it("assigns a standard AG-UI parent message to a tool-only model step", async () => {
    const events = await parse(
      sse({ type: "start-step" }) +
        sse({
          type: "tool-input-available",
          toolCallId: "tool-step-1",
          toolName: "search",
          input: { query: "OpenUI" },
        }) +
        sse({ type: "finish-step" }),
    );

    expect(events).toEqual([
      {
        type: EventType.STEP_STARTED,
        stepName: "vercel-ai-step-1",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "vercel-ai-message-1",
        role: "assistant",
      },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-step-1",
        toolCallName: "search",
        parentMessageId: "vercel-ai-message-1",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-step-1",
        delta: '{"query":"OpenUI"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-step-1",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "vercel-ai-message-1",
      },
      {
        type: EventType.STEP_FINISHED,
        stepName: "vercel-ai-step-1",
      },
    ]);
  });

  it("splits regular text that follows tool calls onto a new AG-UI message", async () => {
    const events = await parse(
      sse({ type: "start-step" }) +
        sse({ type: "text-start", id: "text-1" }) +
        sse({ type: "text-delta", id: "text-1", delta: "Let me do this" }) +
        sse({ type: "text-end", id: "text-1" }) +
        sse({
          type: "tool-input-available",
          toolCallId: "call-1",
          toolName: "get_weather",
          input: { location: "Berlin" },
        }) +
        sse({ type: "tool-output-available", toolCallId: "call-1", output: { temp: 21 } }) +
        sse({ type: "text-start", id: "text-2" }) +
        sse({ type: "text-delta", id: "text-2", delta: "root = Card()" }) +
        sse({ type: "text-end", id: "text-2" }) +
        sse({ type: "finish-step" }),
    );

    expect(
      events.filter(
        (event) =>
          event.type === EventType.TEXT_MESSAGE_START ||
          event.type === EventType.TEXT_MESSAGE_CONTENT ||
          event.type === EventType.TEXT_MESSAGE_END,
      ),
    ).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: "Let me do this",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-1",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-2",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-2",
        delta: "root = Card()",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-2",
      },
    ]);
  });

  it("splits text around a server-executed dynamic tool inside one model step", async () => {
    // Cloud-run tools (artifacts, image/web search, MCP) don't end the AI SDK
    // step, so commentary and the answer land in the same step. They reach the
    // client as ordinary dynamic tool chunks, so the split is tool-type agnostic.
    const events = await parse(
      sse({ type: "start-step" }) +
        sse({ type: "text-start", id: "text-1" }) +
        sse({ type: "text-delta", id: "text-1", delta: "Let me look that up" }) +
        sse({ type: "text-end", id: "text-1" }) +
        sse({
          type: "tool-input-start",
          toolCallId: "mcp-1",
          toolName: "deepwiki_search",
          dynamic: true,
        }) +
        sse({
          type: "tool-input-available",
          toolCallId: "mcp-1",
          toolName: "deepwiki_search",
          input: { query: "OpenUI" },
          dynamic: true,
        }) +
        sse({
          type: "tool-output-available",
          toolCallId: "mcp-1",
          output: { hits: 2 },
          dynamic: true,
        }) +
        sse({ type: "text-start", id: "text-2" }) +
        sse({ type: "text-delta", id: "text-2", delta: "root = Card()" }) +
        sse({ type: "text-end", id: "text-2" }) +
        sse({ type: "finish-step" }),
    );

    expect(
      events
        .filter((event) => "messageId" in event && event.type !== EventType.TOOL_CALL_RESULT)
        .map((event) => [event.type, (event as { messageId: string }).messageId]),
    ).toEqual([
      [EventType.TEXT_MESSAGE_START, "text-1"],
      [EventType.TEXT_MESSAGE_CONTENT, "text-1"],
      [EventType.TEXT_MESSAGE_END, "text-1"],
      [EventType.TEXT_MESSAGE_START, "text-2"],
      [EventType.TEXT_MESSAGE_CONTENT, "text-2"],
      [EventType.TEXT_MESSAGE_END, "text-2"],
    ]);
    expect(events.find((event) => event.type === EventType.TOOL_CALL_START)).toMatchObject({
      toolCallId: "mcp-1",
      parentMessageId: "text-1",
    });
  });

  it("maps text start, delta, and end chunks", async () => {
    const events = await parse(
      sse({ type: "text-start", id: "text-1" }) +
        sse({ type: "text-delta", id: "text-1", delta: "Hello" }) +
        sse({ type: "text-delta", id: "text-1", delta: " world" }) +
        sse({ type: "text-end", id: "text-1" }),
    );

    expect(events).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: "Hello",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: " world",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-1",
      },
    ]);
  });

  it("maps streamed tool input without repeating the completed input", async () => {
    const events = await parse(
      sse({ type: "tool-input-start", toolCallId: "tool-1", toolName: "weather" }) +
        sse({
          type: "tool-input-delta",
          toolCallId: "tool-1",
          inputTextDelta: '{"city":"',
        }) +
        sse({ type: "tool-input-delta", toolCallId: "tool-1", inputTextDelta: 'Paris"}' }) +
        sse({
          type: "tool-input-available",
          toolCallId: "tool-1",
          toolName: "weather",
          input: { city: "Paris" },
        }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-1",
        toolCallName: "weather",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-1",
        delta: '{"city":"',
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-1",
        delta: 'Paris"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-1",
      },
    ]);
  });

  it("synthesizes a complete tool lifecycle for non-streamed input", async () => {
    const events = await parse(
      sse({
        type: "tool-input-available",
        toolCallId: "tool-2",
        toolName: "search",
        input: { query: "OpenUI" },
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-2",
        toolCallName: "search",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-2",
        delta: '{"query":"OpenUI"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-2",
      },
    ]);
  });

  it("does not duplicate synthesized args or end events for repeated available input", async () => {
    const available = {
      type: "tool-input-available",
      toolCallId: "tool-duplicate",
      toolName: "search",
      input: { query: "OpenUI" },
    };
    const events = await parse(sse(available) + sse(available));

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-duplicate",
        toolCallName: "search",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-duplicate",
        delta: '{"query":"OpenUI"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-duplicate",
      },
    ]);
  });

  it("maps successful tool output", async () => {
    const events = await parse(
      sse({
        type: "tool-output-available",
        toolCallId: "tool-3",
        output: { temperature: 18, unit: "C" },
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-3",
        toolCallId: "tool-3",
        content: '{"temperature":18,"unit":"C"}',
        role: "tool",
      },
    ]);
  });

  it("maps tool input errors to an ended call and errored result", async () => {
    const events = await parse(
      sse({
        type: "tool-input-error",
        toolCallId: "tool-4",
        toolName: "weather",
        input: { city: 42 },
        errorText: "city must be a string",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-4",
        toolCallName: "weather",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-4",
        delta: '{"city":42}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-4",
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-4",
        toolCallId: "tool-4",
        content: "city must be a string",
        role: "tool",
        isError: true,
        error: "city must be a string",
      },
    ]);
  });

  it("maps tool output errors", async () => {
    const events = await parse(
      sse({
        type: "tool-output-error",
        toolCallId: "tool-5",
        errorText: "weather service unavailable",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-5",
        toolCallId: "tool-5",
        content: "weather service unavailable",
        role: "tool",
        isError: true,
        error: "weather service unavailable",
      },
    ]);
  });

  it("preserves the error signal when tool output error text is empty", async () => {
    const events = await parse(
      sse({
        type: "tool-output-error",
        toolCallId: "tool-empty-error",
        errorText: "",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-empty-error",
        toolCallId: "tool-empty-error",
        content: "",
        role: "tool",
        isError: true,
        error: "",
      },
    ]);
  });

  it("maps denied tool output to an errored result", async () => {
    const events = await parse(sse({ type: "tool-output-denied", toolCallId: "tool-6" }));

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-6",
        toolCallId: "tool-6",
        content: "Tool execution was denied",
        role: "tool",
        isError: true,
        error: "Tool execution was denied",
      },
    ]);
  });

  it("handles SSE and multibyte text fragmented across response chunks", async () => {
    const body =
      sse({ type: "text-start", id: "text-fragmented" }) +
      sse({ type: "text-delta", id: "text-fragmented", delta: "Hello 🌍" }) +
      sse({ type: "text-end", id: "text-fragmented" });

    const events = await collect(vercelAIAdapter().parse(makeResponse(body, true)));

    expect(events).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-fragmented",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-fragmented",
        delta: "Hello 🌍",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-fragmented",
      },
    ]);
  });

  it("maps AI SDK error chunks to RUN_ERROR", async () => {
    const events = await parse(sse({ type: "error", errorText: "The model stream failed" }));

    expect(events).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "The model stream failed",
      },
    ]);
  });

  it("does not emit chunks after the terminal RUN_ERROR event", async () => {
    const events = await parse(
      sse({ type: "error", errorText: "The model stream failed" }) +
        sse({ type: "text-start", id: "text-after-error" }) +
        sse({ type: "text-delta", id: "text-after-error", delta: "ignored" }) +
        sse({ type: "text-end", id: "text-after-error" }),
    );

    expect(events).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "The model stream failed",
      },
    ]);
  });

  it("rejects provider-executed tools when the flag arrives with the input", async () => {
    await expect(
      parse(
        sse({
          type: "tool-input-start",
          toolCallId: "provider-tool-1",
          toolName: "web_search",
          providerExecuted: true,
        }),
      ),
    ).rejects.toThrow(
      "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.",
    );
  });

  it("rejects provider-executed tools when the flag first arrives with the output", async () => {
    await expect(
      parse(
        sse({
          type: "tool-output-available",
          toolCallId: "provider-tool-2",
          output: { results: [] },
          providerExecuted: true,
        }),
      ),
    ).rejects.toThrow(
      "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.",
    );
  });

  it("rejects invalid UIMessage chunks using the AI SDK parser", async () => {
    await expect(
      parse(sse({ type: "text-delta", id: "text-invalid", delta: 42 })),
    ).rejects.toThrow();
  });

  it("reports the optional peer clearly when a bundler replaces it with an empty module", async () => {
    vi.doMock("ai", () => ({}));

    try {
      await expect(collect(vercelAIAdapter().parse(makeResponse("")))).rejects.toThrow(
        'vercelAIAdapter requires the optional peer dependency "ai" (Vercel AI SDK v6 or v7).',
      );
    } finally {
      vi.doUnmock("ai");
    }
  });

  it("throws when the response has no body", async () => {
    await expect(collect(vercelAIAdapter().parse(new Response(null)))).rejects.toThrow(
      "No response body",
    );
  });
});
