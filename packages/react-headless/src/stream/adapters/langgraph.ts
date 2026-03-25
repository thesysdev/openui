import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

/**
 * Represents a LangGraph AI message (or chunk) as received in the
 * `messages` stream mode.
 */
interface LangGraphAIMessage {
  id?: string;
  type: "ai" | "AIMessageChunk" | "AIMessage";
  content: string | Array<{ type: string; text?: string }>;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  tool_call_chunks?: Array<{
    id?: string;
    name?: string;
    args?: string;
    index?: number;
  }>;
}

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
 * them to AG-UI events.
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
    const messageId = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};
    let messageStarted = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines.
      // Split on \n\n to get complete event blocks, keeping the last
      // (possibly incomplete) block in the buffer.
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

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
            const tuple = parsed as
              | [LangGraphAIMessage, LangGraphMessageMetadata]
              | LangGraphAIMessage;

            const msg: LangGraphAIMessage = Array.isArray(tuple) ? tuple[0] : tuple;

            // Only handle AI messages
            if (msg.type !== "ai" && msg.type !== "AIMessageChunk" && msg.type !== "AIMessage") {
              break;
            }

            // Emit TEXT_MESSAGE_START on first AI message chunk
            if (!messageStarted) {
              yield {
                type: EventType.TEXT_MESSAGE_START,
                messageId,
                role: "assistant",
              };
              messageStarted = true;
            }

            // Handle text content
            const textContent = extractTextContent(msg.content);
            if (textContent) {
              yield {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId,
                delta: textContent,
              };
            }

            // Handle streaming tool call chunks (partial arguments)
            if (msg.tool_call_chunks) {
              for (const chunk of msg.tool_call_chunks) {
                const index = chunk.index ?? 0;

                if (chunk.id && !toolCallIds[index]) {
                  toolCallIds[index] = chunk.id;
                  yield {
                    type: EventType.TOOL_CALL_START,
                    toolCallId: chunk.id,
                    toolCallName: chunk.name || "",
                  };
                }

                if (chunk.args) {
                  const toolCallId = toolCallIds[index];
                  if (toolCallId) {
                    yield {
                      type: EventType.TOOL_CALL_ARGS,
                      toolCallId,
                      delta: chunk.args,
                    };
                  }
                }
              }
            }

            // Handle complete tool calls (non-streaming, full args at once)
            if (msg.tool_calls && msg.tool_calls.length > 0) {
              for (let i = 0; i < msg.tool_calls.length; i++) {
                const tc = msg.tool_calls[i];
                if (!tc) continue;

                const toolCallId = tc.id || crypto.randomUUID();

                // Only emit if we haven't already started this tool call
                // via tool_call_chunks
                if (!Object.values(toolCallIds).includes(toolCallId)) {
                  yield {
                    type: EventType.TOOL_CALL_START,
                    toolCallId,
                    toolCallName: tc.name,
                  };

                  const argsStr = typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args);
                  yield {
                    type: EventType.TOOL_CALL_ARGS,
                    toolCallId,
                    delta: argsStr,
                  };

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
              for (const toolCallId of Object.values(toolCallIds)) {
                yield {
                  type: EventType.TOOL_CALL_END,
                  toolCallId,
                };
              }

              yield {
                type: EventType.TEXT_MESSAGE_END,
                messageId,
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
    }

    // If stream ended without an explicit "end" event, close out.
    if (messageStarted) {
      for (const toolCallId of Object.values(toolCallIds)) {
        yield {
          type: EventType.TOOL_CALL_END,
          toolCallId,
        };
      }
      yield {
        type: EventType.TEXT_MESSAGE_END,
        messageId,
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
