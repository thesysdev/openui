import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventType, type AGUIEvent, type Message, type StreamProtocolAdapter } from "../../types";
import { processStreamedMessage } from "../processStreamedMessage";

// jsdom is not enabled for this package; stub the rAF API used by the debouncer.
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

const adapterFromEvents = (events: AGUIEvent[]): StreamProtocolAdapter => ({
  async *parse() {
    for (const event of events) {
      yield event;
    }
  },
});

const flush = () => new Promise<void>((r) => setTimeout(r, 10));

describe("processStreamedMessage — TOOL_CALL_RESULT handling", () => {
  it("creates a ToolMessage when a TOOL_CALL_RESULT event is emitted", async () => {
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg-1", role: "assistant" },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc-1",
        toolCallName: "code_block:create",
      },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: '{"language":"ts"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: '{"ok":true}',
        messageId: "msg-tool-1",
        role: "tool",
      },
    ]);

    const created: Message[] = [];
    const updated: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updated.push(m),
      adapter,
    });

    await flush();

    // Expect: one assistant message created, then one tool message created
    expect(created).toHaveLength(2);
    expect(created[0]?.role).toBe("assistant");
    expect(created[1]).toMatchObject({
      role: "tool",
      toolCallId: "tc-1",
      content: '{"ok":true}',
    });
  });

  it("creates one ToolMessage per TOOL_CALL_RESULT event", async () => {
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg-1", role: "assistant" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "a" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-2", toolCallName: "b" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: "res-1",
        messageId: "msg-tool-1",
        role: "tool",
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-2",
        content: "res-2",
        messageId: "msg-tool-2",
        role: "tool",
      },
    ]);

    const created: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: vi.fn(),
      adapter,
    });

    await flush();

    const toolMessages = created.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(2);
    expect(toolMessages[0]).toMatchObject({ toolCallId: "tc-1", content: "res-1" });
    expect(toolMessages[1]).toMatchObject({ toolCallId: "tc-2", content: "res-2" });
  });
});

describe("processStreamedMessage — interleaved output message items", () => {
  it("splits a run with multiple message items into separate assistant messages in wire order", async () => {
    // Per-section backend: prose → tool call → prose → tool call, each its own
    // output message item — must reconstruct live the way reload rebuilds it.
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "item-1", delta: "Let me search. " },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "thesys_web_search" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: '{"q":"a"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: '{"hits":1}',
        messageId: "out-1",
        role: "tool",
      },
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-2", role: "assistant" },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "item-2",
        delta: "Found it. Final answer.",
      },
    ]);

    const created: Message[] = [];
    const updatedById = new Map<string, Message>();

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updatedById.set(m.id, m),
      adapter,
    });

    await flush();

    // Creation order preserves wire order: segment 1, its tool result, segment 2.
    expect(created.map((m) => m.role)).toEqual(["assistant", "tool", "assistant"]);

    const seg1 = created[0] as Message & { content?: string; toolCalls?: unknown[] };
    const seg2 = created[2] as Message & { content?: string; toolCalls?: unknown[] };
    const finalSeg1 = (updatedById.get(seg1.id) ?? seg1) as typeof seg1;
    const finalSeg2 = (updatedById.get(seg2.id) ?? seg2) as typeof seg2;

    expect(finalSeg1.content).toBe("Let me search. ");
    expect(finalSeg1.toolCalls).toHaveLength(1);
    expect(finalSeg2.content).toBe("Found it. Final answer.");
    expect(finalSeg2.toolCalls ?? []).toHaveLength(0);
  });

  it("does not split when the same message item id starts twice", async () => {
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "item-1", delta: "Hello" },
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "item-1", delta: " world" },
    ]);

    const created: Message[] = [];
    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: () => {},
      adapter,
    });
    await flush();

    expect(created.filter((m) => m.role === "assistant")).toHaveLength(1);
  });

  it("splits text after tools even when the wire messageId stays the same", async () => {
    // LangGraph + ChatOpenAI Responses collapses interleaved message items into
    // one AG-UI messageId; processStreamedMessage still segments on text→tools→text.
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "run-1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "run-1", delta: "Let me search." },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "web_search" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: '{"q":"a"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: '{"hits":1}',
        messageId: "out-1",
        role: "tool",
      },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "run-1", delta: "Found it." },
    ]);

    const created: Message[] = [];
    const updatedById = new Map<string, Message>();

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updatedById.set(m.id, m),
      adapter,
    });
    await flush();

    expect(created.map((m) => m.role)).toEqual(["assistant", "tool", "assistant"]);

    const seg1 = created[0] as Message & { content?: string; toolCalls?: unknown[] };
    const seg2 = created[2] as Message & { content?: string; toolCalls?: unknown[] };
    const finalSeg1 = (updatedById.get(seg1.id) ?? seg1) as typeof seg1;
    const finalSeg2 = (updatedById.get(seg2.id) ?? seg2) as typeof seg2;

    expect(finalSeg1.content).toBe("Let me search.");
    expect(finalSeg1.toolCalls).toHaveLength(1);
    expect(finalSeg2.content).toBe("Found it.");
    expect(finalSeg2.toolCalls ?? []).toHaveLength(0);
  });

  it("keeps parallel tool calls on one segment and does not create a blank trailing assistant", async () => {
    // Responses opens a new message item (START) after parallel tools; content
    // may arrive later. An empty assistant must not be committed — it would
    // become `last` and blank the answer until remount.
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "item-1", delta: "Calling both." },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "get_weather" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: '{"city":"NYC"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-2", toolCallName: "get_weather" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-2", delta: '{"city":"SF"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-2" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: '{"temp":20}',
        messageId: "out-1",
        role: "tool",
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-2",
        content: '{"temp":18}',
        messageId: "out-2",
        role: "tool",
      },
      // New message item after tools — no content yet on this event.
      { type: EventType.TEXT_MESSAGE_START, messageId: "item-2", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "item-2", delta: "" },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "item-2",
        delta: "NYC is 20°C and SF is 18°C.",
      },
    ]);

    const created: Message[] = [];
    const updatedById = new Map<string, Message>();

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updatedById.set(m.id, m),
      adapter,
    });
    await flush();

    const assistants = created.filter((m) => m.role === "assistant");
    expect(assistants).toHaveLength(2);
    expect(created.map((m) => m.role)).toEqual(["assistant", "tool", "tool", "assistant"]);

    const seg1 = assistants[0] as Message & { content?: string; toolCalls?: unknown[] };
    const seg2 = assistants[1] as Message & { content?: string; toolCalls?: unknown[] };
    const finalSeg1 = (updatedById.get(seg1.id) ?? seg1) as typeof seg1;
    const finalSeg2 = (updatedById.get(seg2.id) ?? seg2) as typeof seg2;

    expect(finalSeg1.content).toBe("Calling both.");
    expect(finalSeg1.toolCalls).toHaveLength(2);
    expect(finalSeg2.content).toBe("NYC is 20°C and SF is 18°C.");
    expect(finalSeg2.toolCalls ?? []).toHaveLength(0);
  });
});
