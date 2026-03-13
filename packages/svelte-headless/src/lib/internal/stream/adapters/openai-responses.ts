import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import { EventType } from "../../types";
import type { AGUIEvent, StreamProtocolAdapter } from "../../types";

export const openAIResponsesAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    // Map item_id → call_id so TOOL_CALL_ARGS can reference the correct toolCallId
    const itemIdToCallId: Record<string, string> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
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
          console.error("Failed to parse OpenAI Responses SSE event", e);
        }
      }
    }
  },
});
