import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import type { AssistantMessage, Message, ToolMessage, UserMessage } from "../../types";
import type { MessageFormat } from "../../types/messageFormat";

// ── Outbound (AG-UI → OpenAI Completions) ───────────────────────

function toOpenAIUserMessage(message: UserMessage): ChatCompletionUserMessageParam {
  const content = message.content;

  if (typeof content === "string") {
    return { role: "user", content };
  }

  const parts: ChatCompletionUserMessageParam["content"] =
    content?.map((part) => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      if (part.type === "binary") {
        const url = part.url ?? `data:${part.mimeType};base64,${part.data ?? ""}`;
        return { type: "image_url" as const, image_url: { url } };
      }
      return { type: "text" as const, text: "" };
    }) ?? [];

  return { role: "user", content: parts };
}

function toOpenAIAssistantMessage(message: AssistantMessage): ChatCompletionAssistantMessageParam {
  const result: ChatCompletionAssistantMessageParam = {
    role: "assistant",
    content: message.content ?? null,
  };

  if (message.toolCalls?.length) {
    result.tool_calls = message.toolCalls.map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));
  }

  return result;
}

function toOpenAIToolMessage(message: ToolMessage): ChatCompletionToolMessageParam {
  return {
    role: "tool",
    content: message.content,
    tool_call_id: message.toolCallId,
  };
}

function toOpenAI(message: Message): ChatCompletionMessageParam {
  switch (message.role) {
    case "user":
      return toOpenAIUserMessage(message);
    case "assistant":
      return toOpenAIAssistantMessage(message);
    case "tool":
      return toOpenAIToolMessage(message);
    case "system":
      return { role: "system", content: message.content };
    case "developer":
      return { role: "developer", content: message.content };
    default:
      // reasoning, activity — map to system as fallback
      return { role: "system", content: "" };
  }
}

// ── Inbound (OpenAI Completions → AG-UI) ────────────────────────

function fromOpenAIAssistant(msg: ChatCompletionAssistantMessageParam): AssistantMessage {
  const content = typeof msg.content === "string" ? msg.content : undefined;

  const result: AssistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
  };

  if (msg.tool_calls?.length) {
    result.toolCalls = msg.tool_calls
      .filter((tc): tc is Extract<typeof tc, { type: "function" }> => tc.type === "function")
      .map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
  }

  return result;
}

function fromOpenAIUser(msg: ChatCompletionUserMessageParam): UserMessage {
  if (typeof msg.content === "string") {
    return { id: crypto.randomUUID(), role: "user", content: msg.content };
  }

  const content = msg.content.map((part): { type: "text"; text: string } => {
    if (part.type === "text") return { type: "text", text: part.text };
    return { type: "text", text: "" };
  });

  return { id: crypto.randomUUID(), role: "user", content };
}

function fromOpenAITool(msg: ChatCompletionToolMessageParam): ToolMessage {
  const content =
    typeof msg.content === "string" ? msg.content : msg.content.map((p) => p.text).join("");

  return {
    id: crypto.randomUUID(),
    role: "tool",
    content,
    toolCallId: msg.tool_call_id,
  };
}

function fromOpenAI(data: ChatCompletionMessageParam): Message {
  switch (data.role) {
    case "user":
      return fromOpenAIUser(data);
    case "assistant":
      return fromOpenAIAssistant(data);
    case "tool":
      return fromOpenAITool(data);
    case "system":
      return {
        id: crypto.randomUUID(),
        role: "system",
        content: typeof data.content === "string" ? data.content : "",
      };
    case "developer":
      return {
        id: crypto.randomUUID(),
        role: "developer",
        content: typeof data.content === "string" ? data.content : "",
      };
    default:
      return { id: crypto.randomUUID(), role: "system", content: "" };
  }
}

// ── MessageFormat implementation ─────────────────────────────────

/**
 * Converts between AG-UI message format and OpenAI **Chat Completions**
 * message format (`ChatCompletionMessageParam`).
 *
 * This is a 1-to-1 mapping — each AG-UI message becomes exactly one
 * `ChatCompletionMessageParam` and vice versa.
 *
 * AG-UI → OpenAI (toApi):
 *   - Strips `id` (OpenAI doesn't use message IDs)
 *   - Converts `toolCalls` → `tool_calls`
 *   - Converts `toolCallId` → `tool_call_id`
 *   - Converts multipart `content` arrays to OpenAI content format
 *
 * OpenAI → AG-UI (fromApi):
 *   - Generates `id` via `crypto.randomUUID()`
 *   - Converts `tool_calls` → `toolCalls`
 *   - Converts `tool_call_id` → `toolCallId`
 */
export const openAIMessageFormat: MessageFormat = {
  toApi(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map(toOpenAI);
  },

  fromApi(data: unknown): Message[] {
    return (data as ChatCompletionMessageParam[]).map(fromOpenAI);
  },
};
