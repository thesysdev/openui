import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AutofixError, type AutofixStreamInput } from "./types";

/** Preserve structured emissions. Strings are a convenience for text-only providers. */
export function createChunkIterator(
  source: AutofixStreamInput["source"],
): AsyncIterator<ChatCompletionChunk> {
  const iterator = source[Symbol.asyncIterator]();
  let mode: "text" | "chunks" | undefined;
  let ended = false;
  const textEnvelope = {
    id: `chatcmpl-${globalThis.crypto.randomUUID()}`,
    object: "chat.completion.chunk" as const,
    created: Math.floor(Date.now() / 1000),
    model: "openui/autofix",
  };
  return {
    async next() {
      if (ended) return { done: true, value: undefined };
      const next = await iterator.next();
      if (next.done) {
        ended = true;
        if (mode !== "text") return { done: true, value: undefined };
        return {
          done: false,
          value: { ...textEnvelope, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
        };
      }
      const value = next.value;
      const nextMode = typeof value === "string" ? "text" : "chunks";
      if (mode && mode !== nextMode) {
        throw new AutofixError(
          "Source cannot mix text and Chat Completions chunks",
          "invalid_stream",
        );
      }
      mode = nextMode;
      return {
        done: false,
        value:
          typeof value === "string"
            ? {
                ...textEnvelope,
                choices: [{ index: 0, delta: { content: value }, finish_reason: null }],
              }
            : value,
      };
    },
    async return() {
      ended = true;
      await iterator.return?.();
      return { done: true, value: undefined };
    },
  };
}

/** Only OpenUI-looking text is eligible; ordinary conversational prose is passed through. */
export function isUIOutput(text: string): boolean {
  return (
    /```openui(?:-lang)?\s*\n/.test(text) || /(?:^|\n)[ \t]*[$A-Za-z_][\w$]*[ \t]*=(?!=)/.test(text)
  );
}

/** Generated events carry routing fields, never duplicate usage/logprobs or provider extensions. */
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
