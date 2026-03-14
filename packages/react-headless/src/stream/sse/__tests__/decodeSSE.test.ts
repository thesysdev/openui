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

  it("uses strict framing (does not flush final partial block at EOF)", async () => {
    const res = responseFromChunks(["data: partial-without-delimiter"]);
    await expect(collect(decodeSSE(res))).resolves.toEqual([]);
  });
});
