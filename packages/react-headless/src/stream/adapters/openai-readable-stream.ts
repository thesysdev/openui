import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

/**
 * Adapter for streams produced by the OpenAI SDK's `Stream.toReadableStream()`.
 * That method emits NDJSON (one JSON object per line, no `data: ` SSE prefix),
 * which differs from the raw SSE format that `openAIAdapter` expects.
 */
export const openAIReadableStreamAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const messageId = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};
    let messageStarted = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const data = line.trim();
        if (!data) continue;

        try {
          const json = JSON.parse(data) as ChatCompletionChunk;
          const choice = json.choices?.[0];
          const delta = choice?.delta;

          if (!delta) continue;

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
    }
  },
});
