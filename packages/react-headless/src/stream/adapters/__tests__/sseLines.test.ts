import { describe, expect, it } from "vitest";
import { sseData, sseDataPayloads, sseLineIterator } from "../_shared/sseLines";

function responseFromChunks(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream);
}

async function collect(res: Response): Promise<string[]> {
  const out: string[] = [];
  for await (const line of sseLineIterator(res)) out.push(line);
  return out;
}

describe("sseLineIterator", () => {
  it("reassembles a line split across network chunks", async () => {
    // "data: line1" is split mid-token between two chunks.
    const res = responseFromChunks(["da", "ta: line1\nda", "ta: line2\n"]);
    expect(await collect(res)).toEqual(["data: line1", "data: line2"]);
  });

  it("flushes a trailing line with no final newline", async () => {
    const res = responseFromChunks(["data: a\n", "data: b"]);
    expect(await collect(res)).toEqual(["data: a", "data: b"]);
  });

  it("skips blank lines", async () => {
    const res = responseFromChunks(["data: a\n\n\n", "data: b\n"]);
    expect(await collect(res)).toEqual(["data: a", "data: b"]);
  });

  it("handles a JSON event split exactly at a brace across chunks", async () => {
    const res = responseFromChunks(['data: {"hello":', '"world"}\n']);
    expect(await collect(res)).toEqual(['data: {"hello":"world"}']);
  });
});

describe("sseData", () => {
  it("strips the one optional space after the colon, per the SSE spec", () => {
    expect(sseData('data: {"a":1}')).toBe('{"a":1}');
    expect(sseData('data:{"a":1}')).toBe('{"a":1}');
    expect(sseData("data: [DONE]\r")).toBe("[DONE]");
    expect(sseData("data:")).toBe("");
  });

  it("returns undefined for every other line", () => {
    expect(sseData("event: messages")).toBeUndefined();
    expect(sseData(": keep-alive")).toBeUndefined();
    expect(sseData('{"error":{}}')).toBeUndefined();
  });
});

describe("sseDataPayloads", () => {
  async function payloads(chunks: string[]): Promise<string[]> {
    const out: string[] = [];
    for await (const p of sseDataPayloads(responseFromChunks(chunks))) out.push(p);
    return out;
  }

  it("yields data payloads and skips empty ones and [DONE]", async () => {
    expect(await payloads(["data: a\n\ndata:\n\nevent: x\ndata:b\n\ndata: [DONE]\n\n"])).toEqual([
      "a",
      "b",
    ]);
  });

  it("yields a body with no data lines once, when it is a JSON object", async () => {
    expect(await payloads(['{\n  "error": {"message": "x"}\n}'])).toEqual([
      '{\n  "error": {"message": "x"}\n}',
    ]);
    expect(await payloads(["<html>502</html>"])).toEqual([]);
    expect(await payloads([": keep-alive\n\n"])).toEqual([]);
  });
});
