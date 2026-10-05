import type { Message } from "@openuidev/react-ui";

export interface MiniApp {
  id: string;
  version: number;
  name: string;
  response: string;
  updatedAt: string;
}

export function miniAppsIn(messages: Message[]): MiniApp[] {
  return messages.flatMap((message) => {
    if (message.role !== "tool" || !message.content) return [];
    try {
      const value = JSON.parse(message.content) as MiniApp;
      return value.id && value.response && value.version ? [value] : [];
    } catch {
      return [];
    }
  });
}
