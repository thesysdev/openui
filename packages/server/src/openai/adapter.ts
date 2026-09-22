import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";

type ChoiceState = {
  text: string | null;
  done: boolean;
  passthrough: boolean;
  closing: string;
};

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

/** Preserve Chat Completions chunks and append repaired UI before the choice finishes. */
export const openAIAdapter: StreamAdapter<ChatCompletionChunk> = {
  protocol: "openai-chat-completions",
  // Track each choice and defer eligible UI stop markers until validation finishes.
  async *transform(source, fix) {
    const states = new Map<string, ChoiceState>();
    for await (const chunk of source) {
      const pending: { index: number; state: ChoiceState; repair: boolean }[] = [];
      const choices = chunk.choices.map((choice) => {
        const key = JSON.stringify([chunk.id, choice.index]);
        let state = states.get(key);
        // First chunk for this choice.
        if (!state) {
          state = { text: "", done: false, passthrough: false, closing: "" };
          states.set(key, state);
        }
        // Already finished this choice; pass through.
        if (state.done) return choice;
        state.passthrough ||=
          !!(choice.delta.tool_calls?.length || choice.delta.function_call) ||
          choice.delta.refusal != null;
        // Still accumulating text for validation.
        if (state.text !== null) {
          const previous = state.text;
          const incoming = choice.delta.content ?? "";
          const combined = previous + incoming;
          // Too large to send to Autofix; stop holding.
          if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
            const flushed = state.closing + incoming;
            state.text = null;
            state.closing = "";
            // Flush the held closer with this delta.
            if (flushed !== incoming) {
              choice = { ...choice, delta: { ...choice.delta, content: flushed } };
            }
          } else {
            state.text = combined;
            const split = splitClosedFence(combined);
            // Hold the closing fence so a later repair stays inside it.
            if (split) {
              state.closing = split.closing;
              const emit = split.body.slice(previous.length);
              // Emit only the body so the closer stays held.
              if (emit !== incoming) {
                choice = { ...choice, delta: { ...choice.delta, content: emit } };
              }
            } else {
              state.closing = "";
            }
          }
        }
        // Mid-stream; nothing to repair yet.
        if (!choice.finish_reason) return choice;
        const repair =
          choice.finish_reason === "stop" &&
          !state.passthrough &&
          state.text !== null &&
          isUIOutput(state.text);
        // Hold the stop until repair and/or the closer are emitted.
        if (repair || state.closing) {
          pending.push({ index: choice.index, state, repair });
          return { ...choice, finish_reason: null };
        }
        state.done = true;
        return choice;
      });
      yield pending.length ? { ...chunk, choices } : chunk;
      for (const { index, state, repair } of pending) {
        // This choice looks like OpenUI worth repairing.
        if (repair) {
          const result = await fix(state.text!);
          // Only append when Autofix actually changed the text.
          if (result.status === "fixed") {
            yield correctionChunk(chunk, index, `\n${unwrapOpenUIFence(result.content)}\n`);
          }
        }
        // Emit the held fence closer after any repair.
        if (state.closing) yield correctionChunk(chunk, index, state.closing);
        state.done = true;
        yield correctionChunk(chunk, index, null);
      }
    }
  },
};
