import { describe, expect, it, vi } from "vitest";
import { EventType, type AGUIEvent } from "../../../types";
import { openAIResponsesAdapter } from "../openai-responses";

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function makeResponse(body: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function collect(iterable: AsyncIterable<AGUIEvent>): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

describe("openAIResponsesAdapter", () => {
  it("throws when response has no body", async () => {
    const adapter = openAIResponsesAdapter();
    const response = new Response(null);
    await expect(async () => {
      for await (const _ of adapter.parse(response)) {
        /* drain */
      }
    }).rejects.toThrow("No response body");
  });

  it("yields text message events from output item and deltas", async () => {
    const adapter = openAIResponsesAdapter();
    const stream =
      sse({
        type: "response.output_item.added",
        item: { id: "msg_1", type: "message", role: "assistant" },
      }) +
      sse({
        type: "response.output_text.delta",
        item_id: "msg_1",
        delta: "Hello, world!",
      }) +
      sse({
        type: "response.output_text.done",
        item_id: "msg_1",
      });

    const events = await collect(adapter.parse(makeResponse(stream)));
    expect(events).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "Hello, world!",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "msg_1",
      },
    ]);
  });

  it("invokes onUsage callback with token usage details on response.completed", async () => {
    const onUsage = vi.fn();
    const adapter = openAIResponsesAdapter({ onUsage });

    const usage = {
      input_tokens: 42,
      output_tokens: 18,
      total_tokens: 60,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens_details: { reasoning_tokens: 0 },
    };

    const stream =
      sse({
        type: "response.output_item.added",
        item: { id: "msg_1", type: "message", role: "assistant" },
      }) +
      sse({
        type: "response.completed",
        response: {
          id: "resp_123",
          usage,
        },
      });

    await collect(adapter.parse(makeResponse(stream)));
    expect(onUsage).toHaveBeenCalledTimes(1);
    expect(onUsage).toHaveBeenCalledWith(usage);
  });

  it("does not invoke onUsage if response.completed does not contain usage", async () => {
    const onUsage = vi.fn();
    const adapter = openAIResponsesAdapter({ onUsage });

    const stream = sse({
      type: "response.completed",
      response: {
        id: "resp_123",
      },
    });

    await collect(adapter.parse(makeResponse(stream)));
    expect(onUsage).not.toHaveBeenCalled();
  });

  it("safely completes when onUsage is not provided", async () => {
    const adapter = openAIResponsesAdapter();

    const stream = sse({
      type: "response.completed",
      response: {
        id: "resp_123",
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
        },
      },
    });

    const events = await collect(adapter.parse(makeResponse(stream)));
    expect(events).toEqual([]);
  });
});
