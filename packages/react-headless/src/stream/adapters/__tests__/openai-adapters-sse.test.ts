import { describe, expect, it, vi } from "vitest";
import { EventType } from "../../../types";
import { openAIAdapter } from "../openai-completions";
import { openAIResponsesAdapter } from "../openai-responses";

const responseFromChunks = (chunks: string[]) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(encoder.encode(chunk));
      c.close();
    },
  });
  return new Response(stream);
};

describe("OpenAI SSE adapters", () => {
  it("openAIAdapter parses SSE events split across chunks", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "msg-1" } as any);

    const payload = JSON.stringify({
      choices: [{ delta: { role: "assistant", content: "hi" }, finish_reason: "stop" }],
    });

    const res = responseFromChunks(["data: ", payload.slice(0, 20), payload.slice(20), "\n\n", "data: [DONE]\n\n"]);

    const events: any[] = [];
    for await (const e of openAIAdapter().parse(res)) events.push(e);

    expect(events.map((e) => e.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
    expect(events[1]).toMatchObject({ delta: "hi", messageId: "msg-1" });
  });

  it("openAIResponsesAdapter parses SSE events split across chunks", async () => {
    const itemAdded = JSON.stringify({
      type: "response.output_item.added",
      item: { type: "message", role: "assistant", id: "m1" },
    });
    const delta = JSON.stringify({
      type: "response.output_text.delta",
      item_id: "m1",
      delta: "hello",
    });
    const done = JSON.stringify({
      type: "response.output_text.done",
      item_id: "m1",
    });

    const res = responseFromChunks([
      "data: ",
      itemAdded,
      "\n\n",
      "data: ",
      delta.slice(0, 10),
      delta.slice(10),
      "\n\n",
      "data: ",
      done,
      "\n\n",
      "data: [DONE]\n\n",
    ]);

    const events: any[] = [];
    for await (const e of openAIResponsesAdapter().parse(res)) events.push(e);

    expect(events.map((e) => e.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
    expect(events[1]).toMatchObject({ messageId: "m1", delta: "hello" });
  });
});
