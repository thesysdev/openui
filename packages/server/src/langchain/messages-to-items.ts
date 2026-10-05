import type { Message } from "@langchain/langgraph-sdk";
import { invalidMessage, jsonValue, type ConversationItem } from "../conversations/append";

function contentOf(message: Message, role: "user" | "assistant"): Record<string, unknown>[] {
  if (typeof message.content === "string") {
    return message.content
      ? [{ type: role === "user" ? "input_text" : "output_text", text: message.content }]
      : [];
  }
  return message.content.map((part) => {
    if (part.type === "text")
      return { type: role === "user" ? "input_text" : "output_text", text: part.text };
    if (part.type === "image_url" && role === "user") {
      const image = typeof part.image_url === "string" ? { url: part.image_url } : part.image_url;
      return { type: "input_image", image_url: image.url, detail: image.detail ?? "auto" };
    }
    return invalidMessage(`LangGraph '${part.type}' content cannot be stored for ${role}`);
  });
}

/** Accept serialized LangGraph SDK messages, including explicit function-call IDs. */
export function langGraphMessagesToItems(messages: Message[]): ConversationItem[] {
  const items: ConversationItem[] = [];
  for (const message of messages) {
    if (message.type === "system") continue;
    if (message.type === "human" || message.type === "ai") {
      const role = message.type === "human" ? "user" : "assistant";
      const content = contentOf(message, role);
      if (content.length) items.push({ type: "message", role, content });
      if (message.type === "ai") {
        if (
          message.invalid_tool_calls?.length ||
          (message.additional_kwargs?.["tool_calls"] && !message.tool_calls?.length)
        ) {
          invalidMessage(
            "LangGraph tool calls must be parsed into valid tool_calls before storage",
          );
        }
        for (const call of message.tool_calls ?? []) {
          if (!call.id || !call.name)
            invalidMessage("LangGraph tool calls require an explicit ID and name");
          items.push({
            type: "function_call",
            call_id: call.id,
            name: call.name,
            arguments: jsonValue(call.args),
          });
        }
      }
    } else if (message.type === "tool") {
      if (!message.tool_call_id) invalidMessage("LangGraph tool results require tool_call_id");
      const output =
        typeof message.content === "string" ? message.content : contentOf(message, "user");
      items.push({ type: "function_call_output", call_id: message.tool_call_id, output });
    } else {
      invalidMessage(`LangGraph '${message.type}' messages cannot be appended to Gateway history`);
    }
  }
  return items;
}
