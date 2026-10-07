import type {
  ResponseFunctionToolCallOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";
import { errorFrameToRunError } from "./_shared/errorFrame";
import { sseDataPayloads } from "./_shared/sseLines";
import { truncatedRunError } from "./_shared/truncation";

/** A tool result's `output` as a string (JSON-encoded if structured, "" if absent). */
const stringifyOutput = (output: unknown): string =>
  typeof output === "string" ? output : output != null ? JSON.stringify(output) : "";

/**
 * Tools the provider runs itself and reports on the done item. Each shows as a
 * tool card (start on `output_item.added`, args + result on
 * `output_item.done`), the way `web_search_call` already did. Before, these
 * items emitted nothing: the model ran a tool and the UI showed no activity.
 */
interface HostedToolItem {
  id?: string;
  status?: string;
  queries?: unknown;
  results?: unknown;
  code?: unknown;
  outputs?: unknown;
  result?: unknown;
}

const HOSTED_TOOLS: Record<
  string,
  {
    name: string;
    args: (item: HostedToolItem) => unknown;
    result: (item: HostedToolItem) => unknown;
  }
> = {
  file_search_call: {
    name: "file_search",
    args: (item) => (item.queries ? { queries: item.queries } : undefined),
    result: (item) => item.results ?? { status: item.status },
  },
  code_interpreter_call: {
    name: "code_interpreter",
    args: (item) => (item.code ? { code: item.code } : undefined),
    result: (item) => item.outputs ?? { status: item.status },
  },
  image_generation_call: {
    name: "image_generation",
    args: () => undefined,
    // `result` is the base64 image itself (often megabytes); keep the tool
    // message small and report only that one was produced.
    result: (item) => ({ status: item.status, image: item.result ? "generated" : null }),
  },
};

const FAILED_ITEM_STATUSES = new Set(["failed", "incomplete"]);

export const openAIResponsesAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    // Map item_id → call_id so TOOL_CALL_ARGS can reference the correct toolCallId
    const itemIdToCallId: Record<string, string> = {};
    // The text output-item currently streaming.
    let textItemId: string | null = null;
    // Hosted tool calls use their item id. When a backend omits it, a stand-in id
    // is made unique per call and remembered by output_index, so the done event
    // resolves to the call its added event started; a done item with no added
    // event still starts its own call.
    const startedHostedIds = new Set<string>();
    const standInIdsByIndex = new Map<number, string>();
    const standInId = (type: string, outputIndex: number | undefined): string => {
      const base = `${type}_${outputIndex ?? 0}`;
      let id = base;
      for (let n = 2; startedHostedIds.has(id); n++) id = `${base}_${n}`;
      return id;
    };

    // sseDataPayloads buffers across reads, so a single SSE `data:` line (e.g. a
    // multi-KB artifact function_call_output payload) that spans several network
    // chunks is reassembled before JSON.parse.
    for await (const data of sseDataPayloads(response)) {
      try {
        const event = JSON.parse(data) as ResponseStreamEvent;

        if (!event.type) {
          // An untyped `{"error":{…}}` record (the OpenAI error object as
          // gateways emit it in-stream) is not a ResponseStreamEvent —
          // surface it like the typed `error` event handled below.
          const runError = errorFrameToRunError(event);
          if (runError) {
            yield runError;
            return;
          }
          continue;
        }

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
            } else if (HOSTED_TOOLS[item.type]) {
              const toolCallId = item.id ?? standInId(item.type, event.output_index);
              if (!item.id) standInIdsByIndex.set(event.output_index, toolCallId);
              startedHostedIds.add(toolCallId);
              yield {
                type: EventType.TOOL_CALL_START,
                toolCallId,
                toolCallName: HOSTED_TOOLS[item.type]!.name,
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

          // A refusal is the model's answer to the user, streamed in its own
          // content part; render it as text, exactly like output text.
          case "response.output_text.delta":
          case "response.refusal.delta":
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

          case "response.refusal.done":
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

            const hosted = HOSTED_TOOLS[event.item.type];
            if (hosted) {
              const hostedItem = event.item as HostedToolItem;
              const fromAdded = standInIdsByIndex.get(event.output_index);
              standInIdsByIndex.delete(event.output_index);
              const toolCallId =
                fromAdded ?? event.item.id ?? standInId(event.item.type, event.output_index);
              if (!startedHostedIds.has(toolCallId)) {
                startedHostedIds.add(toolCallId);
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId,
                  toolCallName: hosted.name,
                };
              }
              const args = hosted.args(hostedItem);
              if (args !== undefined) {
                yield {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId,
                  delta: JSON.stringify(args),
                };
              }
              const status = String(hostedItem.status ?? "");
              const failed = FAILED_ITEM_STATUSES.has(status);
              yield {
                type: EventType.TOOL_CALL_RESULT,
                messageId: toolCallId,
                toolCallId,
                content: stringifyOutput(hosted.result(hostedItem)),
                ...(failed ? { isError: true, error: `${hosted.name} ${status}` } : {}),
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

          // A RUN_ERROR ends the run: stop reading, like every other adapter.
          case "error":
            yield {
              type: EventType.RUN_ERROR,
              message: event.message,
              code: event.code ?? undefined,
            };
            return;

          case "response.incomplete": {
            // max_output_tokens or content_filter ended the answer early;
            // without this the partial text looked complete.
            const reason = event.response?.incomplete_details?.reason ?? "incomplete";
            yield truncatedRunError(reason);
            return;
          }

          case "response.failed":
            yield {
              type: EventType.RUN_ERROR,
              message: event.response?.error?.message ?? "Response failed",
              code: event.response?.error?.code ?? undefined,
            };
            return;

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
  },
});
