import type {
  AssistantModelMessage,
  FilePart,
  ModelMessage,
  SystemModelMessage,
  TextPart,
  ToolCallPart,
  ToolModelMessage,
  ToolResultPart,
  UserModelMessage,
} from "ai";
import type {
  AssistantMessage,
  BinaryInputContent,
  InputContent,
  Message,
  ToolCall,
  ToolMessage,
  UserMessage,
} from "../../types";
import type { MessageFormat } from "../../types/messageFormat";

// ── Outbound (AG-UI → Vercel AI ModelMessage[]) ─────────────────

function toVercelUserMessage(message: UserMessage): UserModelMessage {
  const { content } = message;

  if (typeof content === "string") {
    return { role: "user", content };
  }

  const parts: (TextPart | FilePart)[] =
    content?.map((part: InputContent): TextPart | FilePart => {
      if (part.type === "text") {
        return { type: "text", text: part.text };
      }
      const url = part.url ?? `data:${part.mimeType};base64,${part.data ?? ""}`;
      return {
        type: "file",
        data: new URL(url),
        mediaType: part.mimeType,
      };
    }) ?? [];

  return { role: "user", content: parts };
}

function toVercelAssistantMessage(message: AssistantMessage): AssistantModelMessage {
  const parts: (TextPart | ToolCallPart)[] = [];

  if (message.content) {
    parts.push({ type: "text", text: message.content });
  }

  if (message.toolCalls?.length) {
    for (const tc of message.toolCalls) {
      let input: unknown;
      try {
        input = JSON.parse(tc.function.arguments);
      } catch {
        input = {};
      }
      parts.push({
        type: "tool-call",
        toolCallId: tc.id,
        toolName: tc.function.name,
        input,
      });
    }
  }

  return { role: "assistant", content: parts.length ? parts : "" };
}

/**
 * Groups consecutive AG-UI ToolMessages into a single Vercel AI ToolModelMessage.
 * Returns the number of messages consumed so the caller can skip ahead.
 */
function groupToolMessages(
  messages: Message[],
  startIndex: number,
): { message: ToolModelMessage; consumed: number } {
  const results: ToolResultPart[] = [];
  let i = startIndex;

  while (i < messages.length && messages[i]?.role === "tool") {
    const tm = messages[i] as ToolMessage;
    let output: ToolResultPart["output"];
    try {
      output = { type: "json", value: JSON.parse(tm.content) };
    } catch {
      output = { type: "text", value: tm.content };
    }
    results.push({
      type: "tool-result",
      toolCallId: tm.toolCallId,
      toolName: "",
      output,
    });
    i++;
  }

  return {
    message: { role: "tool", content: results },
    consumed: i - startIndex,
  };
}

function toVercelMessages(messages: Message[]): ModelMessage[] {
  const result: ModelMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    switch (msg?.role) {
      case "user":
        result.push(toVercelUserMessage(msg));
        i++;
        break;

      case "assistant":
        result.push(toVercelAssistantMessage(msg));
        i++;
        break;

      case "tool": {
        const { message, consumed } = groupToolMessages(messages, i);
        result.push(message);
        i += consumed;
        break;
      }

      case "system":
        result.push({ role: "system", content: msg.content } as SystemModelMessage);
        i++;
        break;

      case "developer":
        result.push({ role: "system", content: msg.content } as SystemModelMessage);
        i++;
        break;

      default:
        i++;
        break;
    }
  }

  return result;
}

// ── Inbound (Vercel AI ModelMessage[] → AG-UI) ──────────────────

function fromVercelUserMessage(msg: UserModelMessage): UserMessage {
  if (typeof msg.content === "string") {
    return { id: crypto.randomUUID(), role: "user", content: msg.content };
  }

  const content: InputContent[] = msg.content.map((part): InputContent => {
    if (part.type === "text") {
      return { type: "text", text: part.text };
    }
    if (part.type === "file") {
      const url = part.data instanceof URL ? part.data.toString() : undefined;
      const binary: BinaryInputContent = {
        type: "binary",
        mimeType: part.mediaType,
        url,
      };
      return binary;
    }
    // ImagePart → BinaryInputContent
    if (part.type === "image") {
      const url = part.image instanceof URL ? part.image.toString() : undefined;
      return {
        type: "binary",
        mimeType: part.mediaType ?? "image/png",
        url,
      };
    }
    return { type: "text", text: "" };
  });

  return { id: crypto.randomUUID(), role: "user", content };
}

function fromVercelAssistantMessage(msg: AssistantModelMessage): AssistantMessage {
  if (typeof msg.content === "string") {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: msg.content,
    };
  }

  let text = "";
  const toolCalls: ToolCall[] = [];

  for (const part of msg.content) {
    if (part.type === "text") {
      text += part.text;
    } else if (part.type === "tool-call") {
      toolCalls.push({
        id: part.toolCallId,
        type: "function",
        function: {
          name: part.toolName,
          arguments: JSON.stringify(part.input),
        },
      });
    }
  }

  const result: AssistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text || undefined,
  };

  if (toolCalls.length) {
    result.toolCalls = toolCalls;
  }

  return result;
}

function fromVercelToolMessage(msg: ToolModelMessage): ToolMessage[] {
  return msg.content
    .filter((part): part is ToolResultPart => part.type === "tool-result")
    .map((part) => {
      let content: string;
      const { output } = part;
      if (output.type === "text" || output.type === "error-text") {
        content = output.value;
      } else if (output.type === "json" || output.type === "error-json") {
        content = JSON.stringify(output.value);
      } else if (output.type === "execution-denied") {
        content = output.reason ?? "Tool execution denied";
      } else {
        content = "";
      }

      return {
        id: crypto.randomUUID(),
        role: "tool" as const,
        content,
        toolCallId: part.toolCallId,
      };
    });
}

function fromVercelMessage(msg: ModelMessage): Message[] {
  switch (msg.role) {
    case "user":
      return [fromVercelUserMessage(msg)];
    case "assistant":
      return [fromVercelAssistantMessage(msg)];
    case "tool":
      return fromVercelToolMessage(msg);
    case "system":
      return [
        {
          id: crypto.randomUUID(),
          role: "system",
          content: msg.content,
        },
      ];
    default:
      return [];
  }
}

// ── MessageFormat implementation ─────────────────────────────────

/**
 * Converts between AG-UI message format and Vercel AI SDK
 * `ModelMessage` format.
 *
 * Key differences from OpenAI format:
 *   - Tool calls are content parts (`ToolCallPart`) not a separate array
 *   - Tool results are batched in a single `ToolModelMessage` with
 *     multiple `ToolResultPart`s (AG-UI uses one `ToolMessage` per result)
 *   - Arguments are parsed objects (`input`) not JSON strings
 *
 * AG-UI → Vercel AI (toApi):
 *   - Consecutive `ToolMessage`s are grouped into one `ToolModelMessage`
 *   - `toolCalls[].function.arguments` (string) → `JSON.parse` → `input`
 *   - `DeveloperMessage` maps to `system` role (Vercel AI has no developer role)
 *
 * Vercel AI → AG-UI (fromApi):
 *   - Each `ToolResultPart` expands into a separate `ToolMessage`
 *   - `ToolCallPart.input` → `JSON.stringify` → `function.arguments`
 *   - Generates `id` via `crypto.randomUUID()`
 */
export const vercelAIMessageFormat: MessageFormat = {
  toApi(messages: Message[]): ModelMessage[] {
    return toVercelMessages(messages);
  },

  fromApi(data: unknown): Message[] {
    return (data as ModelMessage[]).flatMap(fromVercelMessage);
  },
};
