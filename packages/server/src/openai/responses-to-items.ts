import type { ResponseInputItem, ResponseOutputItem } from "openai/resources/responses/responses";
import { invalidMessage, type ConversationItem } from "../conversations/append";

// Types accepted by the Gateway Conversations endpoint. References and unsupported
// provider tools must not become empty or misleading history entries.
const itemTypes = new Set([
  "function_call",
  "function_call_output",
  "web_search_call",
  "mcp_list_tools",
  "mcp_approval_request",
  "mcp_approval_response",
  "mcp_call",
  "reasoning",
]);

export function responsesToItems(
  messages: (ResponseInputItem | ResponseOutputItem)[],
): ConversationItem[] {
  const items: ConversationItem[] = [];
  for (const message of messages) {
    if ("role" in message && (message.role === "system" || message.role === "developer")) continue;
    const type = message.type ?? "message";
    if (type !== "message" && !itemTypes.has(type)) {
      invalidMessage(`Responses item type '${type}' cannot be appended to Gateway history`);
    }
    // Gateway assigns new item IDs; output item IDs belong to the source response.
    const item = { ...message } as unknown as ConversationItem;
    delete item["id"];
    if (type === "message") {
      if (item["role"] !== "user" && item["role"] !== "assistant") {
        invalidMessage("Responses history messages require a user or assistant role");
      }
      // EasyInputMessage permits shorthand text; normalize it to the wire content type.
      if (typeof item["content"] === "string") {
        item["content"] = [
          { type: item["role"] === "user" ? "input_text" : "output_text", text: item["content"] },
        ];
      }
    }
    items.push({ ...item, type });
  }
  return items;
}
