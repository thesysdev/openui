import type {
  AIMessage,
  BaseMessage,
  HumanMessage,
  MessageContent,
  ToolMessage,
} from "@langchain/core/messages";
import type {
  EasyInputMessage,
  ResponseFunctionToolCall,
  ResponseInputItem,
  ResponseInputMessageContentList,
} from "openai/resources/responses/responses";
import {
  ConversationItemConverter,
  pairedCallIds,
  textOf,
  toolOutputText,
} from "../conversations/converter";
import type {
  ConversationContentPart,
  ConversationItem,
  LangGraphHistoryMessage,
} from "../conversations/types";
import { isRecord } from "../core/guards";

// Matched by `type`, not `isInstance`, so the root entry never loads @langchain/core.

const isType = <M extends BaseMessage>(message: BaseMessage, type: string): message is M =>
  message.type === type;

type ImageDetail = "low" | "high" | "auto";

const detailOf = (detail: unknown): ImageDetail =>
  detail === "low" || detail === "high" ? detail : "auto";

/** A human message's text and image blocks as input parts. */
function inputPartsOf(content: HumanMessage["content"]): ResponseInputMessageContentList {
  if (typeof content === "string") return content ? [{ type: "input_text", text: content }] : [];
  const parts: ResponseInputMessageContentList = [];
  for (const block of content) {
    if (!isRecord(block)) continue;
    if (block["type"] === "text" && typeof block["text"] === "string" && block["text"]) {
      parts.push({ type: "input_text", text: block["text"] });
    } else if (block["type"] === "image_url") {
      const image = block["image_url"];
      const url = typeof image === "string" ? image : isRecord(image) ? image["url"] : undefined;
      if (typeof url !== "string" || !url) continue;
      const detail = detailOf(isRecord(image) ? image["detail"] : undefined);
      parts.push({ type: "input_image", image_url: url, detail });
    }
  }
  return parts;
}

/** A stored user message as LangChain content: text, or blocks when it has an image. */
function humanContentOf(content: string | ConversationContentPart[]): MessageContent {
  if (typeof content === "string") return content;
  if (!content.some((part) => part.type === "input_image")) return content.map(textOf).join("");
  return content.flatMap((part): Exclude<MessageContent, string> => {
    if (part.type === "input_image" && typeof part["image_url"] === "string") {
      const detail = part["detail"];
      return [
        {
          type: "image_url",
          image_url: {
            url: part["image_url"],
            ...((detail === "low" || detail === "high" || detail === "auto") && { detail }),
          },
        },
      ];
    }
    return textOf(part) ? [{ type: "text", text: textOf(part) }] : [];
  });
}

function argsOf(json: string): Record<string, unknown> {
  try {
    const args: unknown = JSON.parse(json);
    return isRecord(args) ? args : {};
  } catch {
    return {};
  }
}

/** LangChain messages to conversation items and back. */
export class LangGraphConverter extends ConversationItemConverter<
  BaseMessage,
  LangGraphHistoryMessage
> {
  /**
   * LangChain messages as Conversations API items. Pass only the new turn. Skips system
   * messages, and tool calls or results without their pair.
   */
  toItems(messages: readonly BaseMessage[]): ResponseInputItem[] {
    const calls = new Set<string>();
    const results = new Set<string>();
    for (const message of messages) {
      if (isType<AIMessage>(message, "ai")) {
        for (const call of message.tool_calls ?? []) if (call.id && call.name) calls.add(call.id);
      } else if (isType<ToolMessage>(message, "tool") && message.tool_call_id) {
        results.add(message.tool_call_id);
      }
    }

    const items: ResponseInputItem[] = [];
    for (const message of messages) {
      if (isType<HumanMessage>(message, "human")) {
        const content = inputPartsOf(message.content);
        if (content.length > 0) {
          items.push({ type: "message", role: "user", content } satisfies EasyInputMessage);
        }
      } else if (isType<AIMessage>(message, "ai")) {
        if (message.text) {
          items.push({
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: message.text }],
          } as ResponseInputItem);
        }
        for (const call of message.tool_calls ?? []) {
          if (!call.id || !call.name || !results.has(call.id)) continue;
          items.push({
            type: "function_call",
            call_id: call.id,
            name: call.name,
            arguments: typeof call.args === "string" ? call.args : JSON.stringify(call.args ?? {}),
          } satisfies ResponseFunctionToolCall);
        }
      } else if (isType<ToolMessage>(message, "tool") && calls.has(message.tool_call_id)) {
        items.push({
          type: "function_call_output",
          call_id: message.tool_call_id,
          output: message.text || "{}",
        } satisfies ResponseInputItem.FunctionCallOutput);
      }
    }
    return items;
  }

  /**
   * Stored items as plain `{ role, content }` messages that `graph.invoke` takes. Keeps a tool
   * call only with its result; skips other types, such as `reasoning`.
   */
  fromItems(items: readonly ConversationItem[]): LangGraphHistoryMessage[] {
    const paired = pairedCallIds(items);
    const messages: LangGraphHistoryMessage[] = [];
    for (const item of items) {
      if (item.type === "message" && item.role === "user") {
        const content = humanContentOf(item.content);
        if (content.length > 0) messages.push({ role: "human", content });
      } else if (item.type === "message" && item.role === "assistant") {
        const text =
          typeof item.content === "string" ? item.content : item.content.map(textOf).join("");
        if (text) messages.push({ role: "ai", content: text });
      } else if (item.type === "function_call" && paired.has(item.call_id)) {
        const call = {
          type: "tool_call" as const,
          id: item.call_id,
          name: item.name,
          args: argsOf(item.arguments),
        };
        // A reply's text and its tool calls are one AI message.
        const last = messages.at(-1);
        if (last?.role === "ai") (last.tool_calls ??= []).push(call);
        else messages.push({ role: "ai", content: "", tool_calls: [call] });
      } else if (item.type === "function_call_output" && paired.has(item.call_id)) {
        messages.push({
          role: "tool",
          content: toolOutputText(item.output),
          tool_call_id: item.call_id,
        });
      }
    }
    return messages;
  }
}

/** Converts LangChain messages to conversation items and back. */
export const langGraphConverter = new LangGraphConverter();
