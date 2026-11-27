import { beforeAll, describe, expect, it } from "vitest";
import { EventType, type AGUIEvent, type Message, type StreamProtocolAdapter } from "../../types";
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

const flush = () => new Promise<void>((r) => setTimeout(r, 10));

/** A thread wired the way the chat store wires it: create appends, update replaces by id. */
const createThread = () => {
  const messages: Message[] = [];
  return {
    messages,
    createMessage: (m: Message) => messages.push(m),
    updateMessage: (m: Message) => {
      const i = messages.findIndex((x) => x.id === m.id);
      if (i !== -1) messages[i] = m;
    },
  };
};

const run = async (events: AGUIEvent[]) => {
  const thread = createThread();
  await processStreamedMessage({
    response: new Response(""),
    createMessage: thread.createMessage,
    updateMessage: thread.updateMessage,
    adapter: {
      async *parse() {
        yield* events;
      },
    },
  });
  await flush();
  return thread.messages;
};

/** Role plus the text a reader sees, in thread order. */
const shape = (messages: Message[]) =>
  messages.map((m) => {
    if (m.role === "assistant") {
      return {
        role: m.role,
        content: m.content ?? "",
        toolCalls: (m.toolCalls ?? []).map((tc) => tc.id),
      };
    }
    return { role: m.role, content: m.content };
  });

describe("processStreamedMessage — reasoning", () => {
  it("adds the reasoning message to the thread as soon as its first delta arrives", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const adapter: StreamProtocolAdapter = {
      async *parse() {
        yield { type: EventType.REASONING_START, messageId: "phase-1" };
        yield { type: EventType.REASONING_MESSAGE_START, messageId: "r1", role: "reasoning" };
        yield { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "Let me " };
        yield { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "think" };
        await gate;
        yield { type: EventType.REASONING_MESSAGE_END, messageId: "r1" };
        yield { type: EventType.REASONING_END, messageId: "phase-1" };
        yield { type: EventType.TEXT_MESSAGE_START, messageId: "m1", role: "assistant" };
        yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Answer" };
        yield { type: EventType.TEXT_MESSAGE_END, messageId: "m1" };
      },
    };
    const thread = createThread();
    const done = processStreamedMessage({
      response: new Response(""),
      createMessage: thread.createMessage,
      updateMessage: thread.updateMessage,
      adapter,
    });

    await flush();
    expect(thread.messages).toEqual([{ id: "r1", role: "reasoning", content: "Let me think" }]);

    release();
    await done;
    await flush();
    expect(shape(thread.messages)).toEqual([
      { role: "reasoning", content: "Let me think" },
      { role: "assistant", content: "Answer", toolCalls: [] },
    ]);
    expect(thread.messages[0]!.id).toBe("r1");
  });

  it("publishes the full reasoning text at stream end even when no other event follows", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_START, messageId: "r1", role: "reasoning" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "a" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "b" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "c" },
    ]);
    expect(shape(messages)).toEqual([{ role: "reasoning", content: "abc" }]);
  });

  it("starts a reasoning message lazily from REASONING_MESSAGE_CHUNK", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_CHUNK, messageId: "r1", delta: "first " },
      { type: EventType.REASONING_MESSAGE_CHUNK, delta: "second" },
      { type: EventType.TEXT_MESSAGE_CHUNK, messageId: "m1", delta: "Answer" },
    ]);
    expect(shape(messages)).toEqual([
      { role: "reasoning", content: "first second" },
      { role: "assistant", content: "Answer", toolCalls: [] },
    ]);
    expect(messages[0]!.id).toBe("r1");
  });

  it("orders reasoning after tool calls below them, before the text that follows", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "Plan" },
      { type: EventType.REASONING_MESSAGE_END, messageId: "r1" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "search" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: "{}" },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: "found",
        messageId: "tool-1",
        role: "tool",
      },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r2", delta: "Reflect" },
      { type: EventType.REASONING_MESSAGE_END, messageId: "r2" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Answer" },
    ]);
    expect(shape(messages)).toEqual([
      { role: "reasoning", content: "Plan" },
      { role: "assistant", content: "", toolCalls: ["tc-1"] },
      { role: "tool", content: "found" },
      { role: "reasoning", content: "Reflect" },
      { role: "assistant", content: "Answer", toolCalls: [] },
    ]);
  });

  it("splits the assistant segment when reasoning interrupts its text", async () => {
    const messages = await run([
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Before" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "Hmm" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "After" },
    ]);
    expect(shape(messages)).toEqual([
      { role: "assistant", content: "Before", toolCalls: [] },
      { role: "reasoning", content: "Hmm" },
      { role: "assistant", content: "After", toolCalls: [] },
    ]);
  });

  it("opens a new reasoning message for a new reasoning messageId", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "one" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r2", delta: "two" },
    ]);
    expect(messages.map((m) => [m.id, m.content])).toEqual([
      ["r1", "one"],
      ["r2", "two"],
    ]);
  });

  it("gives reasoning resumed under a closed messageId its own id", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "one" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "text" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1", delta: "two" },
    ]);
    expect(shape(messages)).toEqual([
      { role: "reasoning", content: "one" },
      { role: "assistant", content: "text", toolCalls: [] },
      { role: "reasoning", content: "two" },
    ]);
    expect(new Set(messages.map((m) => m.id)).size).toBe(3);
  });

  it("does not create a reasoning message for empty deltas", async () => {
    const messages = await run([
      { type: EventType.REASONING_MESSAGE_START, messageId: "r1", role: "reasoning" },
      { type: EventType.REASONING_MESSAGE_CHUNK, messageId: "r1", delta: "" },
      { type: EventType.REASONING_MESSAGE_END, messageId: "r1" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Answer" },
    ]);
    expect(shape(messages)).toEqual([{ role: "assistant", content: "Answer", toolCalls: [] }]);
  });
});
