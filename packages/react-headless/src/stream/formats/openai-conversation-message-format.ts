import type { Message as ConversationMessage } from "openai/resources/conversations/conversations";
import type { ConversationItem } from "openai/resources/conversations/items";
import type {
  EasyInputMessage,
  ResponseFunctionToolCall,
  ResponseFunctionToolCallOutputItem,
  ResponseInputItem,
  ResponseInputMessageContentList,
} from "openai/resources/responses/responses";
import type { AssistantMessage, Message, ToolMessage, UserMessage } from "../../types";
import type { MessageFormat } from "../../types/messageFormat";

// ── Outbound (AG-UI → OpenAI Responses/Conversations input) ─────

/**
 * Both the Responses API and the Conversations API accept
 * `ResponseInputItem[]` as input, so a single outbound conversion
 * works for both.
 *
 * Tool calls are *sibling items* of the assistant message, not nested
 * inside it.  We flatten each AG-UI assistant message into:
 *   1. An `EasyInputMessage` with `role: "assistant"` (text part)
 *   2. One `ResponseFunctionToolCall` per tool call
 *
 * Tool result messages become `FunctionCallOutput` items.
 */
function toItems(message: Message): ResponseInputItem[] {
  switch (message.role) {
    case "user":
      return [toInputMessage(message)];

    case "assistant": {
      const items: ResponseInputItem[] = [];

      if (message.content) {
        items.push({
          role: "assistant",
          content: message.content,
          type: "message",
        } satisfies EasyInputMessage);
      }

      if (message.toolCalls?.length) {
        for (const tc of message.toolCalls) {
          items.push({
            type: "function_call",
            call_id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          } satisfies ResponseFunctionToolCall);
        }
      }

      return items;
    }

    case "tool":
      return [
        {
          type: "function_call_output",
          call_id: message.toolCallId,
          output: message.content,
        } as ResponseInputItem,
      ];

    case "system":
      return [
        { role: "system", content: message.content, type: "message" } satisfies EasyInputMessage,
      ];

    case "developer":
      return [
        { role: "developer", content: message.content, type: "message" } satisfies EasyInputMessage,
      ];

    default:
      return [];
  }
}

function toInputMessage(message: UserMessage): EasyInputMessage {
  const content = message.content;

  if (typeof content === "string") {
    return { role: "user", content, type: "message" };
  }

  const parts: ResponseInputMessageContentList =
    content?.map((part) => {
      if (part.type === "text") {
        return { type: "input_text" as const, text: part.text };
      }
      if (part.type === "binary") {
        const url = part.url ?? `data:${part.mimeType};base64,${part.data ?? ""}`;
        return { type: "input_image" as const, image_url: url, detail: "auto" as const };
      }
      return { type: "input_text" as const, text: "" };
    }) ?? [];

  return { role: "user", content: parts, type: "message" };
}

// ── Inbound (OpenAI Conversations/Responses → AG-UI) ────────────

/**
 * Converts `ConversationItem[]` (from the Conversations API) or
 * `ResponseItem[]` (from the Responses API) into AG-UI `Message[]`.
 *
 * Both APIs return items as a flat list with `type` discriminator:
 *   - `"message"` → user / assistant / system / developer / tool message
 *   - `"function_call"` → tool call (grouped into the preceding assistant)
 *   - `"function_call_output"` → tool result
 *
 * The Conversations API `Message` type is a superset that also handles
 * `reasoning_text`, `summary_text`, and `text` content parts, as well
 * as additional roles like `tool` and `critic`.
 */
function fromItems(items: ConversationItem[]): Message[] {
  const messages: Message[] = [];
  let currentAssistant: AssistantMessage | null = null;

  for (const item of items) {
    switch (item.type) {
      case "message": {
        // Flush any pending assistant message
        if (currentAssistant) {
          messages.push(currentAssistant);
          currentAssistant = null;
        }

        const msg = item as ConversationMessage;

        if (msg.role === "assistant") {
          currentAssistant = {
            id: msg.id,
            role: "assistant",
            content: extractTextContent(msg) || undefined,
          };
        } else if (msg.role === "tool") {
          // Conversations API can have tool messages with type: "message"
          messages.push({
            id: msg.id,
            role: "tool",
            content: extractTextContent(msg),
            toolCallId: "",
          } as ToolMessage);
        } else if (msg.role === "user") {
          messages.push(fromUserMessage(msg));
        } else {
          // system / developer / unknown / critic / discriminator
          const role = msg.role === "developer" ? "developer" : "system";
          messages.push({
            id: msg.id,
            role,
            content: extractTextContent(msg),
          } as Message);
        }
        break;
      }

      case "function_call": {
        const tc = item as { id?: string; call_id: string; name: string; arguments: string };

        if (!currentAssistant) {
          currentAssistant = { id: crypto.randomUUID(), role: "assistant" };
        }

        currentAssistant = {
          ...currentAssistant,
          toolCalls: [
            ...(currentAssistant.toolCalls ?? []),
            {
              id: tc.call_id,
              type: "function" as const,
              function: { name: tc.name, arguments: tc.arguments },
            },
          ],
        };
        break;
      }

      case "function_call_output": {
        if (currentAssistant) {
          messages.push(currentAssistant);
          currentAssistant = null;
        }

        const output = item as ResponseFunctionToolCallOutputItem;
        messages.push({
          id: output.id,
          role: "tool",
          content:
            typeof output.output === "string" ? output.output : JSON.stringify(output.output),
          toolCallId: output.call_id,
        } as ToolMessage);
        break;
      }

      default:
        // file_search, web_search, computer_call, reasoning, etc. — skip
        break;
    }
  }

  if (currentAssistant) {
    messages.push(currentAssistant);
  }

  return messages;
}

/**
 * Extract text content from a Conversations API `Message`.
 *
 * Handles the full content union:
 *   - `output_text` (assistant output)
 *   - `input_text` (user/system/developer input)
 *   - `text` (generic text)
 *   - `summary_text`, `reasoning_text` (appended)
 *   - `refusal` (mapped to text)
 */
function extractTextContent(msg: ConversationMessage): string {
  return msg.content
    .map((part) => {
      switch (part.type) {
        case "output_text":
          return part.text;
        case "input_text":
          return part.text;
        case "text":
          return part.text;
        case "summary_text":
          return part.text;
        case "reasoning_text":
          return part.text;
        case "refusal":
          return `[Refusal]: ${part.refusal}`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("");
}

function fromUserMessage(msg: ConversationMessage): UserMessage {
  // Check if content has images/files — if so, use multipart
  const hasMedia = msg.content.some(
    (part) => part.type === "input_image" || part.type === "input_file",
  );

  if (!hasMedia) {
    return { id: msg.id, role: "user", content: extractTextContent(msg) };
  }

  const parts = msg.content.map(
    (part): { type: "text"; text: string } | { type: "binary"; url: string; mimeType: string } => {
      if (part.type === "input_text" || part.type === "text") {
        return { type: "text", text: part.text };
      }
      if (part.type === "input_image" && part.image_url) {
        return { type: "binary", url: part.image_url, mimeType: "image/*" };
      }
      return { type: "text", text: "" };
    },
  );

  return { id: msg.id, role: "user", content: parts };
}

// ── MessageFormat implementation ─────────────────────────────────

/**
 * Converts between AG-UI message format and OpenAI's item-based format,
 * compatible with both the **Responses API** and **Conversations API**.
 *
 * AG-UI → OpenAI (toApi):
 *   - Returns `ResponseInputItem[]` — works for both `responses.create({ input })`
 *     and `conversations.items.create({ items })`
 *   - Flattens assistant messages: text → `EasyInputMessage`, tool calls → `ResponseFunctionToolCall`
 *
 * OpenAI → AG-UI (fromApi):
 *   - Accepts `ConversationItem[]` (or `ResponseItem[]`, which is a subset)
 *   - Groups adjacent assistant messages + function_calls into `AssistantMessage`
 *   - Handles Conversations-specific content types (`reasoning_text`, `summary_text`, etc.)
 */
export const openAIConversationMessageFormat: MessageFormat = {
  toApi(messages: Message[]): ResponseInputItem[] {
    return messages.flatMap(toItems);
  },

  fromApi(data: unknown): Message[] {
    return fromItems(data as ConversationItem[]);
  },
};
