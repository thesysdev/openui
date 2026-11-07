export type ApiChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

export type AssistantMessageStatus = "complete" | "error" | "stopped" | "streaming";

export type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  status: AssistantMessageStatus;
  error?: string;
};

export type ChatMessage = AssistantMessage | UserMessage;
