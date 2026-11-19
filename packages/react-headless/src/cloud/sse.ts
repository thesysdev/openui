/**
 * A minimal server-sent events reader over `fetch`.
 *
 * `EventSource` can't send the frontend-token header, so streams are read from
 * a `fetch` body instead. Handles `id:`, `event:` and multi-line `data:`
 * fields, `:` comments, and both `\n` and `\r\n` line endings.
 */

export interface SseMessage {
  id?: string;
  event: string;
  data: string;
}

export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let id: string | undefined;
  let event = "";
  let data: string[] = [];

  const dispatch = (): SseMessage | null => {
    if (data.length === 0 && !event) return null;
    const message: SseMessage = { id, event: event || "message", data: data.join("\n") };
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
