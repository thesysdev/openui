import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";

/** Create a correction or stop chunk with the original completion's routing fields. */
export function correctionChunk(
  template: ChatCompletionChunk,
  index: number,
  content: string | null,
): ChatCompletionChunk {
  return {
    id: template.id,
    object: template.object,
    created: template.created,
    model: template.model,
    ...(template.service_tier !== undefined && { service_tier: template.service_tier }),
    choices: [
      {
        index,
        delta: content === null ? {} : { content },
        finish_reason: content === null ? "stop" : null,
      },
    ],
  };
}

type Held = { id: string; index: number; repair: boolean };

/** Preserve Chat Completions chunks and repair text before a successful final choice closes. */
export const openAIAdapter: StreamAdapter<ChatCompletionChunk> = {
  protocol: "openai-chat-completions",
  // Track text within each choice and wait for the finish reason before attempting repair.
  async *transform(source, fix) {
    const texts = new Map<string, string>();
    const closings = new Map<string, string>();
    const hasTools = new Set<string>();
    const failed = new Set<string>();
    const done = new Set<string>();

    // Release deferred endings, optionally inserting a repair before a held closing fence.
    async function* release(
      template: ChatCompletionChunk,
      held: Held[],
    ): AsyncGenerator<ChatCompletionChunk> {
      for (const { id, index, repair } of held) {
        const text = texts.get(id);
        // Repair only a successful final-choice UI generation.
        if (repair && text != null && isUIOutput(text)) {
          const result = await fix(text);
          // Only append when Autofix actually changed the text.
          if (result.status === "fixed") {
            yield correctionChunk(template, index, `\n${unwrapOpenUIFence(result.content)}\n`);
          }
        }
        const closing = closings.get(id);
        // Emit the held fence closer after any repair.
        if (closing) yield correctionChunk(template, index, closing);
        done.add(id);
        texts.delete(id);
        closings.delete(id);
        yield correctionChunk(template, index, null);
      }
    }

    for await (const chunk of source) {
      const held: Held[] = [];
      const choices = chunk.choices.map((choice) => {
        const id = JSON.stringify([chunk.id, choice.index]);
        // Already finished this choice; pass through.
        if (done.has(id)) return choice;
        // Start accumulating this text part.
        if (!texts.has(id)) texts.set(id, "");

        // Tools mean this choice is not the final UI answer.
        if (choice.delta.tool_calls?.length || choice.delta.function_call) hasTools.add(id);
        // Failed choice; release without repair.
        if (choice.delta.refusal != null) failed.add(id);

        const previous = texts.get(id);
        const incoming = choice.delta.content ?? "";
        // Accumulate text and maybe hold a closing fence.
        if (previous != null) {
          const combined = previous + incoming;
          texts.set(id, combined);
          const split = splitClosedFence(combined);
          // Hold the closing fence so a later repair stays inside it.
          if (split) {
            closings.set(id, split.closing);
            const emit = split.body.slice(previous.length);
            // Always strip the closer from this delta; it is re-emitted in release.
            choice = { ...choice, delta: { ...choice.delta, content: emit } };
          } else {
            closings.delete(id);
          }
        }

        // Mid-stream; nothing to repair yet.
        if (!choice.finish_reason) return choice;
        const text = texts.get(id);
        const repair =
          choice.finish_reason === "stop" &&
          !hasTools.has(id) &&
          !failed.has(id) &&
          text != null &&
          isUIOutput(text);
        // Hold endings until repair and/or the closer are emitted.
        if (repair || closings.has(id)) {
          held.push({ id, index: choice.index, repair });
          return { ...choice, finish_reason: null };
        }
        done.add(id);
        return choice;
      });

      yield { ...chunk, choices };
      yield* release(chunk, held);
    }
  },
};
