import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { decodeSSE } from "../sse/decodeSSE";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

export const openAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const messageId = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};
    let messageStarted = false;

    for await (const { data } of decodeSSE(response)) {
      if (!data || data === "[DONE]") continue;

      try {
        const json = JSON.parse(data) as ChatCompletionChunk;
        const choice = json.choices?.[0];
        const delta = choice?.delta;

        if (!delta) continue;

        // Emit TEXT_MESSAGE_START on first meaningful delta
        if (!messageStarted && (delta.content || delta.role)) {
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: "assistant",
          };
          messageStarted = true;
        }

        if (delta.content) {
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: delta.content,
          };
        }

        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;

            if (toolCall.id) {
              toolCallIds[index] = toolCall.id;
              yield {
                type: EventType.TOOL_CALL_START,
                toolCallId: toolCall.id,
                toolCallName: toolCall.function?.name || "",
              };
            }

            if (toolCall.function?.arguments) {
              const toolCallId = toolCallIds[index];
              if (toolCallId) {
                yield {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId,
                  delta: toolCall.function.arguments,
                };
              }
            }
          }
        }

        // Emit end events based on finish_reason
        if (choice?.finish_reason === "stop") {
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId,
          };
        } else if (choice?.finish_reason === "tool_calls") {
          for (const toolCallId of Object.values(toolCallIds)) {
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId,
            };
          }
        }
      } catch (e) {
        console.warn("[OpenUI] Failed to parse OpenAI SSE event", e);
      }
    }
  },
});
