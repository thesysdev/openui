import { AGUIEvent, StreamProtocolAdapter } from "../../types";

const normalizeEols = (chunk: string) => chunk.replace(/\r\n/g, "\n");

const stripOptionalLeadingSpace = (value: string) => (value.startsWith(" ") ? value.slice(1) : value);

type SSEBlock = {
  data: string;
};

const parseSSEBlock = (block: string): SSEBlock => {
  const dataLines: string[] = [];

  for (const rawLine of block.split("\n")) {
    if (!rawLine) continue;
    if (rawLine.startsWith(":")) continue; // comment / keepalive

    if (rawLine.startsWith("data:")) {
      dataLines.push(stripOptionalLeadingSpace(rawLine.slice(5)));
    }
  }

  return { data: dataLines.join("\n") };
};

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += normalizeEols(decoder.decode(value, { stream: true }));

      // SSE events are separated by a blank line
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const { data } = parseSSEBlock(block);
        const payload = data.trim();
        if (!payload) continue;
        if (payload === "[DONE]") return;

        try {
          yield JSON.parse(payload) as AGUIEvent;
        } catch (e) {
          // Best-effort: malformed events should not kill streaming.
          // (Servers can occasionally emit partial JSON due to upstream bugs.)
          console.warn("[OpenUI] Failed to parse AG-UI SSE event", e);
        }
      }
    }

    // Flush any final complete block if the stream ended without an extra delimiter.
    const final = buffer.trim();
    if (final) {
      const { data } = parseSSEBlock(final);
      const payload = data.trim();
      if (payload && payload !== "[DONE]") {
        try {
          yield JSON.parse(payload) as AGUIEvent;
        } catch {
          // ignore
        }
      }
    }
  },
});
