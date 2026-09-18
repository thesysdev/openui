import { EventType, type AGUIEvent } from "@openuidev/react-headless";
import type { ChatEvent } from "./contract";

/** Use standard AG-UI events; only the repair report inside message content is app-specific. */
export async function* toAGUIEvents(
  events: AsyncIterable<ChatEvent>,
): AsyncGenerator<AGUIEvent> {
  const messageId = crypto.randomUUID();
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
  for await (const event of events) {
    if (event.type === "error") {
      yield { type: EventType.RUN_ERROR, message: event.message };
      return;
    }
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: JSON.stringify(event) + "\n",
    };
    if (event.type === "result") {
      yield { type: EventType.TEXT_MESSAGE_END, messageId };
      return;
    }
  }
  throw new Error("Generation ended before a final result arrived.");
}
