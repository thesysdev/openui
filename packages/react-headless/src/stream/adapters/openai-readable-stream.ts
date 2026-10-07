import { AGUIEvent, StreamProtocolAdapter } from "../../types";
import { chatCompletionsMapper } from "./_shared/chatCompletions";
import { sseLineIterator } from "./_shared/sseLines";

/**
 * Adapter for streams produced by the OpenAI SDK's `Stream.toReadableStream()`.
 * That method emits NDJSON (one JSON object per line, no `data: ` SSE prefix),
 * which differs from the raw SSE format that `openAIAdapter` expects.
 */
export const openAIReadableStreamAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const mapper = chatCompletionsMapper();

    for await (const line of sseLineIterator(response)) {
      const data = line.trim();
      if (!data) continue;

      // One bad record (unparseable, or a shape the mapper cannot read) is
      // logged and skipped; the rest of the answer still renders.
      try {
        yield* mapper.push(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse OpenAI NDJSON chunk", e);
        continue;
      }
      if (mapper.terminated) return;
    }
  },
});
