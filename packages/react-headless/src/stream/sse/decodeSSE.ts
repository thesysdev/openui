export type SSEEvent = {
  data: string;
};

const normalizeEols = (chunk: string) => chunk.replace(/\r\n/g, "\n");

const stripOptionalLeadingSpace = (value: string) => (value.startsWith(" ") ? value.slice(1) : value);

const parseSSEBlockData = (block: string): string => {
  const dataLines: string[] = [];

  for (const rawLine of block.split("\n")) {
    if (!rawLine) continue;
    if (rawLine.startsWith(":")) continue; // comment / keepalive

    if (rawLine.startsWith("data:")) {
      dataLines.push(stripOptionalLeadingSpace(rawLine.slice(5)));
    }
  }

  return dataLines.join("\n");
};

/**
 * Minimal SSE decoder:
 * - buffers across chunks
 * - respects blank-line-delimited SSE framing
 * - supports CRLF and multiline `data:`
 * - ignores final partial buffer at EOF (strict framing)
 */
export async function* decodeSSE(response: Response): AsyncIterable<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += normalizeEols(decoder.decode(value, { stream: true }));

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const data = parseSSEBlockData(block);
      const payload = data.trim();
      if (!payload) continue;
      yield { data: payload };
    }
  }
}
