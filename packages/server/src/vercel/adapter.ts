import type { UIMessageChunk } from "ai";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";

/** Preserve AI SDK UI message chunks and repair text before a successful final step closes. */
export const vercelAIAdapter: StreamAdapter<UIMessageChunk> = {
  protocol: "vercel-ai",
  // Track text within each step and wait for the finish reason before attempting repair.
  async *transform(source, fix) {
    const texts = new Map<string, string | null>();
    const closings = new Map<string, string>();
    let held: UIMessageChunk[] = [];
    let hasTools = false;
    let failed = false;

    // Release deferred endings, optionally inserting a repair before a held closing fence.
    async function* release(repair = false): AsyncGenerator<UIMessageChunk> {
      for (const event of held) {
        if (event.type === "text-end") {
          const text = texts.get(event.id);
          if (repair && text != null && isUIOutput(text)) {
            const result = await fix(text);
            if (result.status === "fixed") {
              yield {
                type: "text-delta",
                id: event.id,
                delta: `\n${unwrapOpenUIFence(result.content)}\n`,
              };
            }
          }
          const closing = closings.get(event.id);
          if (closing) yield { type: "text-delta", id: event.id, delta: closing };
        }
        yield event;
      }
      held = [];
      texts.clear();
      closings.clear();
    }

    for await (const event of source) {
      if (event.type === "start" || event.type === "start-step") {
        // A subsequent step means the preceding step was not the final UI answer.
        yield* release();
        hasTools = false;
        if (event.type === "start") failed = false;
      }
      if (event.type === "text-start") {
        texts.set(event.id, "");
        closings.delete(event.id);
      }
      if (event.type === "text-delta") {
        const previous = texts.get(event.id);
        if (previous != null) {
          const combined = previous + event.delta;
          if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
            texts.set(event.id, null);
            const closing = closings.get(event.id);
            closings.delete(event.id);
            yield closing ? { ...event, delta: closing + event.delta } : event;
            continue;
          }
          texts.set(event.id, combined);
          const split = splitClosedFence(combined);
          if (split) {
            closings.set(event.id, split.closing);
            const emit = split.body.slice(previous.length);
            if (emit) yield { ...event, delta: emit };
            continue;
          }
        }
      }
      if (event.type.startsWith("tool-")) hasTools = true;
      if (event.type === "error" || event.type === "abort") {
        failed = true;
        yield* release();
      }
      if (event.type === "text-end" || event.type === "finish-step") {
        held.push(event);
        continue;
      }
      if (event.type === "finish") {
        yield* release(event.finishReason === "stop" && !failed && !hasTools);
      }
      yield event;
    }
    // EOF without a successful finish preserves events without attempting repair.
    yield* release();
  },
};
