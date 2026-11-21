import { describe, expect, it } from "vitest";
import type { Message } from "../../../types";
import { langGraphMessageFormat } from "../langgraph-message-format";
import { openAIConversationMessageFormat } from "../openai-conversation-message-format";
import { openAIMessageFormat } from "../openai-message-format";
import { vercelAIMessageFormat } from "../vercel-ai-message-format";

const thread: Message[] = [
  { id: "u1", role: "user", content: "hi" },
  { id: "r1", role: "reasoning", content: "the user greeted me" },
  { id: "a1", role: "assistant", content: "hello" },
];

describe("outbound message formats drop reasoning messages", () => {
  it("openAIMessageFormat", () => {
    expect(openAIMessageFormat.toApi(thread)).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
  });

  it("langGraphMessageFormat", () => {
    expect(langGraphMessageFormat.toApi(thread)).toEqual([
      { type: "human", content: "hi" },
      { type: "ai", content: "hello" },
    ]);
  });

  it("openAIConversationMessageFormat", () => {
    const items = openAIConversationMessageFormat.toApi(thread) as Array<{ role?: string }>;
    expect(items.map((i) => i.role)).toEqual(["user", "assistant"]);
  });

  it("vercelAIMessageFormat", () => {
    const items = vercelAIMessageFormat.toApi(thread) as Array<{ role: string }>;
    expect(items.map((i) => i.role)).toEqual(["user", "assistant"]);
  });
});
