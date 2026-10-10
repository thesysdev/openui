import { AGUIEvent, StreamProtocolAdapter } from "../../types";
import { chatCompletionsMapper } from "./_shared/chatCompletions";
import { sseDataPayloads } from "./_shared/sseLines";

export const openAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const mapper = chatCompletionsMapper();

    for await (const data of sseDataPayloads(response)) {
      // One bad record (unparseable, or a shape the mapper cannot read) is
      // logged and skipped; the rest of the answer still renders.
      try {
        yield* mapper.push(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse OpenAI SSE event", e);
        continue;
      }
      if (mapper.terminated) return;
    }
  },
});
