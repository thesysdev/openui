import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";
import { errorFrameToRunError } from "./_shared/errorFrame";
import { sseDataPayloads } from "./_shared/sseLines";

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    for await (const data of sseDataPayloads(response)) {
      try {
        const event = JSON.parse(data);
        if (!event?.type) {
          // Not an AG-UI event. An OpenAI-style `{"error":{…}}` record is how a
          // backend (or a proxy in front of it) reports a failure inside a 200
          // stream — surface it rather than yielding an event nobody handles.
          const runError = errorFrameToRunError(event);
          if (runError) {
            yield runError;
            return;
          }
          console.error("Skipping SSE record without an AG-UI event type", event);
          continue;
        }
        yield event as AGUIEvent;
        // A RUN_ERROR ends the run: stop reading, like every other adapter.
        if (event.type === EventType.RUN_ERROR) return;
      } catch (e) {
        console.error("Failed to parse SSE event", e);
      }
    }
  },
});
