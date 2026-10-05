import type { UIMessage } from "ai";
import { invalidMessage, jsonValue, type ConversationItem } from "../conversations/append";

/** Store completed UI messages, preserving text/tool ordering across model steps. */
export function vercelMessagesToItems(messages: UIMessage[]): ConversationItem[] {
  const items: ConversationItem[] = [];
  for (const message of messages) {
    if (message.role === "system") continue;
    let content: Record<string, unknown>[] = [];
    const flush = () => {
      if (content.length) items.push({ type: "message", role: message.role, content });
      content = [];
    };
    for (const part of message.parts) {
      if (part.type === "text") {
        if (part.state === "streaming")
          invalidMessage("Append completed text, not streaming UI message parts");
        content.push({
          type: message.role === "user" ? "input_text" : "output_text",
          text: part.text,
        });
      } else if (part.type === "file" && message.role === "user") {
        content.push(
          part.mediaType.startsWith("image/")
            ? { type: "input_image", image_url: part.url, detail: "auto" }
            : {
                type: "input_file",
                file_url: part.url,
                ...(part.filename && { filename: part.filename }),
              },
        );
      } else if (part.type === "step-start") {
        flush();
      } else if (part.type === "reasoning") {
        if (part.state === "streaming")
          invalidMessage("Append completed reasoning, not streaming UI message parts");
        flush();
        items.push({ type: "reasoning", summary: [{ type: "summary_text", text: part.text }] });
      } else if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
        if (message.role !== "assistant")
          invalidMessage("Tool parts require an assistant UI message");
        flush();
        const tool = part as unknown as {
          type: string;
          toolName?: string;
          toolCallId: string;
          input?: unknown;
          output?: unknown;
          errorText?: string;
          state: string;
        };
        const name = tool.type === "dynamic-tool" ? tool.toolName : tool.type.slice(5);
        if (
          !name ||
          !tool.toolCallId ||
          !["input-available", "output-available", "output-error", "output-denied"].includes(
            tool.state,
          )
        ) {
          invalidMessage("Tool parts require a name, call ID, and complete arguments");
        }
        if (tool.input === undefined)
          invalidMessage("Tool arguments are missing; append a completed tool part");
        items.push({
          type: "function_call",
          name,
          call_id: tool.toolCallId,
          arguments: jsonValue(tool.input),
        });
        if (tool.state === "output-available") {
          if (!Object.hasOwn(tool, "output")) invalidMessage("Completed tool output is missing");
          items.push({
            type: "function_call_output",
            call_id: tool.toolCallId,
            output: typeof tool.output === "string" ? tool.output : jsonValue(tool.output),
          });
        } else if (tool.state === "output-error" || tool.state === "output-denied") {
          items.push({
            type: "function_call_output",
            call_id: tool.toolCallId,
            output: jsonValue({
              error:
                tool.errorText ??
                (tool.state === "output-denied"
                  ? "Tool execution denied"
                  : "Tool execution failed"),
            }),
          });
        }
      } else if (part.type.startsWith("data-")) {
        // Application data parts are UI metadata, not model conversation content.
        continue;
      } else {
        invalidMessage(`UI message part '${part.type}' cannot be appended to Gateway history`);
      }
    }
    flush();
  }
  return items;
}
