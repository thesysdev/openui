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
        // Insert repair and closer just before the text part ends.
        if (event.type === "text-end") {
          const text = texts.get(event.id);
          // Repair only a successful final-step UI generation.
          if (repair && text != null && isUIOutput(text)) {
            const result = await fix(text);
            // Only append when Autofix actually changed the text.
            if (result.status === "fixed") {
              yield {
                type: "text-delta",
                id: event.id,
                delta: `\n${unwrapOpenUIFence(result.content)}\n`,
              };
            }
          }
          const closing = closings.get(event.id);
          // Emit the held fence closer after any repair.
          if (closing) yield { type: "text-delta", id: event.id, delta: closing };
        }
        yield event;
      }
      held = [];
      texts.clear();
      closings.clear();
    }

    for await (const event of source) {
      // New step; the previous one was not the final answer.
      if (event.type === "start" || event.type === "start-step") {
        yield* release();
        hasTools = false;
        // A new run resets the failure flag.
        if (event.type === "start") failed = false;
      }
      // Start accumulating this text part.
      if (event.type === "text-start") {
        texts.set(event.id, "");
        closings.delete(event.id);
      }
      // Accumulate text and maybe hold a closing fence.
      if (event.type === "text-delta") {
        const previous = texts.get(event.id);
        // Still tracking this text part.
        if (previous != null) {
          const combined = previous + event.delta;
          // Too large to send to Autofix; stop holding.
          if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
            texts.set(event.id, null);
            const closing = closings.get(event.id);
            closings.delete(event.id);
            yield closing ? { ...event, delta: closing + event.delta } : event;
            continue;
          }
          texts.set(event.id, combined);
          const split = splitClosedFence(combined);
          // Hold the closing fence so a later repair stays inside it.
          if (split) {
            closings.set(event.id, split.closing);
            const emit = split.body.slice(previous.length);
            // Emit the body slice if anything remains after holding the closer.
            if (emit) yield { ...event, delta: emit };
            continue;
          }
        }
      }
      // Tools mean this step is not the final UI answer.
      if (event.type.startsWith("tool-")) hasTools = true;
      // Failed run; flush held events without repair.
      if (event.type === "error" || event.type === "abort") {
        failed = true;
        yield* release();
      }
      // Hold endings until the stream finishes.
      if (event.type === "text-end" || event.type === "finish-step") {
        held.push(event);
        continue;
      }
      // Stream done; repair only on a clean stop without tools or errors.
      if (event.type === "finish") {
        yield* release(event.finishReason === "stop" && !failed && !hasTools);
      }
      yield event;
    }
    // EOF without a successful finish preserves events without attempting repair.
    yield* release();
  },
};
