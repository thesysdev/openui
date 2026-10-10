import { errorFrameToRunError } from "./errorFrame";

/**
 * Shared line iterator for streamed HTTP responses.
 *
 * Buffers the leftover partial line between network chunks so an SSE event (or
 * NDJSON record) split across two `reader.read()` results is reassembled rather
 * than silently dropped. The reference implementation lived in
 * `openai-readable-stream.ts`; this extracts it so `ag-ui.ts` and
 * `openai-completions.ts` share the same correct buffering.
 *
 * Yields each complete line verbatim (caller strips any `data: ` SSE prefix);
 * blank lines are skipped. The trailing buffered line is flushed on stream end.
 *
 * @internal
 */
export async function* sseLineIterator(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the straddling partial line (everything after the last "\n") for the
    // next chunk; it may be completed by the bytes that follow.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }

  // Flush the tail — a stream that ends without a trailing newline still has a
  // complete final line sitting in the buffer.
  if (buffer.trim()) yield buffer;
}

/**
 * The payload of an SSE `data:` line, or `undefined` for any other line.
 *
 * The SSE spec strips one optional space after the colon, so `data:{…}` and
 * `data: {…}` carry the same value. Servers written with Go's
 * `fmt.Fprintf(w, "data:%s\n\n")`, several Python frameworks and hand-rolled
 * routes omit the space; matching only `"data: "` dropped every one of their
 * events.
 *
 * @internal
 */
export function sseData(line: string): string | undefined {
  if (!line.startsWith("data:")) return undefined;
  const value = line.slice(5);
  return (value.startsWith(" ") ? value.slice(1) : value).trim();
}

/** Upper bound on the size of a non-SSE body the fallback below will inspect. */
const MAX_PLAIN_BODY = 64 * 1024;

/**
 * Yields the payload of every SSE `data:` line, skipping empty payloads and
 * `[DONE]` sentinels.
 *
 * A body with no `data:` line at all is not SSE — typically a route (or a proxy
 * in front of it) that answered a failure with a plain JSON body under HTTP
 * 200. When such a body (up to 64 KB) is an `{"error":{…}}` object, its text is
 * yielded once at the end as a single payload, so the adapter maps it exactly
 * like the same record arriving in-stream instead of ending on a blank turn.
 * Any other non-SSE body is ignored, as before.
 *
 * @internal
 */
export async function* sseDataPayloads(response: Response): AsyncGenerator<string> {
  let sawData = false;
  let plain = "";
  let plainTooLarge = false;

  for await (const line of sseLineIterator(response)) {
    const payload = sseData(line);
    if (payload === undefined) {
      if (!sawData && !plainTooLarge) {
        plain += `${line}\n`;
        plainTooLarge = plain.length > MAX_PLAIN_BODY;
      }
      continue;
    }
    sawData = true;
    if (!payload || payload === "[DONE]") continue;
    yield payload;
  }

  if (!sawData && !plainTooLarge) {
    const body = plain.trim();
    if (isErrorBody(body)) yield body;
  }
}

function isErrorBody(body: string): boolean {
  if (!body.startsWith("{")) return false;
  try {
    return errorFrameToRunError(JSON.parse(body)) !== undefined;
  } catch {
    return false;
  }
}
