import type {
  ResponseStreamEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
} from "openai/resources/responses/responses";
import { describe, expect, it, vi } from "vitest";
import { createAutofixStream } from "../shared/stream";
import { MAX_AUTOFIX_GENERATION_LENGTH, type AutofixResult } from "../shared/types";
import { openAIResponsesAdapter } from "./responses-adapter";

const program = '```openui\nroot = Card("broken")\n```';
const corrected = '```openui\nroot = Card("fixed")\n```';
const fixed: AutofixResult = {
  status: "fixed",
  original: program,
  content: corrected,
  fixedErrors: [],
  unfixedErrors: [],
};

function delta(text: string, itemId = "msg_1", outputIndex = 2): ResponseTextDeltaEvent {
  return {
    type: "response.output_text.delta",
    item_id: itemId,
    output_index: outputIndex,
    content_index: 0,
    sequence_number: 7,
    logprobs: [],
    delta: text,
  };
}

function done(text = program, itemId = "msg_1", outputIndex = 2): ResponseTextDoneEvent {
  return {
    type: "response.output_text.done",
    item_id: itemId,
    output_index: outputIndex,
    content_index: 0,
    sequence_number: 8,
    logprobs: [],
    text,
  };
}

// Only the discriminator is read for lifecycle events; text fixtures use full SDK types.
function boundary(
  type: "response.completed" | "response.failed" | "response.incomplete" | "error",
): ResponseStreamEvent {
  return { type } as ResponseStreamEvent;
}

async function* source(events: ResponseStreamEvent[]) {
  yield* events;
}
async function collect(events: ResponseStreamEvent[], fix = vi.fn().mockResolvedValue(fixed)) {
  const output: ResponseStreamEvent[] = [];
  for await (const event of openAIResponsesAdapter.transform(source(events), fix))
    output.push(event);
  return output;
}
function textOf(events: ResponseStreamEvent[]) {
  return events
    .filter((event) => event.type === "response.output_text.delta")
    .map((event) => event.delta)
    .join("");
}

describe("Responses Autofix adapter", () => {
  it("inserts a repair inside the fence before native closing events and preserves routing", async () => {
    const end = done();
    const part = { type: "response.content_part.done" } as ResponseStreamEvent;
    const item = { type: "response.output_item.done" } as ResponseStreamEvent;
    const complete = boundary("response.completed");
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect([delta(program), end, part, item, complete], fix);
    expect(fix).toHaveBeenCalledExactlyOnceWith(program);
    expect(textOf(output)).toBe('```openui\nroot = Card("broken")\n\nroot = Card("fixed")\n```');
    expect(output.slice(-4)).toEqual([end, part, item, complete]);
    const correction = output[1] as ResponseTextDeltaEvent;
    expect(correction).toMatchObject({
      item_id: "msg_1",
      output_index: 2,
      content_index: 0,
      sequence_number: 8,
      logprobs: [],
    });
  });

  it.each(["response.failed", "response.incomplete", "error", "eof"] as const)(
    "preserves text without repair on %s",
    async (type) => {
      const fix = vi.fn().mockResolvedValue(fixed);
      const events = [delta(program), done(), ...(type === "eof" ? [] : [boundary(type)])];
      const output = await collect(events, fix);
      expect(fix).not.toHaveBeenCalled();
      expect(textOf(output)).toBe(program);
      expect(output.slice(-events.length + 1)).toEqual(events.slice(1));
    },
  );

  it.each(["function_call", "web_search_call", "mcp_call"])(
    "does not repair a response containing a %s item",
    async (type) => {
      const tool = { type: "response.output_item.added", item: { type } } as ResponseStreamEvent;
      const fix = vi.fn().mockResolvedValue(fixed);
      const output = await collect(
        [delta(program), done(), tool, boundary("response.completed")],
        fix,
      );
      expect(fix).not.toHaveBeenCalled();
      expect(output).toContain(tool);
      expect(textOf(output)).toBe(program);
    },
  );

  it("only repairs the final text item", async () => {
    const last = 'root = Card("last")';
    const fix = vi.fn().mockResolvedValue(fixed);
    const output = await collect(
      [
        delta(program),
        done(),
        delta(last, "msg_2", 3),
        done(last, "msg_2", 3),
        boundary("response.completed"),
      ],
      fix,
    );
    expect(fix).toHaveBeenCalledExactlyOnceWith(last);
    expect(
      output.indexOf(
        output.find(
          (event) => event.type === "response.output_text.done" && event.item_id === "msg_1",
        )!,
      ),
    ).toBeLessThan(
      output.indexOf(
        output.find(
          (event) => event.type === "response.output_text.delta" && event.item_id === "msg_2",
        )!,
      ),
    );
    expect(
      output.filter(
        (event) =>
          event.type === "response.output_text.delta" && event.delta.includes('Card("fixed")'),
      ),
    ).toEqual([expect.objectContaining({ item_id: "msg_2", output_index: 3 })]);
  });

  it.each(["plain", "valid", "oversized"])(
    "passes through %s output without adding corrections",
    async (kind) => {
      const text =
        kind === "plain"
          ? "Hello"
          : kind === "oversized"
            ? "root = " + "x".repeat(MAX_AUTOFIX_GENERATION_LENGTH)
            : program;
      const fix = vi.fn().mockResolvedValue({ ...fixed, status: "already_valid", content: text });
      const output = await collect([delta(text), done(text), boundary("response.completed")], fix);
      expect(textOf(output)).toBe(text);
      expect(fix).toHaveBeenCalledTimes(kind === "valid" ? 1 : 0);
    },
  );

  it("serializes Responses SSE and settles the repair result", async () => {
    const fix = vi.fn().mockResolvedValue(fixed);
    const stream = createAutofixStream(
      { stream: source([delta(program), done(), boundary("response.completed")]) },
      fix,
      openAIResponsesAdapter,
    );
    const response = stream.toResponse();
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    const wire = await response.text();
    expect(wire.endsWith("data: [DONE]\n\n")).toBe(true);
    expect(wire).toContain('"type":"response.output_text.delta"');
    expect(await stream.result).toEqual(fixed);
    await expect(async () => {
      for await (const _event of stream.chunks) {
      }
    }).rejects.toMatchObject({ code: "stream_consumed" });
  });

  it("surfaces failed repair diagnostics through chunks and result", async () => {
    const result: AutofixResult = {
      ...fixed,
      status: "fix_failed",
      content: null,
      unfixedErrors: [{ code: "unknown-component", message: "Unknown Card" }],
    };
    const stream = createAutofixStream(
      { stream: source([delta(program), done(), boundary("response.completed")]) },
      vi.fn().mockResolvedValue(result),
      openAIResponsesAdapter,
    );
    await expect(async () => {
      for await (const _event of stream.chunks) {
      }
    }).rejects.toMatchObject({ code: "fix_failed", result });
    await expect(stream.result).rejects.toMatchObject({ code: "fix_failed", result });
  });

  it("cancels a stalled upstream stream before repair starts", async () => {
    const request = new AbortController();
    const upstream = new AbortController();
    const fix = vi.fn().mockResolvedValue(fixed);
    const stalled = {
      controller: upstream,
      async *[Symbol.asyncIterator]() {
        yield delta('root = Card("partial")');
        await new Promise<void>(() => {});
      },
    };
    const stream = createAutofixStream(
      { stream: stalled, signal: request.signal },
      fix,
      openAIResponsesAdapter,
    );
    const iterator = stream.chunks[Symbol.asyncIterator]();
    expect((await iterator.next()).done).toBe(false);
    const pending = iterator.next();
    const reason = new Error("request disconnected");
    request.abort(reason);
    await expect(pending).rejects.toBe(reason);
    await expect(stream.result).rejects.toBe(reason);
    expect(upstream.signal.aborted).toBe(true);
    expect(fix).not.toHaveBeenCalled();
  });
});
