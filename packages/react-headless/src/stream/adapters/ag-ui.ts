import { AGUIEvent, StreamProtocolAdapter } from "../../types";
import { errorFrameToRunError } from "./_shared/errorFrame";
import { sseLineIterator } from "./_shared/sseLines";

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    for await (const line of sseLineIterator(response)) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const event = JSON.parse(data);
        if (!event?.type) {
          // Not an AG-UI event. An OpenAI-style `{"error":{…}}` record is how a
          // backend (or a proxy in front of it) reports a failure inside a 200
          // stream — surface it rather than yielding an event nobody handles.
          const runError = errorFrameToRunError(event);
          if (runError) yield runError;
          else console.error("Skipping SSE record without an AG-UI event type", event);
          continue;
        }
        yield event as AGUIEvent;
      } catch (e) {
        console.error("Failed to parse SSE event", e);
      }
    }
  },
});
