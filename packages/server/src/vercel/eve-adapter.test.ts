import type { MessageStreamEvent } from "eve/client";
import { describe, expect, it, vi } from "vitest";
import { createAutofixStream } from "../shared/stream";
import { MAX_AUTOFIX_GENERATION_LENGTH, type AutofixResult } from "../shared/types";
import { eveStreamAdapter } from "./eve-adapter";

const program = '```openui\nroot = Card("broken")\n```';
const corrected = '```openui\nroot = Card("fixed")\n```';
const fixed: AutofixResult = {
  status: "fixed",
  original: program,
  content: corrected,
  fixedErrors: [],
  unfixedErrors: [],
};
const meta = { at: "2026-10-04T16:00:00Z", id: "event_1" };
const routing = { sequence: 4, stepIndex: 2, turnId: "turn_1" };

function appended(messageDelta: string, stepIndex = 2): MessageStreamEvent {
  return { type: "message.appended", data: { ...routing, stepIndex, messageDelta }, meta };
}
function completed(
  message = program,
  stepIndex = 2,
  finishReason: "stop" | "length" | "content-filter" | "tool-calls" = "stop",
): MessageStreamEvent {
  return {
    type: "message.completed",
    data: { ...routing, stepIndex, message, finishReason },
    meta,
  };
}
// Failure/boundary payloads are opaque to Autofix and must pass through unchanged.
function boundary(
  type:
    | "turn.completed"
    | "session.completed"
    | "turn.failed"
    | "session.failed"
    | "step.failed"
    | "turn.cancelled"
    | "session.waiting",
): MessageStreamEvent {
  return { type, data: { sequence: 5, turnId: "turn_1" }, meta } as MessageStreamEvent;
}
async function* source(events: MessageStreamEvent[]) {
  yield* events;
}
async function collect(events: MessageStreamEvent[], fix = vi.fn().mockResolvedValue(fixed)) {
  const output: MessageStreamEvent[] = [];
  for await (const event of eveStreamAdapter.transform(source(events), fix)) output.push(event);
  return output;
}
function textOf(events: MessageStreamEvent[]) {
  return events
    .filter((event) => event.type === "message.appended")
    .map((event) => event.data.messageDelta)
    .join("");
}

describe("Eve Autofix adapter", () => {
  it("repairs inside a held fence before message/turn/session completion, once", async () => {
    const end = completed();
    const turn = boundary("turn.completed");
    const session = boundary("session.completed");
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect([appended(program), end, turn, session], fix);
    expect(fix).toHaveBeenCalledExactlyOnceWith(program);
    expect(textOf(output)).toBe('```openui\nroot = Card("broken")\n\nroot = Card("fixed")\n```');
    expect(output.slice(-3)).toEqual([end, turn, session]);
    expect(output[1]).toEqual({
      type: "message.appended",
      data: { ...routing, messageDelta: '\nroot = Card("fixed")\n' },
      meta,
    });
  });

  it("supports completed-only text with the original routing and metadata", async () => {
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect([completed(), boundary("session.completed")], fix);
    expect(fix).toHaveBeenCalledExactlyOnceWith(program);
    expect(textOf(output)).toBe('```openui\nroot = Card("broken")\n\nroot = Card("fixed")\n```');
    for (const event of output) {
      if (event.type === "message.appended") {
        expect(event.data).toMatchObject(routing);
        expect(event.meta).toEqual(meta);
      }
    }
  });

  it.each([
    "turn.failed",
    "session.failed",
    "step.failed",
    "turn.cancelled",
    "session.waiting",
    "eof",
  ] as const)("preserves text without repair on %s", async (type) => {
    const fix = vi.fn().mockResolvedValue(fixed);
    const events = [appended(program), completed(), ...(type === "eof" ? [] : [boundary(type)])];
    const output = await collect(events, fix);
    expect(fix).not.toHaveBeenCalled();
    expect(textOf(output)).toBe(program);
    expect(output.slice(-events.length + 1)).toEqual(events.slice(1));
  });

  it("preserves tool requests and suppresses repair for tool turns", async () => {
    const tool: MessageStreamEvent = {
      type: "actions.requested",
      data: {
        actions: [{ kind: "tool-call", toolName: "lookup", callId: "call_1", input: {} }],
        ...routing,
      },
      meta,
    };
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect(
      [appended(program), completed(), tool, boundary("turn.completed")],
      fix,
    );
    expect(fix).not.toHaveBeenCalled();
    expect(output).toContain(tool);
    expect(textOf(output)).toBe(program);
  });

  it.each(["length", "content-filter", "tool-calls"] as const)(
    "skips non-stop message completion (%s)",
    async (reason) => {
      const fix = vi.fn().mockResolvedValue(fixed);
      const output = await collect(
        [appended(program), completed(program, 2, reason), boundary("turn.completed")],
        fix,
      );
      expect(fix).not.toHaveBeenCalled();
      expect(textOf(output)).toBe(program);
    },
  );

  it.each(["plain", "valid", "oversized", "oversized-completed-only"])(
    "passes through %s text without corrections or duplicate deltas",
    async (kind) => {
      const text =
        kind === "plain"
          ? "Hello"
          : kind.startsWith("oversized")
            ? "root = " + "x".repeat(MAX_AUTOFIX_GENERATION_LENGTH)
            : program;
      const fix = vi.fn().mockResolvedValue({ ...fixed, status: "already_valid", content: text });
      const output = await collect(
        [
          ...(kind === "oversized-completed-only" ? [] : [appended(text)]),
          completed(text),
          boundary("turn.completed"),
        ],
        fix,
      );
      expect(textOf(output).length).toBe(text.length);
      expect(textOf(output) === text).toBe(true);
      expect(fix).toHaveBeenCalledTimes(kind === "valid" ? 1 : 0);
    },
  );

  it("releases intermediate steps without repair and only repairs the final step", async () => {
    const last = 'root = Card("last")';
    const step = {
      type: "step.started",
      data: { ...routing, stepIndex: 3 },
      meta,
    } as MessageStreamEvent;
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect(
      [
        appended(program),
        completed(),
        step,
        appended(last, 3),
        completed(last, 3),
        boundary("turn.completed"),
      ],
      fix,
    );
    expect(fix).toHaveBeenCalledExactlyOnceWith(last);
    expect(
      output.indexOf(
        output.find((event) => event.type === "message.completed" && event.data.stepIndex === 2)!,
      ),
    ).toBeLessThan(output.indexOf(step));
  });

  it("accepts ReadableStream events and emits Eve NDJSON without an SSE terminator", async () => {
    const events = [appended(program), completed(), boundary("turn.completed")];
    const input = new ReadableStream<MessageStreamEvent>({
      start(controller) {
        for (const event of events) controller.enqueue(event);
        controller.close();
      },
    });
    const stream = createAutofixStream(
      { stream: input },
      vi.fn().mockResolvedValue(fixed),
      eveStreamAdapter,
    );
    const response = stream.toResponse();
    expect(response.headers.get("Content-Type")).toBe("application/x-ndjson");
    const wire = await response.text();
    expect(wire).not.toContain("data:");
    expect(wire).not.toContain("[DONE]");
    expect(wire.endsWith("\n")).toBe(true);
    const output = wire
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as MessageStreamEvent);
    expect(output.at(-1)).toEqual(events.at(-1));
    expect(textOf(output)).toContain('Card("fixed")');
    expect(await stream.result).toEqual(fixed);
    expect(input.locked).toBe(false);
  });

  it.each(["turn.failed", "turn.completed"] as const)(
    "resets %s state before a subsequent turn",
    async (firstBoundary) => {
      const nextTurn: MessageStreamEvent = {
        type: "turn.started",
        data: { sequence: 6, turnId: "turn_2" },
        meta,
      };
      const fix = vi.fn().mockResolvedValue(fixed);
      await collect(
        [
          appended(program),
          completed(),
          boundary(firstBoundary),
          nextTurn,
          ...[appended(program), completed(), boundary("turn.completed")].map(
            (event) =>
              ("data" in event
                ? {
                    ...event,
                    data: { ...event.data, turnId: "turn_2" },
                  }
                : event) as MessageStreamEvent,
          ),
        ],
        fix,
      );
      expect(fix).toHaveBeenCalledTimes(firstBoundary === "turn.failed" ? 1 : 2);
      expect(fix).toHaveBeenLastCalledWith(program);
    },
  );
});
