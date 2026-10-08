import { beforeAll, describe, expect, it } from "vitest";
import {
  EventType,
  type AGUIEvent,
  type AssistantMessage,
  type Message,
  type StreamProtocolAdapter,
} from "../../types";
import { processStreamedMessage } from "../processStreamedMessage";

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
    for (const event of events) yield event;
  },
});

const flush = () => new Promise<void>((r) => setTimeout(r, 10));

describe("processStreamedMessage — tool status + errors", () => {
  it("marks a tool executing on TOOL_CALL_END and clears it on TOOL_CALL_RESULT", async () => {
    const marked: string[] = [];
    const cleared: string[] = [];
    const created: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: () => {},
      markToolExecuting: (id) => marked.push(id),
      clearToolExecuting: (id) => cleared.push(id),
      adapter: adapterFromEvents([
        { type: EventType.TEXT_MESSAGE_START, messageId: "m1", role: "assistant" },
        { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "search" },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: "{}" },
        { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
        {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "tc-1",
          content: "ok",
          messageId: "tm-1",
          role: "tool",
        },
      ]),
    });
    await flush();

    expect(marked).toEqual(["tc-1"]);
    expect(cleared).toEqual(["tc-1"]);
  });

  it("publishes a call before its result, even while the assistant update is debounced", async () => {
    // Server-side tools stream their call and result back to back. The second
    // call only reaches the store through the debounced update, so without a
    // flush its result would land first and pair with no call (a nameless tool).
    let published: AssistantMessage | null = null;
    const callIdsWhenResultLanded: string[][] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => {
        if (m.role === "assistant") published = m as AssistantMessage;
        if (m.role === "tool") {
          callIdsWhenResultLanded.push(published?.toolCalls?.map((tc) => tc.id) ?? []);
        }
      },
      updateMessage: (m) => {
        if (m.role === "assistant") published = m as AssistantMessage;
      },
      adapter: adapterFromEvents([
        { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "get_weather" },
        { type: EventType.TOOL_CALL_START, toolCallId: "tc-2", toolCallName: "web_search" },
        {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "tc-2",
          content: "results",
          messageId: "tm-2",
          role: "tool",
        },
      ]),
    });
    await flush();

    expect(callIdsWhenResultLanded).toEqual([["tc-1", "tc-2"]]);
  });

  it("surfaces isError/error from TOOL_CALL_RESULT onto ToolMessage.error", async () => {
    const created: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: () => {},
      adapter: adapterFromEvents([
        { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "search" },
        // passthrough fields on the result event signal a failure
        {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "tc-1",
          content: "boom",
          messageId: "tm-1",
          role: "tool",
          isError: true,
          error: "tool exploded",
        } as unknown as AGUIEvent,
      ]),
    });
    await flush();

    const toolMessage = created.find((m) => m.role === "tool");
    expect(toolMessage).toBeDefined();
    expect((toolMessage as { error?: string }).error).toBe("tool exploded");
  });

  it("rejects on RUN_ERROR without synthesizing an empty tool message for a result-less in-flight call", async () => {
    const created: Message[] = [];

    await expect(
      processStreamedMessage({
        response: new Response(""),
        createMessage: (m) => created.push(m),
        updateMessage: () => {},
        adapter: adapterFromEvents([
          { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "search" },
          { type: EventType.RUN_ERROR, message: "stream blew up" } as AGUIEvent,
        ]),
      }),
    ).rejects.toThrow("stream blew up");

    // The in-flight call never streamed a result, so NO empty-content tool
    // message is created (that would blank an in-flight renderer). The error
    // surfaces as the thrown thread-level error instead.
    expect(created.find((m) => m.role === "tool")).toBeUndefined();
  });

  it("keeps an already-delivered tool result intact when RUN_ERROR fires afterwards", async () => {
    const created: Message[] = [];

    await expect(
      processStreamedMessage({
        response: new Response(""),
        createMessage: (m) => created.push(m),
        updateMessage: () => {},
        adapter: adapterFromEvents([
          { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "search" },
          {
            type: EventType.TOOL_CALL_RESULT,
            toolCallId: "tc-1",
            content: "the result",
            messageId: "tm-1",
            role: "tool",
          },
          { type: EventType.RUN_ERROR, message: "stream blew up" } as AGUIEvent,
        ]),
      }),
    ).rejects.toThrow("stream blew up");

    await flush();

    // A delivered result is NOT retroactively errored by a later RUN_ERROR.
    const toolMessage = created.find((m) => m.role === "tool");
    expect(toolMessage).toBeDefined();
    expect((toolMessage as { content?: string }).content).toBe("the result");
    expect((toolMessage as { error?: string }).error).toBeUndefined();
  });

  it("handles TOOL_CALL_CHUNK: lazily starts the call and accumulates streamed args", async () => {
    const created: Message[] = [];
    const updated: Message[] = [];

    const result = await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updated.push(m),
      adapter: adapterFromEvents([
        // First chunk carries the id + name (acts as START) plus an args fragment.
        {
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "tc-1",
          toolCallName: "search",
          delta: '{"q":',
        },
        // Subsequent chunks carry only the delta (act as ARGS).
        { type: EventType.TOOL_CALL_CHUNK, toolCallId: "tc-1", delta: '"hi"}' },
      ] as unknown as AGUIEvent[]),
    });
    await flush();

    const assistant = result as AssistantMessage;
    expect(assistant?.toolCalls).toHaveLength(1);
    const tc = assistant.toolCalls![0]!;
    expect(tc.id).toBe("tc-1");
    expect(tc.function.name).toBe("search");
    expect(tc.function.arguments).toBe('{"q":"hi"}');
  });

  it("fills a TOOL_CALL_CHUNK tool name that arrives on a later chunk than the id", async () => {
    const result = await processStreamedMessage({
      response: new Response(""),
      createMessage: () => {},
      updateMessage: () => {},
      adapter: adapterFromEvents([
        { type: EventType.TOOL_CALL_CHUNK, toolCallId: "tc-2", delta: "" },
        { type: EventType.TOOL_CALL_CHUNK, toolCallId: "tc-2", toolCallName: "lookup" },
        { type: EventType.TOOL_CALL_CHUNK, toolCallId: "tc-2", delta: "{}" },
      ] as unknown as AGUIEvent[]),
    });
    await flush();

    const tc = (result as AssistantMessage).toolCalls?.[0];
    expect(tc?.id).toBe("tc-2");
    expect(tc?.function.name).toBe("lookup");
    expect(tc?.function.arguments).toBe("{}");
  });
});
