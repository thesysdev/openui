import type {
  AIMessage,
  BaseMessage,
  HumanMessage,
  MessageContent,
  ToolMessage,
} from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LangGraphHistoryMessage } from "../conversations/types";

// Matched by `type`, not `isInstance`, so the root entry never loads @langchain/core.

const isType = <M extends BaseMessage>(message: BaseMessage, type: string): message is M =>
  message.type === type;

type UserContent = Extract<ChatCompletionMessageParam, { role: "user" }>["content"];

// LangChain's text/image_url content blocks use the Chat Completions shape.
function userContentOf(content: HumanMessage["content"]): UserContent {
  if (typeof content === "string") return content;
  const parts: Exclude<UserContent, string> = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    if (block.type === "text" && typeof block.text === "string") {
      parts.push({ type: "text", text: block.text });
    } else if (block.type === "image_url") {
      const image = block["image_url"];
      if (typeof image === "string") {
        parts.push({ type: "image_url", image_url: { url: image } });
      } else if (
        typeof image === "object" &&
        image !== null &&
        "url" in image &&
        typeof image.url === "string"
      ) {
        const detail = "detail" in image ? image.detail : undefined;
        parts.push({
          type: "image_url",
          image_url: {
            url: image.url,
            detail: detail === "low" || detail === "high" ? detail : "auto",
          },
        });
      }
    }
  }
  return parts;
}

/** A LangGraph turn as Chat Completions messages, without system messages. */
export function langGraphToChatMessages(
  messages: readonly BaseMessage[],
): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];
  for (const message of messages) {
    if (isType<HumanMessage>(message, "human")) {
      result.push({ role: "user", content: userContentOf(message.content) });
    } else if (isType<AIMessage>(message, "ai")) {
      result.push({
        role: "assistant",
        content: message.text,
        tool_calls: (message.tool_calls ?? [])
          .filter((call) => call.id && call.name)
          .map((call) => ({
            type: "function",
            id: call.id!,
            function: {
              name: call.name,
              arguments:
                typeof call.args === "string" ? call.args : JSON.stringify(call.args ?? {}),
            },
          })),
      });
    } else if (isType<ToolMessage>(message, "tool") && message.tool_call_id) {
      result.push({ role: "tool", tool_call_id: message.tool_call_id, content: message.text });
    }
  }
  return result;
}

function argsOf(json: string): Record<string, unknown> {
  try {
    const args: unknown = JSON.parse(json);
    return typeof args === "object" && args !== null && !Array.isArray(args)
      ? (args as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

const stringOf = (content: unknown) => (typeof content === "string" ? content : "");

/** Chat Completions messages as plain `{ role, content }` objects LangGraph's reducer takes. */
export function chatToLangGraphMessages(
  messages: readonly ChatCompletionMessageParam[],
): LangGraphHistoryMessage[] {
  return messages.flatMap((message): LangGraphHistoryMessage[] => {
    if (message.role === "user") {
      return [{ role: "human", content: message.content as MessageContent }];
    }
    if (message.role === "assistant") {
      const toolCalls = (message.tool_calls ?? []).flatMap((call) =>
        call.type === "function"
          ? [
              {
                type: "tool_call" as const,
                id: call.id,
                name: call.function.name,
                args: argsOf(call.function.arguments),
              },
            ]
          : [],
      );
      return [
        {
          role: "ai",
          content: stringOf(message.content),
          ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
        },
      ];
    }
    if (message.role === "tool") {
      return [
        { role: "tool", content: stringOf(message.content), tool_call_id: message.tool_call_id },
      ];
    }
    return [];
  });
}
