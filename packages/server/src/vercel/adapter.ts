import type { UIMessageChunk } from "ai";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput } from "../shared/utils";

/** Preserve AI SDK UI message chunks and repair text before a successful final step closes. */
export const vercelAIAdapter: StreamAdapter<UIMessageChunk> = {
  protocol: "vercel-ai",
  // Track text within each step and wait for the finish reason before attempting repair.
  async *transform(source, fix) {
    const texts = new Map<string, string | null>();
    let held: UIMessageChunk[] = [];
    let hasTools = false;
    let failed = false;

    // Release deferred endings, optionally appending repairs to completed UI text blocks.
    async function* release(repair = false): AsyncGenerator<UIMessageChunk> {
      for (const event of held) {
        const text = event.type === "text-end" ? texts.get(event.id) : undefined;
        if (repair && event.type === "text-end" && text != null && isUIOutput(text)) {
          const result = await fix(text);
          if (result.status === "fixed") {
            yield { type: "text-delta", id: event.id, delta: `\n${result.content}\n` };
          }
        }
        yield event;
      }
      held = [];
      texts.clear();
    }

    for await (const event of source) {
      if (event.type === "start" || event.type === "start-step") {
        // A subsequent step means the preceding step was not the final UI answer.
        yield* release();
        hasTools = false;
        if (event.type === "start") failed = false;
      }
      if (event.type === "text-start") texts.set(event.id, "");
      if (event.type === "text-delta") {
        const previous = texts.get(event.id);
        if (previous != null) {
          const text = previous + event.delta;
          texts.set(event.id, text.length > MAX_AUTOFIX_GENERATION_LENGTH ? null : text);
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
