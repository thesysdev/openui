import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
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
import type { ConversationContentPart, ConversationItem } from "../conversations/types";

// Only openai's types are imported, so the root entry never loads the openai package.

function userContentOf(
  content: ChatCompletionUserMessageParam["content"],
): ResponseInputMessageContentList {
  if (typeof content === "string") {
    return content ? [{ type: "input_text", text: content }] : [];
  }

  const parts: ResponseInputMessageContentList = [];
  for (const part of content) {
    if (part.type === "text" && part.text) {
      parts.push({ type: "input_text", text: part.text });
      continue;
    }
    if (part.type === "image_url" && part.image_url.url) {
      parts.push({
        type: "input_image",
        image_url: part.image_url.url,
        detail: part.image_url.detail ?? "auto",
      });
    }
  }
  return parts;
}

function assistantTextOf(content: ChatCompletionAssistantMessageParam["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("");
}

function toolOutputOf(content: ChatCompletionToolMessageParam["content"]): string {
  if (typeof content === "string") return content;
  return content.map((part) => part.text).join("");
}

/**
 * Tool calls and results paired in the tool messages right after the call. A stopped run
 * leaves calls without results, and model APIs reject every later request in that thread.
 */
function pairedToolCalls(messages: readonly ChatCompletionMessageParam[]): Set<object> {
  const paired = new Set<object>();
  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;
    const open = new Map(
      (message.tool_calls ?? [])
        .filter((call) => call.type === "function" && call.id && call.function.name)
        .map((call) => [call.id, call]),
    );
    for (const next of messages.slice(index + 1)) {
      if (next.role !== "tool") break;
      const call = open.get(next.tool_call_id);
      if (!call) continue;
      open.delete(next.tool_call_id);
      paired.add(call);
      paired.add(next);
    }
  });
  return paired;
}

/** A user message's content: plain text, or parts when it has an image. */
function userMessageContent(
  content: string | ConversationContentPart[],
): ChatCompletionUserMessageParam["content"] {
  if (typeof content === "string") return content;
  if (!content.some((part) => part.type === "input_image")) return content.map(textOf).join("");

  const parts: ChatCompletionContentPart[] = [];
  for (const part of content) {
    if (part.type === "input_image" && typeof part["image_url"] === "string") {
      const detail = part["detail"];
      parts.push({
        type: "image_url",
        image_url: {
          url: part["image_url"],
          ...((detail === "low" || detail === "high" || detail === "auto") && { detail }),
        },
      });
    } else if (textOf(part)) {
      parts.push({ type: "text", text: textOf(part) });
    }
  }
  return parts;
}

/** Chat Completions messages to conversation items and back. */
export class ChatCompletionsConverter extends ConversationItemConverter<ChatCompletionMessageParam> {
  /**
   * Chat Completions messages as Conversations API items. Pass only the new turn. Skips
   * system/developer messages and unpaired tool calls or results.
   */
  toItems(messages: readonly ChatCompletionMessageParam[]): ResponseInputItem[] {
    const items: ResponseInputItem[] = [];
    const paired = pairedToolCalls(messages);

    for (const message of messages) {
      if (message.role === "system" || message.role === "developer") continue;

      if (message.role === "user") {
        const content = userContentOf(message.content);
        if (content.length === 0) continue;
        items.push({
          type: "message",
          role: "user",
          content,
        } satisfies EasyInputMessage);
        continue;
      }

      if (message.role === "assistant") {
        const text = assistantTextOf(message.content);
        if (text) {
          items.push({
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text }],
          } as ResponseInputItem);
        }
        for (const call of message.tool_calls ?? []) {
          if (call.type !== "function" || !paired.has(call)) continue;
          items.push({
            type: "function_call",
            call_id: call.id,
            name: call.function.name,
            arguments: call.function.arguments?.trim() ? call.function.arguments : "{}",
          } satisfies ResponseFunctionToolCall);
        }
        continue;
      }

      if (message.role === "tool") {
        if (!paired.has(message)) continue;
        items.push({
          type: "function_call_output",
          call_id: message.tool_call_id,
          output: toolOutputOf(message.content) || "{}",
        } satisfies ResponseInputItem.FunctionCallOutput);
      }
    }

    return items;
  }

  /**
   * Stored items back to Chat Completions messages. Keeps a tool call only with its result, since
   * Chat Completions rejects either alone; skips other types, such as `reasoning`.
   */
  fromItems(items: readonly ConversationItem[]): ChatCompletionMessageParam[] {
    const paired = pairedCallIds(items);

    const messages: ChatCompletionMessageParam[] = [];
    for (const item of items) {
      if (item.type === "message") {
        if (item.role === "user") {
          const content = userMessageContent(item.content);
          if (content.length > 0) messages.push({ role: "user", content });
        } else if (item.role === "assistant") {
          const text =
            typeof item.content === "string" ? item.content : item.content.map(textOf).join("");
          if (text) messages.push({ role: "assistant", content: text });
        }
      } else if (item.type === "function_call" && paired.has(item.call_id)) {
        const call = {
          id: item.call_id,
          type: "function" as const,
          function: { name: item.name, arguments: item.arguments },
        };
        // A reply's text and its tool calls are one assistant message.
        const last = messages.at(-1);
        if (last?.role === "assistant") (last.tool_calls ??= []).push(call);
        else messages.push({ role: "assistant", content: null, tool_calls: [call] });
      } else if (item.type === "function_call_output" && paired.has(item.call_id)) {
        messages.push({
          role: "tool",
          tool_call_id: item.call_id,
          content: toolOutputText(item.output),
        });
      }
    }
    return messages;
  }
}

/** Converts Chat Completions messages to conversation items and back. */
export const chatCompletionsConverter = new ChatCompletionsConverter();
