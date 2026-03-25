import type { Message } from "../../types/message";
import type { MessageFormat } from "../../types/messageFormat";

export const mastraMessageFormat: MessageFormat = {
  toApi: (messages: Message[]) => {
    return messages.map((m) => {
      let text = "";
      if (typeof m.content === "string") {
        text = m.content;
      } else if (Array.isArray(m.content)) {
        const textContent = m.content.find((c) => c.type === "text");
        text = textContent?.text ?? "";
      }

      return {
        role: m.role,
        content: text,
      };
    });
  },
  fromApi: (data: unknown) => {
    return Array.isArray(data) ? (data as Message[]) : [];
  },
};
