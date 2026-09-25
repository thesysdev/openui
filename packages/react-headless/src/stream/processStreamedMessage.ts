import { AssistantMessage, EventType, Message, StreamProtocolAdapter, ToolMessage } from "../types";
import { agUIAdapter } from "./adapters";

/**
 * @inline
 */
interface Parameters {
  response: Response;
  /** A function that creates a new message in the thread (assistant or tool). */
  createMessage: (message: Message) => void;
  /** A function that updates an existing message in the thread (matched by id). */
  updateMessage: (message: Message) => void;
  /** IDs already in the thread, so reused stream-local IDs cannot overwrite history. */
  existingMessageIds?: string[];
  /**
   * Marks a tool call as executing (args closed, awaiting result). Wired to the
   * store's `executingToolCallIds` set so `pairToolActivity` can report the
   * `"executing"` status. Optional — defaults to a no-op for standalone use.
   */
  markToolExecuting?: (toolCallId: string) => void;
  /** Clears a tool call from the executing set (result landed or errored). */
  clearToolExecuting?: (toolCallId: string) => void;
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
  existingMessageIds = [],
  markToolExecuting = () => {},
  clearToolExecuting = () => {},
  adapter = agUIAdapter(),
}: Parameters): Promise<AssistantMessage | void> => {
  let currentMessage: AssistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    toolCalls: [],
  };

  let isFirst = true;
  const usedMessageIds = new Set(existingMessageIds);

  // Adopt wire IDs before publishing; repeated IDs still need distinct segments.
  const adoptMessageId = (id?: string | null) => {
    if (isFirst && id && !usedMessageIds.has(id)) {
      currentMessage = { ...currentMessage, id };
    }
  };

  // The wire message-item id whose text currently streams into currentMessage.
  let currentTextItemId: string | null = null;

  // Tool messages by toolCallId, so repeated TOOL_CALL_RESULTs for the same
  // call UPDATE one message in place instead of duplicating it.
  const toolMessagesByCallId = new Map<string, ToolMessage>();

  // Tool calls that have started but not yet received a result. On RUN_ERROR
  // these are surfaced as errored tool messages instead of being left hanging.
  const inFlightToolCallIds = new Set<string>();

  let rafId: number | null = null;
  const debouncedUpdate = (msg: AssistantMessage) => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateMessage(msg);
      rafId = null;
    });
  };

  /** Flush the open assistant and start a fresh one (interleaved segments). */
  const startNewAssistantSegment = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      if (!isFirst) updateMessage(currentMessage);
    }
    currentMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      toolCalls: [],
    };
    isFirst = true;
    currentTextItemId = null;
  };

  const messageHasBody = (msg: AssistantMessage) =>
    (msg.content?.length ?? 0) > 0 || (msg.toolCalls?.length ?? 0) > 0;

  /** Publish the open assistant only once it has text or tool calls — never an empty shell. */
  const commitCurrentMessage = () => {
    if (isFirst) {
      if (!messageHasBody(currentMessage)) return;
      usedMessageIds.add(currentMessage.id);
      createMessage(currentMessage);
      isFirst = false;
    } else {
      debouncedUpdate(currentMessage);
    }
  };

  for await (const event of adapter.parse(response)) {
    switch (event.type) {
      // TEXT_MESSAGE_CHUNK and TEXT_MESSAGE_CONTENT are very similar events but TEXT_MESSAGE_CHUNK
      // optionally allows for a role change. Since we don't support role changes in processMessage
      // right now, we treat both the same.
      case EventType.TEXT_MESSAGE_CHUNK:
      case EventType.TEXT_MESSAGE_CONTENT: {
        // Ignore empty deltas — a zero-length content event after tools would
        // otherwise open a blank assistant segment that shadows the real answer
        // (common around parallel tool calls when a new message item is opened).
        if (!event.delta) break;
        // Some adapters (LangGraph / ChatOpenAI Responses) keep one wire
        // messageId for a whole model step even when Responses interleaved
        // several message items. Text after tools means a new segment — same
        // split Responses adapters express via a new TEXT_MESSAGE_START id.
        if ((currentMessage.toolCalls?.length ?? 0) > 0) {
          startNewAssistantSegment();
        }
        adoptMessageId(event.messageId);
        currentMessage = {
          ...currentMessage,
          content: (currentMessage.content || "") + event.delta,
        };
        break;
      }

      case EventType.TOOL_CALL_START:
        adoptMessageId(event.parentMessageId);
        inFlightToolCallIds.add(event.toolCallId);
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

      case EventType.TOOL_CALL_END:
        // Args have finished arriving → the call is now executing (awaiting its
        // result), not "streaming". Previously this event was dropped and
        // completion was faked from "did assistant text start".
        markToolExecuting(event.toolCallId);
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

      case EventType.TOOL_CALL_CHUNK: {
        adoptMessageId(event.parentMessageId);
        // Combined convenience form of START + ARGS (AG-UI). Some servers emit
        // only chunks instead of the explicit START/ARGS/END triad; without
        // this case their tool calls would be silently dropped. Lazily START on
        // the first chunk carrying an id, fill the name if it arrives on a later
        // chunk, and append any `delta` as ARGS. (No END is implied — a
        // chunk-only call stays "streaming" until its result lands.)
        const id = event.toolCallId;
        if (!id) break;
        const toolCalls = [...(currentMessage.toolCalls || [])];
        let index = toolCalls.findIndex((tc) => tc.id === id);
        if (index === -1) {
          inFlightToolCallIds.add(id);
          toolCalls.push({
            id,
            type: "function",
            function: { name: event.toolCallName ?? "", arguments: "" },
          });
          index = toolCalls.length - 1;
        }
        const existing = toolCalls[index];
        if (existing) {
          toolCalls[index] = {
            id: existing.id,
            type: "function",
            function: {
              name: existing.function.name || event.toolCallName || "",
              arguments: existing.function.arguments + (event.delta ?? ""),
            },
          };
          currentMessage = { ...currentMessage, toolCalls };
        }
        break;
      }

      case EventType.TEXT_MESSAGE_START: {
        // A DIFFERENT item id after content/tool calls have accumulated means
        // the model opened a new output message item — interleaving prose with
        // tool calls (several sections in one run). Split into a fresh assistant
        // message so the live structure matches what reload reconstructs from
        // storage
        const startId = (event as { messageId?: string }).messageId ?? null;
        const hasBody =
          (currentMessage.content?.length ?? 0) > 0 || (currentMessage.toolCalls?.length ?? 0) > 0;
        if (hasBody && startId !== currentTextItemId) {
          startNewAssistantSegment();
        }
        currentTextItemId = startId;
        adoptMessageId(startId);
        break;
      }

      case EventType.TOOL_CALL_RESULT: {
        // Result landed → no longer executing / in flight.
        clearToolExecuting(event.toolCallId);
        inFlightToolCallIds.delete(event.toolCallId);

        // Surface a failure onto the @ag-ui/core ToolMessage.error field. The
        // TOOL_CALL_RESULT schema is `passthrough`, so adapters may carry an
        // `isError` flag and/or `error` string; map either onto `error` so the
        // selector can emit `status:"error"` (the previously-dead error branch
        // in ToolResult lights up). Absent any failure signal it stays a
        // success — no regression vs. today.
        const failed = event as unknown as { isError?: boolean; error?: string };
        const errorText =
          failed.isError === true || (typeof failed.error === "string" && failed.error.length > 0)
            ? (failed.error ?? event.content)
            : undefined;

        // Upsert the tool message for this toolCallId. First result → create;
        // any subsequent result for the same call → update the same message in
        // place (no duplicates).
        const existing = toolMessagesByCallId.get(event.toolCallId);
        if (existing) {
          const updated: ToolMessage = {
            ...existing,
            content: event.content,
            ...(errorText ? { error: errorText } : {}),
          };
          toolMessagesByCallId.set(event.toolCallId, updated);
          updateMessage(updated);
        } else {
          const toolMessage: ToolMessage = {
            id:
              event.messageId && !usedMessageIds.has(event.messageId)
                ? event.messageId
                : crypto.randomUUID(),
            role: "tool",
            toolCallId: event.toolCallId,
            content: event.content,
            ...(errorText ? { error: errorText } : {}),
          };
          toolMessagesByCallId.set(event.toolCallId, toolMessage);
          usedMessageIds.add(toolMessage.id);
          createMessage(toolMessage);
        }
        continue; // skip the trailing isFirst/update logic — this event doesn't touch currentMessage
      }

      case EventType.RUN_ERROR: {
        const raw = (event as any).message || (event as any).error || "Stream error";
        const errorText = typeof raw === "string" ? raw : JSON.stringify(raw);

        // RUN_ERROR carries no toolCallId. Clear the executing flag for any
        // tool call still in flight (started, no result yet) so it doesn't spin
        // forever, but do NOT synthesize an empty-content tool message for it —
        // an empty result would blank an in-flight renderer (e.g. an artifact
        // skeleton). A call that already streamed a result was removed from the
        // in-flight set on TOOL_CALL_RESULT, so it keeps its delivered content.
        // The failure surfaces as the thread-level error thrown below.
        for (const toolCallId of inFlightToolCallIds) {
          clearToolExecuting(toolCallId);
        }
        inFlightToolCallIds.clear();

        throw new Error(errorText);
      }
    }

    commitCurrentMessage();
  }

  if (rafId !== null) {
    // flush any update
    cancelAnimationFrame(rafId);
    updateMessage(currentMessage);
  } else if (isFirst && messageHasBody(currentMessage)) {
    // Last event was a no-op (e.g. empty delta) after body landed in memory only.
    createMessage(currentMessage);
  }

  return currentMessage;
};
