import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";
import { sseLineIterator } from "./_shared/sseLines";

/**
 * Adapter for streams produced by the OpenAI SDK's `Stream.toReadableStream()`.
 * That method emits NDJSON (one JSON object per line, no `data: ` SSE prefix),
 * which differs from the raw SSE format that `openAIAdapter` expects.
 */
export const openAIReadableStreamAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    let messageId: string = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};
    let messageStarted = false;

    for await (const line of sseLineIterator(response)) {
      const data = line.trim();
      if (!data) continue;

      try {
        const json = JSON.parse(data) as ChatCompletionChunk;
        if (!messageStarted) messageId = json.id || messageId;
        const choice = json.choices?.[0];
        const delta = choice?.delta;

        if (!delta) continue;

        if (!messageStarted && (delta.content || delta.role || delta.tool_calls?.length)) {
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
        console.error("Failed to parse OpenAI NDJSON chunk", e);
      }
    }
  },
});
