import { createParser, type ParsedEvent } from "eventsource-parser";

export type SSEEvent = {
  data: string;
};

/**
 * SSE decoder using eventsource-parser:
 * - buffers across chunks
 * - respects blank-line-delimited SSE framing
 * - supports CRLF and multiline `data:`
 * - battle-tested SSE parsing
 */
export async function* decodeSSE(response: Response): AsyncIterable<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const events: SSEEvent[] = [];
  let resolveNext: (() => void) | null = null;

  const parser = createParser({
    onEvent: (event: ParsedEvent) => {
      events.push({ data: event.data });
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    },
  });

  const readerPromise = (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
    } finally {
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    }
  })();

  try {
    while (true) {
      if (events.length > 0) {
        yield events.shift()!;
      } else {
        const isDone = await Promise.race([
          readerPromise.then(() => true),
          new Promise<false>((resolve) => {
            resolveNext = () => resolve(false);
          }),
        ]);
        if (isDone && events.length === 0) break;
      }
    }
  } finally {
    await readerPromise;
  }
}
