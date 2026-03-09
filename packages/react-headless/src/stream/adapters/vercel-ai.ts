import type { UIMessageChunk } from "ai";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

interface ToolCallTracker {
  inputComplete: boolean;
}

function* mapChunkToEvents(
  event: UIMessageChunk,
  messageId: string,
  toolCalls: Map<string, ToolCallTracker>,
): Generator<AGUIEvent> {
  switch (event.type) {
    case "start":
      yield {
        type: EventType.TEXT_MESSAGE_START,
        messageId,
        role: "assistant",
      };
      break;

    case "text-delta":
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: event.delta,
      };
      break;

    case "finish":
      for (const [id] of toolCalls) {
        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: id,
          delta: "}",
        };
        yield { type: EventType.TOOL_CALL_END, toolCallId: id };
      }
      toolCalls.clear();

      yield {
        type: EventType.TEXT_MESSAGE_END,
        messageId,
      };
      break;

    case "tool-input-start":
      toolCalls.set(event.toolCallId, { inputComplete: false });
      yield {
        type: EventType.TOOL_CALL_START,
        toolCallId: event.toolCallId,
        toolCallName: event.toolName,
      };
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: event.toolCallId,
        delta: '{"_request":',
      };
      break;

    case "tool-input-delta":
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: event.toolCallId,
        delta: event.inputTextDelta,
      };
      break;

    case "tool-input-available": {
      const state = toolCalls.get(event.toolCallId);
      if (state) state.inputComplete = true;
      break;
    }

    case "tool-output-available":
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: event.toolCallId,
        delta: `,"_response":${JSON.stringify(event.output)}}`,
      };
      yield { type: EventType.TOOL_CALL_END, toolCallId: event.toolCallId };
      toolCalls.delete(event.toolCallId);
      break;

    case "tool-output-error":
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: event.toolCallId,
        delta: `,"_error":${JSON.stringify(event.errorText)}}`,
      };
      yield { type: EventType.TOOL_CALL_END, toolCallId: event.toolCallId };
      toolCalls.delete(event.toolCallId);
      break;

    case "error":
      yield {
        type: EventType.RUN_ERROR,
        message: event.errorText,
      };
      break;

    case "abort":
      yield {
        type: EventType.RUN_ERROR,
        message: event.reason ?? "Stream aborted",
      };
      break;

    case "tool-input-error":
      yield {
        type: EventType.RUN_ERROR,
        message: event.errorText,
      };
      break;

    default:
      break;
  }
}

function* parseSseLines(
  lines: string[],
  messageId: { value: string },
  toolCalls: Map<string, ToolCallTracker>,
): Generator<AGUIEvent> {
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") continue;

    try {
      const event = JSON.parse(data) as UIMessageChunk;

      if (event.type === "start") {
        messageId.value = event.messageId ?? crypto.randomUUID();
      }

      yield* mapChunkToEvents(event, messageId.value, toolCalls);
    } catch (e) {
      console.error("Failed to parse Vercel AI SSE event", e);
    }
  }
}

export const vercelAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const messageId = { value: "" };
    const toolCalls = new Map<string, ToolCallTracker>();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      yield* parseSseLines(lines, messageId, toolCalls);
    }

    if (buffer.trim()) {
      yield* parseSseLines([buffer], messageId, toolCalls);
    }
  },
});
