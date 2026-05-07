import type { LLMToolCall } from "@/lib/llm-stream";
import type { ToolCallEntry } from "@/lib/mcp-tracker";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  text?: string;
  hasCode: boolean;
  llmTools?: LLMToolCall[];
  runtimeTools?: ToolCallEntry[];
}
