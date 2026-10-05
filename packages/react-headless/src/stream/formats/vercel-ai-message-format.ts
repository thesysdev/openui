import type { DynamicToolUIPart, UIMessage } from "ai";
import type { InputContent, Message, ToolCall, ToolMessage, UserMessage } from "../../types";
import type { MessageFormat } from "../../types/messageFormat";

const PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE =
  "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.";

type UnknownRecord = Record<string, unknown> & {
  data?: unknown;
  errorText?: unknown;
  filename?: unknown;
  id?: unknown;
  input?: unknown;
  mediaType?: unknown;
  mimeType?: unknown;
  output?: unknown;
  parts?: unknown;
  providerExecuted?: unknown;
  role?: unknown;
  source?: unknown;
  state?: unknown;
  text?: unknown;
  toolCallId?: unknown;
  toolName?: unknown;
  type?: unknown;
  url?: unknown;
  value?: unknown;
};

type ValidUIMessage = UnknownRecord & {
  id: string;
  role: "system" | "user" | "assistant";
  parts: unknown[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isProviderExecuted(value: unknown): boolean {
  return isRecord(value) && value.providerExecuted === true;
}

function serialize(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function parseToolInput(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function dataUrl(mediaType: string, data: string): string {
  return `data:${mediaType};base64,${data}`;
}

function mediaTypeForPart(part: UnknownRecord, source: UnknownRecord): string {
  if (typeof source.mimeType === "string") return source.mimeType;

  switch (part.type) {
    case "image":
      return "image/*";
    case "audio":
      return "audio/*";
    case "video":
      return "video/*";
    default:
      return "application/octet-stream";
  }
}

function toUserParts(content: UserMessage["content"]): UIMessage["parts"] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  if (!Array.isArray(content)) return [];

  return content.flatMap((part): UIMessage["parts"] => {
    if (!isRecord(part)) return [];

    if (part.type === "text" && typeof part.text === "string") {
      return [{ type: "text", text: part.text }];
    }

    if (part.type === "binary") {
      const mediaType =
        typeof part.mimeType === "string" ? part.mimeType : "application/octet-stream";
      const url =
        typeof part.url === "string"
          ? part.url
          : typeof part.data === "string"
            ? dataUrl(mediaType, part.data)
            : undefined;

      if (!url) return [];

      return [
        {
          type: "file",
          mediaType,
          url,
          ...(typeof part.filename === "string" ? { filename: part.filename } : {}),
        },
      ];
    }

    switch (part.type) {
      case "image":
      case "audio":
      case "video":
      case "document": {
        if (!isRecord(part.source) || typeof part.source.value !== "string") return [];

        const mediaType = mediaTypeForPart(part, part.source);
        const url =
          part.source.type === "data"
            ? dataUrl(mediaType, part.source.value)
            : part.source.type === "url"
              ? part.source.value
              : undefined;

        return url ? [{ type: "file", mediaType, url }] : [];
      }
      default:
        return [];
    }
  });
}

function toToolPart(toolCall: ToolCall, result: ToolMessage | undefined): DynamicToolUIPart {
  if (isProviderExecuted(toolCall) || isProviderExecuted(result)) {
    throw new Error(PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE);
  }

  const input = parseToolInput(toolCall.function.arguments);

  if (result?.error) {
    return {
      type: "dynamic-tool",
      toolName: toolCall.function.name,
      toolCallId: toolCall.id,
      state: "output-error",
      input,
      errorText: result.error,
    };
  }

  if (result) {
    return {
      type: "dynamic-tool",
      toolName: toolCall.function.name,
      toolCallId: toolCall.id,
      state: "output-available",
      input,
      output: result.content,
    };
  }

  return {
    type: "dynamic-tool",
    toolName: toolCall.function.name,
    toolCallId: toolCall.id,
    state: "input-available",
    input,
  };
}

function toVercelMessages(messages: Message[]): UIMessage[] {
  const toolResults = new Map<string, ToolMessage>();

  for (const message of messages) {
    if (message.role === "tool") toolResults.set(message.toolCallId, message);
  }

  const result: UIMessage[] = [];

  for (const message of messages) {
    switch (message.role) {
      case "user":
        result.push({ id: message.id, role: "user", parts: toUserParts(message.content) });
        break;

      case "assistant": {
        const parts: UIMessage["parts"] = [];

        if (typeof message.content === "string" && message.content.length > 0) {
          parts.push({ type: "text", text: message.content });
        }

        for (const toolCall of message.toolCalls ?? []) {
          parts.push(toToolPart(toolCall, toolResults.get(toolCall.id)));
        }

        result.push({ id: message.id, role: "assistant", parts });
        break;
      }

      case "system":
      case "developer":
        result.push({
          id: message.id,
          role: "system",
          parts: [{ type: "text", text: message.content }],
        });
        break;

      // Vercel UIMessage has no standalone tool-result, reasoning, or activity role.
      // Tool results were folded into their matching assistant parts above.
      default:
        break;
    }
  }

  return result;
}

function validUIMessage(value: unknown): value is ValidUIMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "system" || value.role === "user" || value.role === "assistant") &&
    Array.isArray(value.parts)
  );
}

function textFromParts(parts: unknown[]): string {
  return parts
    .filter(
      (part): part is UnknownRecord & { type: "text"; text: string } =>
        isRecord(part) && part.type === "text" && typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("");
}

function binaryFromFilePart(part: UnknownRecord): InputContent | undefined {
  if (part.type !== "file" || typeof part.mediaType !== "string" || typeof part.url !== "string") {
    return undefined;
  }

  const base64Prefix = `data:${part.mediaType};base64,`;
  const source = part.url.startsWith(base64Prefix)
    ? { data: part.url.slice(base64Prefix.length) }
    : { url: part.url };

  return {
    type: "binary",
    mimeType: part.mediaType,
    ...source,
    ...(typeof part.filename === "string" ? { filename: part.filename } : {}),
  };
}

function fromVercelUser(message: ValidUIMessage): UserMessage {
  const contentParts: InputContent[] = [];
  let hasFile = false;

  for (const part of message.parts) {
    if (!isRecord(part)) continue;

    if (part.type === "text" && typeof part.text === "string") {
      contentParts.push({ type: "text", text: part.text });
      continue;
    }

    const binary = binaryFromFilePart(part);
    if (binary) {
      hasFile = true;
      contentParts.push(binary);
    }
  }

  return {
    id: message.id,
    role: "user",
    content: hasFile ? contentParts : textFromParts(message.parts),
  };
}

function toolName(part: UnknownRecord): string | undefined {
  if (part.type === "dynamic-tool") {
    return typeof part.toolName === "string" && part.toolName.length > 0
      ? part.toolName
      : undefined;
  }

  if (typeof part.type !== "string" || !part.type.startsWith("tool-")) return undefined;
  const name = part.type.slice("tool-".length);
  return name || undefined;
}

function hasOwn(record: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function toolResultFromPart(part: UnknownRecord): ToolMessage | undefined {
  if (typeof part.toolCallId !== "string") return undefined;

  if (part.state === "output-available" && hasOwn(part, "output")) {
    return {
      id: `tool-result-${part.toolCallId}`,
      role: "tool",
      toolCallId: part.toolCallId,
      content: serialize(part.output),
    };
  }

  if (part.state === "output-error" && typeof part.errorText === "string") {
    return {
      id: `tool-result-${part.toolCallId}`,
      role: "tool",
      toolCallId: part.toolCallId,
      content: part.errorText,
      error: part.errorText,
    };
  }

  if (part.state === "output-denied") {
    const error = "Tool execution was denied";
    return {
      id: `tool-result-${part.toolCallId}`,
      role: "tool",
      toolCallId: part.toolCallId,
      content: error,
      error,
    };
  }

  return undefined;
}

function appendAssistantSegments(message: ValidUIMessage, result: Message[]): void {
  let segmentIndex = 0;
  let segmentStarted = false;
  let text = "";
  let toolCalls: ToolCall[] = [];
  let toolResults: ToolMessage[] = [];
  const hasStepMarkers = message.parts.some((part) => isRecord(part) && part.type === "step-start");

  const hasBody = () => text.length > 0 || toolCalls.length > 0;

  const flush = (force = false) => {
    if (!force && !segmentStarted) return;

    segmentIndex += 1;
    result.push({
      id: segmentIndex === 1 ? message.id : `${message.id}-segment-${segmentIndex}`,
      role: "assistant",
      ...(text ? { content: text } : {}),
      ...(toolCalls.length ? { toolCalls } : {}),
    });
    result.push(...toolResults);

    text = "";
    toolCalls = [];
    toolResults = [];
    segmentStarted = false;
  };

  for (const value of message.parts) {
    if (!isRecord(value)) continue;

    if (value.type === "step-start") {
      if (hasBody()) flush();
      continue;
    }

    if (value.type === "text" && typeof value.text === "string") {
      // AI SDK step markers are authoritative. Older/custom UIMessage data may
      // omit them, so retain the previous text-part boundary behavior there.
      // Text after tool calls is always a new item (commentary between calls,
      // then the answer), matching the live adapter.
      if (toolCalls.length > 0 || (!hasStepMarkers && hasBody())) flush();
      segmentStarted = true;
      text += value.text;
      continue;
    }

    const name = toolName(value);
    if (!name || typeof value.toolCallId !== "string") continue;

    if (value.providerExecuted === true) {
      throw new Error(PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE);
    }

    segmentStarted = true;
    toolCalls.push({
      id: value.toolCallId,
      type: "function",
      function: {
        name,
        arguments: hasOwn(value, "input") ? serialize(value.input) : "",
      },
    });

    const toolResult = toolResultFromPart(value);
    if (toolResult) toolResults.push(toolResult);
  }

  // AI SDK permits an assistant UIMessage with no parts. Preserve it as one
  // empty assistant rather than dropping the source message entirely.
  flush(segmentIndex === 0);
}

function fromVercelMessages(data: unknown): Message[] {
  if (!Array.isArray(data)) return [];

  const result: Message[] = [];

  for (const value of data) {
    if (!validUIMessage(value)) continue;
    const message = value;

    if (message.role === "user") {
      result.push(fromVercelUser(message));
      continue;
    }

    const text = textFromParts(message.parts);

    if (message.role === "system") {
      result.push({ id: message.id, role: "system", content: text });
      continue;
    }

    appendAssistantSegments(message, result);
  }

  return result;
}

/**
 * Converts messages between AG-UI and Vercel AI SDK v6 and v7 `UIMessage` format.
 *
 * AG-UI tool-result messages are folded into the matching assistant tool part,
 * because `UIMessage` represents a tool invocation and its result as one part.
 * Outbound tool calls use `dynamic-tool` parts because AG-UI messages do not
 * carry the static tool schema needed to select a `tool-${name}` part. Inbound
 * conversion accepts both dynamic and static tool parts.
 *
 * Vercel `UIMessage` has no developer role, so both AG-UI system and developer
 * messages map to its system role.
 *
 * Provider-executed tools are rejected because the AG-UI message model has no
 * execution-provenance field and therefore cannot preserve their requirement
 * that results remain in the assistant message.
 */
export const vercelAIMessageFormat: MessageFormat = {
  toApi(messages: Message[]): UIMessage[] {
    return toVercelMessages(messages);
  },

  fromApi(data: unknown): Message[] {
    return fromVercelMessages(data);
  },
};
