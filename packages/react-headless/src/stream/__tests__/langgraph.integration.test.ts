import { beforeAll, describe, expect, it } from "vitest";
import type { Message } from "../../types";
import { langGraphAdapter } from "../adapters/langgraph";
import { langGraphMessageFormat } from "../formats/langgraph-message-format";
import { processStreamedMessage } from "../processStreamedMessage";

beforeAll(() => {
  const globalWithAnimationFrame = globalThis as unknown as {
    requestAnimationFrame?: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
  };

  if (typeof globalWithAnimationFrame.requestAnimationFrame !== "function") {
    globalWithAnimationFrame.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 0) as unknown as number;
    globalWithAnimationFrame.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

describe("LangGraph stream integration", () => {
  it("keeps a tool-loop turn ordered and valid for the next request", async () => {
    const messages: Message[] = [];
    const response = new Response(
      sse("messages", [
        {
          type: "ai",
          id: "ai-call",
          content: "",
          tool_calls: [{ id: "call-1", name: "get_weather", args: { location: "Berlin" } }],
        },
        { langgraph_node: "model", langgraph_step: 1 },
      ]) +
        sse("messages", [
          {
            type: "tool",
            id: "tool-result",
            content: '{"temperature_c":21}',
            tool_call_id: "call-1",
            status: "success",
          },
          { langgraph_node: "tools", langgraph_step: 2 },
        ]) +
        sse("messages", [
          { type: "ai", id: "ai-final", content: "It is 21°C." },
          { langgraph_node: "model", langgraph_step: 3 },
        ]) +
        sse("end", null),
      { headers: { "Content-Type": "text/event-stream" } },
    );

    await processStreamedMessage({
      response,
      adapter: langGraphAdapter(),
      createMessage: (message) => messages.push(message),
      updateMessage: (message) => {
        const index = messages.findIndex((candidate) => candidate.id === message.id);
        if (index !== -1) messages[index] = message;
      },
    });

    expect(messages.map((message) => message.role)).toEqual(["assistant", "tool", "assistant"]);
    expect(messages[0]).toMatchObject({
      role: "assistant",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          function: { name: "get_weather", arguments: '{"location":"Berlin"}' },
        },
      ],
    });
    expect(messages[1]).toMatchObject({
      role: "tool",
      toolCallId: "call-1",
      content: '{"temperature_c":21}',
    });
    expect(messages[2]).toMatchObject({ role: "assistant", content: "It is 21°C." });

    messages.push({ id: "next-user", role: "user", content: "How about Paris?" });
    expect(
      (langGraphMessageFormat.toApi(messages) as Array<{ type: string }>).map(
        (message) => message.type,
      ),
    ).toEqual(["ai", "tool", "ai", "human"]);
  });
});
