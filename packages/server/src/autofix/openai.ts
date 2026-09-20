import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AutofixError, type AutofixStreamInput } from "./types";

/** Pass through provider chunks or wrap text deltas as Chat Completions chunks. */
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
    // Read the next chunk and add a final stop chunk when a text-only source ends.
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
    // Close the wrapper and ask the upstream iterator to stop.
    async return() {
      ended = true;
      await iterator.return?.();
      return { done: true, value: undefined };
    },
  };
}

/** Check whether the text looks like an OpenUI program that may need validation. */
export function isUIOutput(text: string): boolean {
  return (
    /```openui(?:-lang)?\s*\n/.test(text) || /(?:^|\n)[ \t]*[$A-Za-z_][\w$]*[ \t]*=(?!=)/.test(text)
  );
}

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
