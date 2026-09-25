import {
  getFunctionCalls,
  getFunctionResponses,
  type Event,
} from "@google/adk";
import { EventType } from "@openuidev/react-headless";

function toolResultContent(response: unknown): string {
  if (typeof response === "string") return response;
  try {
    return JSON.stringify(response ?? {});
  } catch {
    return String(response);
  }
}

function eventText(event: Event): string {
  const parts = event.content?.parts ?? [];
  return parts.map((part) => (typeof part.text === "string" ? part.text : "")).join("");
}

/**
 * Maps an ADK `runAsync` event stream onto AG-UI events.
 *
 * Completions SSE has no tool-result frame, so this example speaks AG-UI
 * (`TOOL_CALL_RESULT` included) and the page uses `agUIAdapter()`.
 */
export async function* adkToAguiEvents(
  events: AsyncIterable<Event>,
  { threadId, runId }: { threadId: string; runId: string },
): AsyncGenerator<object> {
  let messageId = crypto.randomUUID();
  let textOpen = false;
  // When ADK is in SSE mode it emits incremental partials followed by a
  // final aggregate. Streaming both would duplicate the message.
  let sawPartial = false;
  const emittedToolIds = new Set<string>();
  const emittedResultIds = new Set<string>();
  const callIdByName = new Map<string, string>();
  let toolIndex = 0;

  const openText = (): object | undefined => {
    if (textOpen) return undefined;
    textOpen = true;
    return { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
  };

  const closeText = (): object | undefined => {
    if (!textOpen) return undefined;
    const end = { type: EventType.TEXT_MESSAGE_END, messageId };
    textOpen = false;
    messageId = crypto.randomUUID();
    return end;
  };

  yield { type: EventType.RUN_STARTED, threadId, runId };

  for await (const event of events) {
    // Wait for the merged (non-partial) function-call event so we emit one
    // START/ARGS/END per ADK call, not streaming argument crumbs.
    if (!event.partial) {
      const calls = getFunctionCalls(event);
      if (calls.length > 0) {
        const end = closeText();
        if (end) yield end;
        // Next assistant text is a new turn (post-tool answer), not a
        // duplicate of the intro that already streamed as partials.
        sawPartial = false;
      }
      for (const call of calls) {
        if (!call.name) continue;
        const callId = call.id || `adk-tool-${toolIndex}`;
        if (emittedToolIds.has(callId)) continue;
        emittedToolIds.add(callId);
        callIdByName.set(call.name, callId);
        toolIndex += 1;
        yield {
          type: EventType.TOOL_CALL_START,
          toolCallId: callId,
          toolCallName: call.name,
          parentMessageId: messageId,
        };
        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: callId,
          delta: JSON.stringify(call.args ?? {}),
        };
        yield { type: EventType.TOOL_CALL_END, toolCallId: callId };
      }
    }

    for (const response of getFunctionResponses(event)) {
      if (event.partial && response.response == null) continue;
      const byName = response.name ? callIdByName.get(response.name) : undefined;
      const callId =
        (response.id && emittedToolIds.has(response.id) ? response.id : undefined) ||
        byName ||
        response.id;
      if (!callId || emittedResultIds.has(callId)) continue;
      emittedResultIds.add(callId);
      yield {
        type: EventType.TOOL_CALL_RESULT,
        messageId: crypto.randomUUID(),
        toolCallId: callId,
        role: "tool",
        content: toolResultContent(response.response),
      };
    }

    const text = eventText(event);
    if (!text) continue;
    if (!event.partial && sawPartial) continue;

    if (event.partial) sawPartial = true;
    const start = openText();
    if (start) yield start;
    yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
  }

  const end = closeText();
  if (end) yield end;
  yield { type: EventType.RUN_FINISHED, threadId, runId };
}
