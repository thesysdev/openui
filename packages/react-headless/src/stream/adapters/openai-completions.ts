import { AGUIEvent, StreamProtocolAdapter } from "../../types";
import { chatCompletionsMapper } from "./_shared/chatCompletions";
import { sseDataPayloads } from "./_shared/sseLines";

export const openAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const mapper = chatCompletionsMapper();

    for await (const data of sseDataPayloads(response)) {
      let json: unknown;
      try {
        json = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse OpenAI SSE event", e);
        continue;
      }
      yield* mapper.chunk(json);
      if (mapper.failed) return;
    }

    yield* mapper.end();
  },
});
