import type {
  ChatCompletionAssistantMessageParam,
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
 * Break Chat Completions messages into Conversations API items.
 * Pass the new turn, not the full replay, or items will be duplicated.
 * System / developer messages are skipped (instructions, not history).
 */
export function messagesToItems(messages: ChatCompletionMessageParam[]): ResponseInputItem[] {
  const items: ResponseInputItem[] = [];

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
        if (call.type !== "function") continue;
        if (!call.id || !call.function.name) continue;
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
      if (!message.tool_call_id) continue;
      items.push({
        type: "function_call_output",
        call_id: message.tool_call_id,
        output: toolOutputOf(message.content) || "{}",
      } satisfies ResponseInputItem.FunctionCallOutput);
    }
  }

  return items;
}
