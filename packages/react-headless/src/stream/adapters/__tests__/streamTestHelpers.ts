import type { AGUIEvent, Message, StreamProtocolAdapter } from "../../../types";
import { processStreamedMessage } from "../../processStreamedMessage";

/** A streamed Response whose body arrives as the given chunks, one network read each. */
export function makeResponse(
  chunks: string | string[],
  contentType = "text/event-stream",
): Response {
  const list = typeof chunks === "string" ? [chunks] : chunks;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of list) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": contentType } });
}

export async function collect(iterable: AsyncIterable<AGUIEvent>): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

export const types = (events: AGUIEvent[]) => events.map((e) => e.type);
export const sse = (record: unknown) => `data: ${JSON.stringify(record)}\n\n`;
export const sseNoSpace = (record: unknown) => `data:${JSON.stringify(record)}\n\n`;
export const ndjson = (record: unknown) => `${JSON.stringify(record)}\n`;

/** A Chat Completions stream chunk with one choice. */
export const completionChunk = (delta: Record<string, unknown>, finish: string | null = null) => ({
  id: "chatcmpl-1",
  object: "chat.completion.chunk",
  created: 1,
  model: "m",
  choices: [{ index: 0, delta, finish_reason: finish }],
});

/** A `setTimeout(0)` wrapper, for awaiting async store updates (see AGENTS.md › Testing). */
export const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** processStreamedMessage batches with requestAnimationFrame, which Node lacks. */
export function installAnimationFrame() {
  const g = globalThis as unknown as {
    requestAnimationFrame?: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
  };
  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number;
    g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
}

/** Runs a response through an adapter and the real consumer, as AgentInterface does. */
export async function consume(adapter: StreamProtocolAdapter, response: Response) {
  const messages: Message[] = [];
  const upsert = (m: Message) => {
    const i = messages.findIndex((x) => x.id === m.id);
    if (i >= 0) messages[i] = m;
    else messages.push(m);
  };
  let error: Error | undefined;
  try {
    await processStreamedMessage({
      response,
      adapter,
      createMessage: upsert,
      updateMessage: upsert,
    });
  } catch (e) {
    error = e as Error;
  }
  await flushPromises();
  return { messages, error };
}
