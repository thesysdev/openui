import { describe, expect, it } from "vitest";
import { createCloudApi } from "./api";

/** A fetch that answers with these SSE pieces, cut wherever the test says. */
const sse = (pieces: string[]) => async () =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const piece of pieces) controller.enqueue(new TextEncoder().encode(piece));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );

describe("CloudApi stream", () => {
  it("yields each data event, across cut lines, until [DONE]", async () => {
    const api = createCloudApi({
      apiKey: "k",
      fetch: sse([
        'data: {"a":1}\n\nda',
        'ta: {"a":2}\n\n',
        "data: [DONE]\n\n",
        'data: {"a":3}\n\n',
      ]),
    });
    const events: unknown[] = [];
    for await (const event of api.stream("/x", {})) events.push(event);
    expect(events).toEqual([{ a: 1 }, { a: 2 }]);
  });
});
