import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import { decodeSSE } from "../sse/decodeSSE";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

export const openAIResponsesAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    // Map item_id → call_id so TOOL_CALL_ARGS can reference the correct toolCallId
    const itemIdToCallId: Record<string, string> = {};

    for await (const { data } of decodeSSE(response)) {
      if (!data || data === "[DONE]") continue;

      try {
        const event = JSON.parse(data) as ResponseStreamEvent;

        switch (event.type) {
          case "response.output_item.added": {
            const item = event.item;
            if (item.type === "message" && item.role === "assistant") {
              yield {
                type: EventType.TEXT_MESSAGE_START,
                messageId: item.id,
                role: "assistant",
              };
            } else if (item.type === "function_call") {
              // Store the mapping so we can resolve it in arguments.delta
              itemIdToCallId[item.id ?? item.call_id] = item.call_id;
              yield {
                type: EventType.TOOL_CALL_START,
                toolCallId: item.call_id,
                toolCallName: item.name,
              };
            }
            break;
          }

          case "response.output_text.delta":
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: event.item_id,
              delta: event.delta,
            };
            break;

          case "response.output_text.done":
            yield {
              type: EventType.TEXT_MESSAGE_END,
              messageId: event.item_id,
            };
            break;

          case "response.function_call_arguments.delta": {
            const callId = itemIdToCallId[event.item_id] ?? event.item_id;
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: callId,
              delta: event.delta,
            };
            break;
          }

          case "response.function_call_arguments.done": {
            const callId = itemIdToCallId[event.item_id] ?? event.item_id;
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId: callId,
            };
            break;
          }

          case "error":
            yield {
              type: EventType.RUN_ERROR,
              message: event.message,
              code: event.code ?? undefined,
            };
            break;

          case "response.failed":
            yield {
              type: EventType.RUN_ERROR,
              message: event.response?.error?.message ?? "Response failed",
              code: event.response?.error?.code ?? undefined,
            };
            break;

          // Intentionally unhandled — these are lifecycle/metadata events:
          // response.created, response.in_progress, response.completed,
          // response.content_part.added, response.content_part.done,
          // response.output_item.done, etc.
          default:
            break;
        }
      } catch (e) {
        console.warn("[OpenUI] Failed to parse OpenAI Responses SSE event", e);
      }
    }
  },
});
