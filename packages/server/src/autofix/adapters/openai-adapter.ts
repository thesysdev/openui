import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../types";
import { isUIOutput } from "../utils";

type ChoiceState = { text: string | null; done: boolean; passthrough: boolean };

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
    ...(template.system_fingerprint !== undefined && {
      system_fingerprint: template.system_fingerprint,
    }),
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
      const pending: { index: number; state: ChoiceState }[] = [];
      const choices = chunk.choices.map((choice) => {
        const key = JSON.stringify([chunk.id, choice.index]);
        let state = states.get(key);
        if (!state) {
          state = { text: "", done: false, passthrough: false };
          states.set(key, state);
        }
        if (state.done) return choice;
        state.passthrough ||=
          !!(choice.delta.tool_calls?.length || choice.delta.function_call) ||
          choice.delta.refusal != null;
        if (state.text !== null) {
          const text = state.text + (choice.delta.content ?? "");
          state.text = text.length > MAX_AUTOFIX_GENERATION_LENGTH ? null : text;
        }
        if (!choice.finish_reason) return choice;
        if (
          choice.finish_reason === "stop" &&
          !state.passthrough &&
          state.text !== null &&
          isUIOutput(state.text)
        ) {
          pending.push({ index: choice.index, state });
          return { ...choice, finish_reason: null };
        }
        state.done = true;
        return choice;
      });
      yield pending.length ? { ...chunk, choices } : chunk;
      for (const { index, state } of pending) {
        const result = await fix(state.text!);
        if (result.status === "fixed") yield correctionChunk(chunk, index, `\n${result.content}\n`);
        state.done = true;
        yield correctionChunk(chunk, index, null);
      }
    }
  },
};
