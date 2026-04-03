import { AssistantMessage, EventType, StreamProtocolAdapter } from "../types";
import { agUIAdapter } from "./adapters";

/**
 * @inline
 */
interface Parameters {
  response: Response;
  /** A function that creates a new assistant message in the thread */
  createMessage: (message: AssistantMessage) => void;
  /** A function that updates an existing assistant message in the thread */
  updateMessage: (message: AssistantMessage) => void;
  /** A function that deletes an assistant message from the thread */
  deleteMessage: (messageId: string) => void;
  /** The adapter to use for parsing the stream */
  adapter?: StreamProtocolAdapter;
}

/**
 * @category Utilities
 */
export const processStreamedMessage = async ({
  response,
  createMessage,
  updateMessage,
  deleteMessage,
  adapter = agUIAdapter(),
}: Parameters): Promise<AssistantMessage | void> => {
  let currentMessage: AssistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    toolCalls: [],
  };

  let isFirst = true;

  let rafId: number | null = null;
  const debouncedUpdate = (msg: AssistantMessage) => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateMessage(msg);
      rafId = null;
    });
  };

  for await (const event of adapter.parse(response)) {
    switch (event.type) {
      // TEXT_MESSAGE_CHUNK and TEXT_MESSAGE_CONTENT are very similar events but TEXT_MESSAGE_CHUNK
      // optionally allows for a role change. Since we don't support role changes in processMessage
      // right now, we treat both the same.
      case EventType.TEXT_MESSAGE_CHUNK:
      case EventType.TEXT_MESSAGE_CONTENT:
        currentMessage = {
          ...currentMessage,
          content: (currentMessage.content || "") + event.delta,
        };
        break;

      case EventType.TOOL_CALL_START:
        currentMessage = {
          ...currentMessage,
          toolCalls: [
            ...(currentMessage.toolCalls || []),
            {
              id: event.toolCallId,
              type: "function",
              function: {
                name: event.toolCallName,
                arguments: "",
              },
            },
          ],
        };
        break;

      case EventType.TOOL_CALL_ARGS:
        if (currentMessage.toolCalls) {
          const toolCalls = [...currentMessage.toolCalls];
          const toolCallIndex = toolCalls.findIndex((tc) => tc.id === event.toolCallId);
          if (toolCallIndex !== -1) {
            const currentToolCall = toolCalls[toolCallIndex];
            if (currentToolCall) {
              toolCalls[toolCallIndex] = {
                id: currentToolCall.id,
                type: "function",
                function: {
                  name: currentToolCall.function.name,
                  arguments: currentToolCall.function.arguments + event.delta,
                },
              };
              currentMessage = { ...currentMessage, toolCalls };
            }
          }
        }
        break;

      case EventType.TEXT_MESSAGE_START:
        // Use the ID from the event if it differs from our optimistic ID
        if (event.messageId !== currentMessage.id) {
          deleteMessage(currentMessage.id);
          currentMessage = { ...currentMessage, id: event.messageId };
          isFirst = true; // Will trigger createMessage with new ID
        }
        break;

      case EventType.RUN_ERROR: {
        const msg = (event as any).message || (event as any).error || "Stream error";
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    }

    if (isFirst) {
      createMessage(currentMessage);
      isFirst = false;
    } else {
      // debounce the message update using raf
      debouncedUpdate(currentMessage);
    }
  }

  if (rafId !== null) {
    // flush any update
    cancelAnimationFrame(rafId);
    updateMessage(currentMessage);
  }

  return currentMessage;
};
