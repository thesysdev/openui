import type {
  ResponseFunctionToolCallOutputItem,
  ResponseStreamEvent,
  ResponseUsage,
} from "openai/resources/responses/responses";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

/** A tool result's `output` as a string (JSON-encoded if structured, "" if absent). */
const stringifyOutput = (output: unknown): string =>
  typeof output === "string" ? output : output != null ? JSON.stringify(output) : "";

export interface OpenAIResponsesAdapterOptions {
  onUsage?: (usage: ResponseUsage) => void;
}

export const openAIResponsesAdapter = (
  options?: OpenAIResponsesAdapterOptions,
): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    // Map item_id → call_id so TOOL_CALL_ARGS can reference the correct toolCallId
    const itemIdToCallId: Record<string, string> = {};
    // The text output-item currently streaming.
    let textItemId: string | null = null;

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      // Accumulate across reads: a single SSE `data:` line (e.g. a multi-KB
      // artifact function_call_output payload) can span several network
      // chunks. Splitting each chunk independently tears that line in two and
      // drops it on JSON.parse. Hold the trailing partial line until the next
      // read; on done, flush whatever remains.
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const event = JSON.parse(data) as ResponseStreamEvent;

          switch (event.type) {
            case "response.output_item.added": {
              // OpenAI's Conversations API surfaces function_call_output as an
              // output item even though the SDK's ResponseOutputItem union does
              // not declare it. Widen the type so we can branch on it below.
              const item = event.item as typeof event.item | ResponseFunctionToolCallOutputItem;
              if (item.type === "message" && item.role === "assistant") {
                textItemId = item.id;
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
              } else if (item.type === "function_call_output") {
                yield {
                  type: EventType.TOOL_CALL_RESULT,
                  messageId: item.id,
                  toolCallId: item.call_id,
                  content: stringifyOutput(item.output),
                };
              } else if (item.type === "web_search_call") {
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId: item.id,
                  toolCallName: "web_search",
                };
              } else if (item.type === "mcp_call") {
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId: item.id,
                  toolCallName: item.name,
                };
              } else if (item.type === "mcp_list_tools") {
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId: item.id,
                  toolCallName: "mcp_list_tools",
                };
                yield {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId: item.id,
                  delta: JSON.stringify({ server_label: item.server_label }),
                };
                yield {
                  type: EventType.TOOL_CALL_END,
                  toolCallId: item.id,
                };
              }
              break;
            }

            case "response.output_text.delta":
              // A delta for a not-yet-seen item id opens its message — covers
              // backends that switch item id on the delta without a preceding
              // `output_item.added` (idempotent when that event did fire).
              if (event.item_id !== textItemId) {
                textItemId = event.item_id;
                yield {
                  type: EventType.TEXT_MESSAGE_START,
                  messageId: event.item_id,
                  role: "assistant",
                };
              }
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

            case "response.mcp_call_arguments.delta":
              yield {
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: event.item_id,
                delta: event.delta,
              };
              break;

            case "response.mcp_call_arguments.done":
              yield {
                type: EventType.TOOL_CALL_END,
                toolCallId: event.item_id,
              };
              break;

            case "response.output_item.done": {
              // Server-executed tools deliver their result on the done item —
              // there's no function_call_output for them: mcp_call carries
              // output/error, web_search carries output/action. Every other item
              // type closes via its own event (function_call →
              // function_call_arguments.done, message → output_text.done).
              if (event.item.type === "mcp_call") {
                const mcp = event.item;
                const errorText =
                  typeof mcp.error === "string" && mcp.error.length > 0 ? mcp.error : undefined;
                yield {
                  type: EventType.TOOL_CALL_RESULT,
                  messageId: mcp.id,
                  toolCallId: mcp.id,
                  content: stringifyOutput(mcp.output),
                  ...(errorText ? { isError: true, error: errorText } : {}),
                };
                break;
              }

              if (event.item.type === "mcp_list_tools") {
                const list = event.item;
                // Summarize to names only
                const toolNames = list.tools.map((t) => t.name);
                const listError =
                  typeof list.error === "string" && list.error.length > 0 ? list.error : undefined;
                yield {
                  type: EventType.TOOL_CALL_RESULT,
                  messageId: list.id,
                  toolCallId: list.id,
                  content: JSON.stringify({
                    server_label: list.server_label,
                    tool_count: toolNames.length,
                    tools: toolNames,
                  }),
                  ...(listError ? { isError: true, error: listError } : {}),
                };
                break;
              }

              const item = event.item as {
                type?: string;
                id?: string;
                status?: string;
                output?: unknown;
                error?: unknown;
                action?: unknown;
              };
              if (item.type !== "web_search_call") break;

              const toolCallId = item.id ?? "web_search_call";

              // web_search streams no argument deltas — its query lives in
              // `action`. Surface it as the tool-call args so the card shows the
              // query live, matching a reload's persisted function_call args.
              if (item.action && typeof item.action === "object") {
                yield {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId,
                  delta: JSON.stringify(item.action),
                };
              }

              const content = stringifyOutput(item.output);
              yield {
                type: EventType.TOOL_CALL_RESULT,
                messageId: toolCallId,
                toolCallId,
                content,
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

            case "response.completed": {
              if (event.response?.usage && options?.onUsage) {
                options.onUsage(event.response.usage);
              }
              break;
            }

            // Intentionally unhandled — these are lifecycle/metadata events:
            // response.created, response.in_progress, response.completed,
            // response.content_part.added, response.content_part.done,
            // web_search's *.in_progress/searching/completed status events,
            // response.mcp_call.in_progress/.completed/.failed and
            // response.mcp_list_tools.* (the respective output_item.added/.done
            // handling above covers all three), and the mcp_approval_request
            // output item (HITL approval flow — no tray), etc.
            default:
              break;
          }
        } catch (e) {
          console.error("Failed to parse OpenAI Responses SSE event", e);
        }
      }
      if (done) break;
    }
  },
});
