import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

type LangGraphContent = string | Array<{ type: string; text?: string }>;

/** LangGraph AI message (or chunk) received in `messages` stream mode. */
interface LangGraphAIMessage {
  id?: string;
  type: "ai" | "AIMessageChunk" | "AIMessage";
  content: LangGraphContent;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown> | string;
  }>;
  tool_call_chunks?: Array<{
    id?: string;
    name?: string;
    args?: string;
    index?: number;
  }>;
}

/** LangGraph tool result (or chunk) received between model invocations. */
interface LangGraphToolMessage {
  id?: string;
  type: "tool" | "ToolMessage" | "ToolMessageChunk";
  content: LangGraphContent;
  tool_call_id: string;
  status?: "success" | "error";
}

type LangGraphMessage = LangGraphAIMessage | LangGraphToolMessage;

/**
 * Metadata attached to each message tuple in the `messages` stream mode.
 */
interface LangGraphMessageMetadata {
  langgraph_node?: string;
  langgraph_step?: number;
  langgraph_triggers?: string[];
  langgraph_checkpoint_ns?: string;
  tags?: string[];
  ls_model_name?: string;
}

/**
 * Options for the LangGraph adapter.
 */
export interface LangGraphAdapterOptions {
  /**
   * Called when a LangGraph interrupt is encountered in an `updates` event.
   * The interrupt payload is the value of the `__interrupt__` key.
   */
  onInterrupt?: (interrupt: unknown) => void;
}

/**
 * Adapter for LangGraph streaming responses.
 *
 * LangGraph uses named SSE events (`event: <type>\ndata: <json>\n\n`)
 * rather than the `data:`-only format used by OpenAI. The adapter handles
 * the `messages`, `metadata`, `updates`, and `error` event types and maps
 * model steps and tool results to ordered AG-UI events.
 *
 * Usage:
 * ```tsx
 * <ChatProvider
 *   apiUrl="/api/langgraph"
 *   streamProtocol={langGraphAdapter()}
 * />
 * ```
 */
export const langGraphAdapter = (options?: LangGraphAdapterOptions): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fallbackMessageId = crypto.randomUUID();
    let currentMessageId: string | null = null;
    let currentGraphStep: number | undefined;
    const toolCallIdsByIndex = new Map<number, string>();
    const startedToolCallIds = new Set<string>();
    const openToolCallIds = new Set<string>();
    const toolCallArgsSeen = new Set<string>();
    // Every id already spent on an assistant segment, so a repeated wire id can
    // be given a distinct one (see the segment-opening branch below).
    const usedMessageIds = new Set<string>();
    let duplicateMessageIds = 0;
    let messageStarted = false;
    let sawToolsOnCurrentMessage = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      // Accumulate across reads: an SSE event block (e.g. a multi-KB artifact
      // function_call_arguments payload) can span several network reads. Hold the
      // trailing partial block until the next read; on done, flush what remains
      // (the old early `if (done) break` dropped the final un-terminated block).
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines; keep the last (possibly
      // incomplete) block in the buffer until more arrives.
      const blocks = buffer.split("\n\n");
      buffer = done ? "" : (blocks.pop() ?? "");

      for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;

        const { event, data } = parseSSEBlock(trimmed);
        if (!data) continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse LangGraph SSE data", e);
          continue;
        }

        switch (event) {
          case "metadata": {
            // Metadata event signals the run has started.
            // Payload: { run_id: string, thread_id: string }
            // We don't emit RUN_STARTED because processStreamedMessage
            // doesn't handle it — it's informational only.
            break;
          }

          case "messages": {
            // Payload is a tuple: [message_chunk, metadata]
            // or just a message object depending on the stream version.
            const tuple = parsed as [LangGraphMessage, LangGraphMessageMetadata] | LangGraphMessage;
            const msg = Array.isArray(tuple) ? tuple[0] : tuple;
            const metadata = Array.isArray(tuple) ? tuple[1] : undefined;

            if (isToolMessage(msg)) {
              // A ToolMessage marks the end of the model step that requested
              // the tool. Close both the call and assistant segment before
              // emitting its result so live history remains ai → tool → ai.
              if (openToolCallIds.delete(msg.tool_call_id)) {
                yield {
                  type: EventType.TOOL_CALL_END,
                  toolCallId: msg.tool_call_id,
                };
              }
              if (messageStarted && currentMessageId) {
                yield {
                  type: EventType.TEXT_MESSAGE_END,
                  messageId: currentMessageId,
                };
              }
              messageStarted = false;
              currentMessageId = null;
              sawToolsOnCurrentMessage = false;
              currentGraphStep = undefined;
              fallbackMessageId = crypto.randomUUID();
              toolCallIdsByIndex.clear();

              const content = serializeToolContent(msg.content);
              yield {
                type: EventType.TOOL_CALL_RESULT,
                messageId: msg.id ?? `tool-result-${msg.tool_call_id}`,
                toolCallId: msg.tool_call_id,
                content,
                role: "tool",
                ...(msg.status === "error" ? { isError: true, error: content } : {}),
              } as AGUIEvent;
              break;
            }

            if (!isAIMessage(msg)) break;

            const graphStep = metadata?.langgraph_step;
            const graphStepChanged =
              graphStep !== undefined &&
              currentGraphStep !== undefined &&
              graphStep !== currentGraphStep;
            let nextMessageId =
              msg.id ??
              (graphStep === undefined ? fallbackMessageId : `langgraph-step-${graphStep}`);

            const textContent = extractTextContent(msg.content);
            // Text after tool calls is a new assistant item so commentary like
            // "Let me do this" stays on the tool-bearing message and the answer
            // text after it is not concatenated onto the same message.
            const splitAfterTools = !!textContent && sawToolsOnCurrentMessage && messageStarted;

            const isNewModelStep =
              !messageStarted ||
              nextMessageId !== currentMessageId ||
              graphStepChanged ||
              splitAfterTools;

            // LangGraph repeats a wire id across segment boundaries — both when
            // the graph step advances and after a tool call — so an id already
            // spent on a closed segment needs a fresh one for consumers to keep
            // both. Only when opening a segment: mid-message chunks must keep
            // streaming into currentMessageId.
            if (isNewModelStep && usedMessageIds.has(nextMessageId)) {
              nextMessageId = `${nextMessageId}#${++duplicateMessageIds}`;
            }

            if (isNewModelStep) {
              if (messageStarted && currentMessageId) {
                yield {
                  type: EventType.TEXT_MESSAGE_END,
                  messageId: currentMessageId,
                };
              }
              currentMessageId = nextMessageId;
              usedMessageIds.add(nextMessageId);
              currentGraphStep = graphStep;
              sawToolsOnCurrentMessage = false;
              toolCallIdsByIndex.clear();
              yield {
                type: EventType.TEXT_MESSAGE_START,
                messageId: currentMessageId,
                role: "assistant",
              };
              messageStarted = true;
            }

            if (textContent) {
              yield {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId: currentMessageId!,
                delta: textContent,
              };
            }

            // Handle streaming tool call chunks (partial arguments)
            if (msg.tool_call_chunks) {
              for (const chunk of msg.tool_call_chunks) {
                const index = chunk.index ?? 0;

                if (chunk.id) toolCallIdsByIndex.set(index, chunk.id);
                const toolCallId = chunk.id ?? toolCallIdsByIndex.get(index);

                if (toolCallId && !startedToolCallIds.has(toolCallId)) {
                  startedToolCallIds.add(toolCallId);
                  openToolCallIds.add(toolCallId);
                  sawToolsOnCurrentMessage = true;
                  yield {
                    type: EventType.TOOL_CALL_START,
                    toolCallId,
                    toolCallName: chunk.name || "",
                  };
                }

                if (chunk.args && toolCallId) {
                  toolCallArgsSeen.add(toolCallId);
                  yield {
                    type: EventType.TOOL_CALL_ARGS,
                    toolCallId,
                    delta: chunk.args,
                  };
                }
              }
            }

            // Handle complete tool calls only for non-streaming messages.
            // LangChain chunks can also carry a provisional tool_calls
            // projection (often with args: {}). tool_call_chunks is the
            // authoritative source whenever that field is present.
            if (msg.tool_call_chunks === undefined && msg.tool_calls && msg.tool_calls.length > 0) {
              for (let i = 0; i < msg.tool_calls.length; i++) {
                const tc = msg.tool_calls[i];
                if (!tc) continue;

                const toolCallId = tc.id || crypto.randomUUID();

                if (!startedToolCallIds.has(toolCallId)) {
                  startedToolCallIds.add(toolCallId);
                  openToolCallIds.add(toolCallId);
                  sawToolsOnCurrentMessage = true;
                  yield {
                    type: EventType.TOOL_CALL_START,
                    toolCallId,
                    toolCallName: tc.name,
                  };
                }

                if (!toolCallArgsSeen.has(toolCallId)) {
                  const argsStr = typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args);
                  toolCallArgsSeen.add(toolCallId);
                  yield {
                    type: EventType.TOOL_CALL_ARGS,
                    toolCallId,
                    delta: argsStr,
                  };
                }

                if (openToolCallIds.delete(toolCallId)) {
                  yield {
                    type: EventType.TOOL_CALL_END,
                    toolCallId,
                  };
                }
              }
            }

            break;
          }

          case "updates": {
            // Payload: { [node_name]: node_output }
            // Check for interrupts
            const updates = parsed as Record<string, unknown>;
            if ("__interrupt__" in updates && options?.onInterrupt) {
              options.onInterrupt(updates["__interrupt__"]);
            }
            break;
          }

          case "error": {
            // Payload: { error: string, message: string }
            const err = parsed as { error?: string; message?: string };
            yield {
              type: EventType.RUN_ERROR,
              message: err.message || err.error || "Unknown error",
              code: err.error ?? undefined,
            };
            break;
          }

          case "end": {
            // Stream has ended — close out any open message/tool calls.
            if (messageStarted) {
              // End any open streaming tool calls
              for (const toolCallId of openToolCallIds) {
                yield {
                  type: EventType.TOOL_CALL_END,
                  toolCallId,
                };
              }
              openToolCallIds.clear();

              yield {
                type: EventType.TEXT_MESSAGE_END,
                messageId: currentMessageId!,
              };
              messageStarted = false; // Prevent duplicate end in fallback
            }
            break;
          }

          // Intentionally unhandled: values, debug, tasks, checkpoints, custom
          default:
            break;
        }
      }

      if (done) break;
    }

    // If stream ended without an explicit "end" event, close out.
    if (messageStarted) {
      for (const toolCallId of openToolCallIds) {
        yield {
          type: EventType.TOOL_CALL_END,
          toolCallId,
        };
      }
      openToolCallIds.clear();
      yield {
        type: EventType.TEXT_MESSAGE_END,
        messageId: currentMessageId!,
      };
    }
  },
});

/**
 * Parse an SSE block into its event name and data payload.
 *
 * LangGraph SSE format:
 * ```
 * event: messages
 * data: [{"content": "Hello", ...}, {"langgraph_node": "agent"}]
 * ```
 */
function parseSSEBlock(block: string): { event: string; data: string } {
  let event = "";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
    // Ignore id:, retry:, and comment lines
  }

  return { event, data: dataLines.join("\n") };
}

/**
 * Extract text content from a LangGraph message content field.
 * Content can be a plain string or an array of typed content blocks.
 */
function extractTextContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;

  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");
}

function serializeToolContent(content: LangGraphContent): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function isAIMessage(message: LangGraphMessage): message is LangGraphAIMessage {
  return message.type === "ai" || message.type === "AIMessage" || message.type === "AIMessageChunk";
}

function isToolMessage(message: LangGraphMessage): message is LangGraphToolMessage {
  return (
    message.type === "tool" || message.type === "ToolMessage" || message.type === "ToolMessageChunk"
  );
}
