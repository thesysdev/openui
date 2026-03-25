import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

export const mastraAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const messageId = crypto.randomUUID();

    yield {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "assistant",
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") {
          if (data === "[DONE]") {
            yield { type: EventType.TEXT_MESSAGE_END, messageId };
          }
          continue;
        }

        try {
          const event = JSON.parse(data);

          if (event.type === "text-delta" || event.textDelta) {
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: event.textDelta || event.text || "",
            };
          } else if (event.type === "tool-call") {
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: event.toolCallId,
              toolCallName: event.toolName,
            };
            if (event.argsTextDelta || event.args) {
              const deltaArgs = event.argsTextDelta || (typeof event.args === "string" ? event.args : JSON.stringify(event.args));        
              yield {
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: event.toolCallId,
                delta: deltaArgs,
              };
              yield {
                type: EventType.TOOL_CALL_END,
                toolCallId: event.toolCallId,
              };
            }
          } else if (event.type === "tool-call-delta") {
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: event.toolCallId,
              delta: event.argsTextDelta,
            };
          } else if (event.type === "finish") {
            yield { type: EventType.TEXT_MESSAGE_END, messageId };
          } else if (typeof event === "object" && typeof event.text === "string") {
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: event.text,
            };
          }
        } catch (e) {
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: data,
          };
        }
      }
    }
  },
});
