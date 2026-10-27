import type { StreamAdapter } from "./types";

// Convert a supported event stream to SSE without changing its event objects.
export function toSSE<T>(
  chunks: AsyncIterable<T>,
  protocol: StreamAdapter<unknown>["protocol"],
  cancel: (reason?: unknown) => void,
): Response {
  const iterator = chunks[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      // Pull and frame one native event at a time, respecting consumer backpressure.
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
          }
        } catch (error) {
          controller.error(error);
        }
      },
      // Stop upstream work when the HTTP consumer disconnects.
      cancel(reason) {
        cancel(reason);
        void iterator.return?.().catch(() => {});
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        ...(protocol === "vercel-ai" && { "x-vercel-ai-ui-message-stream": "v1" }),
      },
    },
  );
}

export interface SSEMessage {
  id?: string;
  event: string;
  data: string;
}

// Read an SSE body: `id:`, `event:` and multi-line `data:` fields, `:` comments, `\n` or `\r\n`.
export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let id: string | undefined;
  let event = "";
  let data: string[] = [];

  const dispatch = (): SSEMessage | null => {
    if (!data.length && !event) return null;
    const message: SSEMessage = { id, event: event || "message", data: data.join("\n") };
    event = "";
    data = [];
    return message;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.search(/\r?\n/);
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(buffer[newline] === "\r" ? newline + 2 : newline + 1);
        if (line === "") {
          const message = dispatch();
          if (message) yield message;
        } else if (!line.startsWith(":")) {
          const colon = line.indexOf(":");
          const field = colon === -1 ? line : line.slice(0, colon);
          let value = colon === -1 ? "" : line.slice(colon + 1);
          if (value.startsWith(" ")) value = value.slice(1);
          if (field === "data") data.push(value);
          else if (field === "event") event = value;
          else if (field === "id") id = value;
        }
        newline = buffer.search(/\r?\n/);
      }
    }
    const message = dispatch();
    if (message) yield message;
  } finally {
    reader.releaseLock();
  }
}
