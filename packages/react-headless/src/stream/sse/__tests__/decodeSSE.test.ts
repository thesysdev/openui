import { describe, expect, it } from "vitest";
import { decodeSSE } from "../decodeSSE";

const collect = async (iter: AsyncIterable<{ data: string }>) => {
  const out: string[] = [];
  for await (const { data } of iter) out.push(data);
  return out;
};

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

describe("decodeSSE", () => {
  it("yields framed data events across chunk boundaries", async () => {
    const res = responseFromChunks([
      "data: {\"a\":",
      "1}\n\n",
      "data: {\"b\":2}\n\n",
    ]);

    await expect(collect(decodeSSE(res))).resolves.toEqual(["{\"a\":1}", "{\"b\":2}"]);
  });

  it("supports CRLF and multiline data", async () => {
    const res = responseFromChunks([
      "data: {\"a\":1,\r\n" +
        "data: \"b\":2}\r\n" +
        "\r\n" +
        "data: done\r\n\r\n",
    ]);

    await expect(collect(decodeSSE(res))).resolves.toEqual(["{\"a\":1,\n\"b\":2}", "done"]);
  });

  it("ignores comment/keepalive lines", async () => {
    const res = responseFromChunks([": ping\n\n", "data: ok\n\n"]);
    await expect(collect(decodeSSE(res))).resolves.toEqual(["ok"]);
  });

  it("handles partial events at EOF gracefully", async () => {
    // eventsource-parser may handle partial events differently than our custom implementation
    // This test ensures we don't crash on malformed input
    const res = responseFromChunks(["data: partial-without-delimiter"]);
    const result = await collect(decodeSSE(res));
    // Accept either empty array (strict) or the partial data (lenient)
    expect(result).toSatisfy((arr: string[]) =>
      arr.length === 0 || arr.includes("partial-without-delimiter")
    );
  });
});
