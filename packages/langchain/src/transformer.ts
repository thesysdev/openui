import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { ProtocolEvent, StreamTransformer, ToolsEventData } from "@langchain/langgraph";
import { StreamChannel } from "@langchain/langgraph";
import type { ContentBlock, MessagesData } from "@langchain/protocol";

import { createId } from "./id";

const OPENUI_CHANNEL_NAME = "openui";
const OPENUI_CHANNEL_METHOD = `custom:${OPENUI_CHANNEL_NAME}`;

const TOOL_BLOCK_TYPES = new Set([
  "tool_call",
  "tool_call_chunk",
  "server_tool_call",
  "server_tool_call_chunk",
]);

/** Provider-executed tool results (Cloud artifacts, search, MCP). */
const TOOL_RESULT_BLOCK_TYPES = new Set(["server_tool_call_result", "server_tool_result"]);

interface ToolCallState {
  id: string;
  name: string;
  started: boolean;
  ended: boolean;
  argsEmitted: boolean;
  /** Args already emitted as AG-UI deltas — used to diff snapshot-style updates. */
  argsEmittedSoFar: string;
}

/**
 * Projects LangGraph's protocol-v2 `messages` and `tools` streams into AG-UI
 * events and publishes them on the remote `custom:openui` channel.
 *
 * Add the returned factory to an agent's `streamTransformers` array. Remote
 * clients can then subscribe to `custom:openui`, or use {@link streamOpenUI}
 * and {@link createLangChainStreamResponse} to relay that channel as AG-UI
 * Server-Sent Events.
 *
 * Provider-executed Cloud tools (artifacts, search, MCP) never hit LangGraph's
 * `tools` channel. ChatOpenAI surfaces their `function_call_output` as
 * passthrough `provider` events (or occasionally as `server_tool_*_result`
 * content blocks). Those are mapped to `TOOL_CALL_RESULT` here so the browser
 * can render artifact previews live — without waiting for a storage reload.
 */
export function openUIStreamTransformer(): StreamTransformer<{
  openui: StreamChannel<AGUIEvent>;
}> {
  const channel = StreamChannel.remote<AGUIEvent>(OPENUI_CHANNEL_NAME);

  let currentMessageId: string = createId();
  let acceptsCurrentMessage = false;
  let textMessageId: string | undefined;
  let textStarted = false;
  let textEnded = false;
  let runErrorEmitted = false;

  const toolCallsByIndex = new Map<string, ToolCallState>();
  const toolOutputByCallId = new Map<string, string>();
  // Dedup across tools-channel + provider `added`/`done` + content-block paths.
  const emittedToolResultIds = new Set<string>();

  const emit = (event: AGUIEvent) => channel.push(event);

  const ensureTextStart = () => {
    if (textStarted) return;
    textMessageId = currentMessageId;
    emit({
      type: EventType.TEXT_MESSAGE_START,
      messageId: textMessageId,
      role: "assistant",
    });
    textStarted = true;
  };

  const emitTextDelta = (delta: string) => {
    if (!delta) return;
    ensureTextStart();
    emit({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: textMessageId ?? currentMessageId,
      delta,
    });
  };

  const endText = () => {
    if (!textStarted || textEnded) return;
    emit({
      type: EventType.TEXT_MESSAGE_END,
      messageId: textMessageId ?? currentMessageId,
    });
    textEnded = true;
  };

  const syncToolCall = (
    index: number | string,
    block: Partial<ContentBlock> & Record<string, unknown>,
    emitArgs: boolean,
  ): ToolCallState => {
    const key = String(index);
    let state = toolCallsByIndex.get(key);

    if (!state) {
      state = {
        id: getToolCallId(block) ?? `tool-${key}`,
        name: getToolCallName(block) ?? "",
        started: false,
        ended: false,
        argsEmitted: false,
        argsEmittedSoFar: "",
      };
      toolCallsByIndex.set(key, state);
    } else if (!state.started) {
      state.id = getToolCallId(block) ?? state.id;
      state.name = getToolCallName(block) ?? state.name;
    }

    if (state.ended) return state;

    if (!state.started && state.name) {
      emit({
        type: EventType.TOOL_CALL_START,
        toolCallId: state.id,
        toolCallName: state.name,
      });
      state.started = true;
    }

    const args = getArgsString(block);
    if (emitArgs && args && state.started) {
      // ChatOpenAI Responses stream sends the FULL accumulated args string on
      // every block-delta. AG-UI TOOL_CALL_ARGS deltas are append-only, so
      // re-emitting the snapshot would corrupt JSON (and blank Cloud artifact
      // previews that parse artifact_content from args). Emit only the suffix.
      const delta = args.startsWith(state.argsEmittedSoFar)
        ? args.slice(state.argsEmittedSoFar.length)
        : args;
      if (delta) {
        emit({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: state.id,
          delta,
        });
        state.argsEmittedSoFar = args.startsWith(state.argsEmittedSoFar)
          ? args
          : state.argsEmittedSoFar + args;
        state.argsEmitted = true;
      }
    }

    return state;
  };

  const endToolCall = (state: ToolCallState) => {
    if (state.ended || !state.started) return;
    emit({ type: EventType.TOOL_CALL_END, toolCallId: state.id });
    state.ended = true;
  };

  const endAllToolCalls = () => {
    for (const state of toolCallsByIndex.values()) endToolCall(state);
  };

  const endToolCallById = (toolCallId: string) => {
    const state = Array.from(toolCallsByIndex.values()).find(({ id }) => id === toolCallId);
    if (state) endToolCall(state);
  };

  const emitToolResult = (
    toolCallId: string,
    content: string,
    options?: { isError?: boolean; error?: string; messageId?: string },
  ) => {
    if (!toolCallId || emittedToolResultIds.has(toolCallId)) return;
    emittedToolResultIds.add(toolCallId);
    endToolCallById(toolCallId);
    emit({
      type: EventType.TOOL_CALL_RESULT,
      messageId: options?.messageId ?? `tool-result-${toolCallId}`,
      toolCallId,
      content,
      role: "tool",
      ...(options?.isError ? { isError: true, error: options.error ?? content } : {}),
    });
  };

  const emitServerToolResultBlock = (block: Partial<ContentBlock> & Record<string, unknown>) => {
    const toolCallId = getServerToolResultCallId(block);
    if (!toolCallId) return;
    const isError = block.status === "error";
    emitToolResult(toolCallId, serializeToolOutput(block.output), {
      isError,
      ...(isError ? { error: serializeToolOutput(block.output) } : {}),
    });
  };

  const emitProviderFunctionCallOutput = (payload: unknown) => {
    const item = getFunctionCallOutputItem(payload);
    if (!item) return;
    emitToolResult(item.call_id, serializeToolOutput(item.output), {
      messageId: item.id ?? `tool-result-${item.call_id}`,
    });
  };

  const resetMessage = (data: Extract<MessagesData, { event: "message-start" }>) => {
    endAllToolCalls();
    endText();

    currentMessageId = data.id || createId();
    // StreamProtocolMessagesHandler intentionally omits `role` only for live
    // AI model output and attaches its model run id. Replayed human/system/tool
    // messages always carry an explicit role. Requiring that run id keeps the
    // compatibility path from failing open for arbitrary role-less messages.
    const { role: runtimeRole, run_id: runtimeRunId } = data as {
      role?: unknown;
      run_id?: unknown;
    };
    acceptsCurrentMessage =
      runtimeRole === "ai" ||
      runtimeRole === "assistant" ||
      (runtimeRole == null && typeof runtimeRunId === "string" && runtimeRunId.length > 0);
    textMessageId = undefined;
    textStarted = false;
    textEnded = false;
    toolCallsByIndex.clear();
  };

  const processMessages = (data: MessagesData | ProviderMessageEvent) => {
    if (data.event === "message-start") {
      resetMessage(data);
      return;
    }

    if (!acceptsCurrentMessage) return;

    switch (data.event) {
      case "content-block-start": {
        const block = data.content;
        if (isTextBlock(block)) {
          ensureTextStart();
          emitTextDelta(typeof block.text === "string" ? block.text : "");
        } else if (isToolResultBlock(block)) {
          emitServerToolResultBlock(block);
        } else if (isToolBlock(block)) {
          syncToolCall(data.index, block, true);
        }
        return;
      }

      case "content-block-delta": {
        const delta = data.delta;
        if (delta.type === "text-delta") {
          emitTextDelta(typeof delta.text === "string" ? delta.text : "");
        } else if (delta.type === "block-delta") {
          const fields = delta.fields as Partial<ContentBlock> & Record<string, unknown>;
          if (toolCallsByIndex.has(String(data.index)) || isToolBlock(fields)) {
            syncToolCall(data.index, fields, true);
          }
        }
        return;
      }

      case "content-block-finish": {
        const block = data.content;
        if (isToolResultBlock(block)) {
          emitServerToolResultBlock(block);
        } else if (isToolBlock(block)) {
          const state = syncToolCall(data.index, block, false);
          if (!state.argsEmitted) {
            syncToolCall(data.index, block, true);
          }
          endToolCall(state);
        }
        return;
      }

      case "message-finish":
        endAllToolCalls();
        endText();
        return;

      case "error":
        endAllToolCalls();
        emit({ type: EventType.RUN_ERROR, message: data.message });
        runErrorEmitted = true;
        return;

      case "provider":
        // ChatOpenAI's Responses stream maps unknown items (including Cloud
        // function_call_output) to provider passthrough events.
        if (
          data.name === "response.output_item.added" ||
          data.name === "response.output_item.done"
        ) {
          emitProviderFunctionCallOutput(data.payload);
        }
        return;

      default:
        return;
    }
  };

  const processTools = (data: ToolsEventData) => {
    const toolCallId = data.tool_call_id;

    switch (data.event) {
      case "tool-output-delta":
        toolOutputByCallId.set(toolCallId, (toolOutputByCallId.get(toolCallId) ?? "") + data.delta);
        return;

      case "tool-finished": {
        const streamedOutput = toolOutputByCallId.get(toolCallId);
        toolOutputByCallId.delete(toolCallId);
        emitToolResult(toolCallId, serializeToolOutput(data.output, streamedOutput));
        return;
      }

      case "tool-error":
        toolOutputByCallId.delete(toolCallId);
        emitToolResult(toolCallId, data.message, {
          isError: true,
          error: data.message,
        });
        return;

      case "tool-started":
      default:
        return;
    }
  };

  return {
    init: () => ({ openui: channel }),
    process: (event: ProtocolEvent) => {
      // Ignore the events emitted by this transformer to avoid re-entry.
      if (event.method === OPENUI_CHANNEL_METHOD) return true;
      // Do not filter by namespace: DeepAgents emits model and tool events
      // from nested `model_request:*` and `tools:*` namespaces.
      if (event.method === "messages") {
        processMessages(event.params.data as MessagesData | ProviderMessageEvent);
      } else if (event.method === "tools") {
        processTools(event.params.data as ToolsEventData);
      }
      return true;
    },
    finalize: () => {
      endAllToolCalls();
      endText();
    },
    fail: (error) => {
      endAllToolCalls();
      if (!runErrorEmitted) {
        emit({
          type: EventType.RUN_ERROR,
          message: error instanceof Error ? error.message : "LangGraph run failed",
        });
        runErrorEmitted = true;
      }
    },
  };
}

/** ChatOpenAI Responses passthrough — not in MessagesData, but forwarded live. */
interface ProviderMessageEvent {
  event: "provider";
  provider?: string;
  name: string;
  payload: unknown;
}

function serializeToolOutput(output: unknown, streamedOutput?: string): string {
  if (typeof output === "string") return output;
  if (output === undefined && streamedOutput !== undefined) return streamedOutput;
  if (output === undefined) return "";

  try {
    return JSON.stringify(output) ?? String(output);
  } catch {
    return String(output);
  }
}

function isTextBlock(block: Partial<ContentBlock> & Record<string, unknown>): boolean {
  return block.type === "text";
}

function isToolBlock(block: Partial<ContentBlock> & Record<string, unknown>): boolean {
  return typeof block.type === "string" && TOOL_BLOCK_TYPES.has(block.type);
}

function isToolResultBlock(block: Partial<ContentBlock> & Record<string, unknown>): boolean {
  return typeof block.type === "string" && TOOL_RESULT_BLOCK_TYPES.has(block.type);
}

function getToolCallId(block: Partial<ContentBlock> & Record<string, unknown>): string | undefined {
  return typeof block.id === "string" && block.id.length > 0 ? block.id : undefined;
}

function getToolCallName(
  block: Partial<ContentBlock> & Record<string, unknown>,
): string | undefined {
  return typeof block.name === "string" && block.name.length > 0 ? block.name : undefined;
}

function getServerToolResultCallId(
  block: Partial<ContentBlock> & Record<string, unknown>,
): string | undefined {
  // LangChain core uses camelCase; protocol-v2 uses snake_case.
  const camel = block["toolCallId"];
  if (typeof camel === "string" && camel.length > 0) return camel;
  const snake = block["tool_call_id"];
  if (typeof snake === "string" && snake.length > 0) return snake;
  return undefined;
}

function getArgsString(block: Partial<ContentBlock> & Record<string, unknown>): string {
  if (typeof block.args === "string") return block.args;
  if (block.args != null && typeof block.args === "object") return JSON.stringify(block.args);
  return "";
}

function getFunctionCallOutputItem(
  payload: unknown,
): { call_id: string; output: unknown; id?: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const item = (payload as { item?: unknown }).item;
  if (typeof item !== "object" || item === null) return null;
  const record = item as { type?: unknown; call_id?: unknown; output?: unknown; id?: unknown };
  if (record.type !== "function_call_output") return null;
  if (typeof record.call_id !== "string" || record.call_id.length === 0) return null;
  return {
    call_id: record.call_id,
    output: record.output,
    ...(typeof record.id === "string" && record.id.length > 0 ? { id: record.id } : {}),
  };
}
