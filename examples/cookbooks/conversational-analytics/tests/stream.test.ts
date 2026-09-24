import assert from "node:assert/strict";
import { test } from "node:test";
import { readDashboardStream } from "../src/lib/read-stream";

function stream(text: string) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Split every byte, including the multi-byte pound sign.
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
}
test("assembles UTF-8 chunks and requires explicit completion", async () => {
  let result = "";
  await readDashboardStream(stream('{"type":"delta","text":"£10"}\n{"type":"done"}\n'), (text) => {
    result = text;
  });
  assert.equal(result, "£10");
  await assert.rejects(
    readDashboardStream(stream('{"type":"delta","text":"partial"}\n'), () => {}),
    /complete dashboard/,
  );
  await assert.rejects(
    readDashboardStream(stream('{"type":"done"}\n'), () => {}),
    /complete dashboard/,
  );
});
test("surfaces errors arriving after partial output", async () => {
  await assert.rejects(
    readDashboardStream(
      stream('{"type":"delta","text":"root = "}\n{"type":"error","message":"Try again"}\n'),
      () => {},
    ),
    /Try again/,
  );
});
