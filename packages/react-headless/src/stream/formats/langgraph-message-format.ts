import type { AssistantMessage, Message, ToolMessage, UserMessage } from "../../types";
import type { MessageFormat } from "../../types/messageFormat";

// ── LangGraph / LangChain message types ──────────────────────────

/**
 * LangChain-style message as returned by the LangGraph thread state API.
 * Each message carries a `type` discriminator (`"human"`, `"ai"`, `"tool"`,
 * `"system"`) and uses snake_case field names.
 */
interface LangChainMessage {
  id?: string;
  type: "human" | "ai" | "tool" | "system" | "developer" | (string & {});
  content: string | Array<{ type: string; text?: string }>;
  name?: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown> | string;
  }>;
  tool_call_id?: string;
}

// ── Outbound (AG-UI → LangGraph) ────────────────────────────────

function toLangChainMessage(message: Message): LangChainMessage {
  switch (message.role) {
    case "user":
      return { type: "human", content: message.content ?? "" };

    case "assistant": {
      const result: LangChainMessage = { type: "ai", content: message.content ?? "" };
      if (message.toolCalls?.length) {
        result.tool_calls = message.toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          args: safeParseArgs(tc.function.arguments),
        }));
      }
      return result;
    }

    case "tool":
      return {
        type: "tool",
        content: message.content,
        tool_call_id: message.toolCallId,
      };

    case "system":
      return { type: "system", content: message.content };

    case "developer":
      return { type: "system", content: message.content };

    default:
      return { type: "system", content: "" };
  }
}

// ── Inbound (LangGraph → AG-UI) ────────────────────────────────

function fromLangChainMessage(msg: LangChainMessage): Message {
  const id = msg.id ?? crypto.randomUUID();

  switch (msg.type) {
    case "human":
      return { id, role: "user", content: extractContent(msg.content) } satisfies UserMessage;

    case "ai": {
      const result: AssistantMessage = {
        id,
        role: "assistant",
        content: extractContent(msg.content),
      };
      if (msg.tool_calls?.length) {
        result.toolCalls = msg.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args),
          },
        }));
      }
      return result;
    }

    case "tool":
      return {
        id,
        role: "tool",
        content: extractContent(msg.content),
        toolCallId: msg.tool_call_id ?? "",
      } satisfies ToolMessage;

    case "system":
    case "developer":
      return { id, role: "system", content: extractContent(msg.content) };

    default:
      return { id, role: "system", content: extractContent(msg.content) };
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");
}

function safeParseArgs(args: string): Record<string, unknown> | string {
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch {
    return args;
  }
}

// ── MessageFormat implementation ─────────────────────────────────

/**
 * Converts between AG-UI message format and LangGraph's LangChain-style
 * message format.
 *
 * LangGraph uses `type` discriminators (`"human"`, `"ai"`, `"tool"`,
 * `"system"`) instead of `role`, and tool call arguments are objects
 * rather than JSON strings.
 *
 * AG-UI → LangGraph (toApi):
 *   - Maps `role` to `type` (`"user"` → `"human"`, `"assistant"` → `"ai"`)
 *   - Converts `toolCalls[].function.arguments` from JSON string to object
 *   - Converts `toolCallId` → `tool_call_id`
 *
 * LangGraph → AG-UI (fromApi):
 *   - Maps `type` to `role` (`"human"` → `"user"`, `"ai"` → `"assistant"`)
 *   - Converts tool call `args` object to JSON string
 *   - Generates `id` via `crypto.randomUUID()` if not present
 */
export const langGraphMessageFormat: MessageFormat = {
  toApi(messages: Message[]): LangChainMessage[] {
    return messages.map(toLangChainMessage);
  },

  fromApi(data: unknown): Message[] {
    return (data as LangChainMessage[]).map(fromLangChainMessage);
  },
};

export type { LangChainMessage as LangGraphMessageFormat };
